import { useState, useEffect } from 'react';
import { 
  loadApiUsage, 
  calculateRemainingUsage, 
  loadConversationTokens,
  getConversationTokenWarningLevel,
  getTotalConversationTokens,
  getRateLimitsForPlan
} from '../services/apiUsageTracker';
import type {
  ApiUsageData,
  ConversationTokensMap
} from '../services/apiUsageTracker';
import { Icon } from '../../../components/common/Icon';
import { FaChartBar, FaExclamationTriangle, FaInfoCircle, FaClock, FaKey } from 'react-icons/fa';
import '../styles/ApiUsageDashboard.css';

/**
 * Props for the ApiUsageDashboard component.
 * @property {string | null} activeConversationId - The currently active conversation ID
 * @property {boolean} isOpen - Whether the dashboard is visible
 * @property {() => void} onClose - Handler to close the dashboard
 */
interface ApiUsageDashboardProps {
  activeConversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Displays API usage statistics, token consumption, and rate limits for the current user.
 * Shows usage progress bars and conversation token details.
 * @param {ApiUsageDashboardProps} props
 */
export default function ApiUsageDashboard({ 
  activeConversationId, 
  isOpen, 
  onClose 
}: ApiUsageDashboardProps) {
  const [usage, setUsage] = useState<ApiUsageData | null>(null);
  const [conversationTokens, setConversationTokens] = useState<ConversationTokensMap>({});
  const [remainingUsage, setRemainingUsage] = useState<{
    dailyRequestsPercent: number;
    dailyTokensPercent: number;
    monthlyRequestsPercent: number;
    monthlyTokensPercent: number;
    rateLimitPercent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'errors'>('overview');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const apiUsage = await loadApiUsage();
      const tokens = await loadConversationTokens();
      
      setUsage(apiUsage);
      setConversationTokens(tokens);
      
      if (apiUsage) {
        setRemainingUsage(calculateRemainingUsage(apiUsage));
      }
      
      setLoading(false);
    }
    
    if (isOpen) {
      fetchData();
      
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen || !usage || !remainingUsage) {
    return null;
  }

  /**
   * Formats a timestamp as a local date string.
   * @param {number} timestamp
   * @returns {string}
   */
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };
  
  /**
   * Formats the time remaining until a reset event.
   * @param {number} resetTime
   * @returns {string}
   */
  const formatTimeRemaining = (resetTime: number) => {
    if (!resetTime) return 'N/A';
    
    const now = Date.now();
    if (now >= resetTime) return 'Ready';
    
    const secondsRemaining = Math.ceil((resetTime - now) / 1000);
    return `${secondsRemaining}s`;
  };
  
  /**
   * Returns a color string based on usage percent.
   * @param {number} percent
   * @returns {string}
   */
  const getColorForPercentage = (percent: number) => {
    if (percent <= 20) return 'var(--color-danger)';
    if (percent <= 50) return 'var(--color-warning)';
    return 'var(--color-success)';
  };
  
  /**
   * Renders a progress bar for usage stats.
   * @param {object} props
   * @param {number} props.percent - Percent filled
   * @param {string} props.label - Label for the bar
   */
  const ProgressBar = ({ percent, label }: { percent: number, label: string }) => (
    <div className="progress-container">
      <div className="progress-label">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ 
            width: `${percent}%`, 
            backgroundColor: getColorForPercentage(percent) 
          }}
        />
      </div>
    </div>
  );
  
  const getActiveConversationStatus = () => {
    if (!activeConversationId) return null;
    
    const conversationData = conversationTokens[activeConversationId];
    if (!conversationData) return null;
    
    const totalTokens = getTotalConversationTokens(activeConversationId, conversationTokens);
    const warningLevel = getConversationTokenWarningLevel(activeConversationId, conversationTokens);
    
    return {
      totalTokens,
      inputTokens: conversationData.inputTokens,
      outputTokens: conversationData.outputTokens,
      warningLevel
    };
  };
  
  const activeConvoStatus = getActiveConversationStatus();
  
  const sortedConversations = Object.entries(conversationTokens)
    .sort((a, b) => {
      const totalA = a[1].inputTokens + a[1].outputTokens;
      const totalB = b[1].inputTokens + b[1].outputTokens;
      
      return totalB - totalA;
    });

  return (
    <div className={`api-usage-dashboard ${isOpen ? 'open' : ''}`}>
      <div className="dashboard-header">
        <h2>
          <Icon icon={FaChartBar} size={20} /> 
          API Usage Dashboard
        </h2>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          <Icon icon={FaChartBar} size={14} /> Overview
        </button>
        <button 
          className={activeTab === 'conversations' ? 'active' : ''} 
          onClick={() => setActiveTab('conversations')}
        >
          <Icon icon={FaKey} size={14} /> Conversation Tokens
        </button>
        <button 
          className={activeTab === 'errors' ? 'active' : ''} 
          onClick={() => setActiveTab('errors')}
        >
          <Icon icon={FaExclamationTriangle} size={14} /> Errors ({usage.errors.length})
        </button>
      </div>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading usage data...</div>
        ) : activeTab === 'overview' ? (
          <>
            <div className="section">
              <h3>Plan: {usage.plan}</h3>
              <div className="rate-limit-info">
                <div className="rate-limit-item">
                  <Icon icon={FaClock} size={14} />
                  <span>Rate limit resets in: {formatTimeRemaining(usage.rateLimitReset)}</span>
                </div>
                <div className="rate-limit-item">
                  <Icon icon={FaInfoCircle} size={14} />
                  <span>Requests remaining: {usage.rateLimitRemaining}/{getRateLimitsForPlan(usage.plan).requestsPerMinute} per minute</span>
                </div>
              </div>
            </div>
            
            <div className="section">
              <h3>Daily Usage</h3>
              <ProgressBar 
                percent={remainingUsage.dailyRequestsPercent} 
                label={`Requests: ${usage.dailyRequests}/${getRateLimitsForPlan(usage.plan).requestsPerDay}`} 
              />
              <ProgressBar 
                percent={remainingUsage.dailyTokensPercent} 
                label={`Tokens: ${usage.dailyInputTokens + usage.dailyOutputTokens}/${getRateLimitsForPlan(usage.plan).tokensPerDay}`} 
              />
            </div>
            
            <div className="section">
              <h3>Monthly Usage</h3>
              <ProgressBar 
                percent={remainingUsage.monthlyRequestsPercent} 
                label={`Requests: ${usage.monthlyRequests}/${getRateLimitsForPlan(usage.plan).requestsPerDay * 30}`} 
              />
              <ProgressBar 
                percent={remainingUsage.monthlyTokensPercent} 
                label={`Tokens: ${usage.monthlyInputTokens + usage.monthlyOutputTokens}/${getRateLimitsForPlan(usage.plan).tokensPerDay * 30}`} 
              />
            </div>
            
            {activeConvoStatus && (
              <div className="section">
                <h3>Current Conversation</h3>
                <div className={`conversation-status ${activeConvoStatus.warningLevel}`}>
                  {activeConvoStatus.warningLevel !== 'none' && (
                    <div className="warning-badge">
                      <Icon icon={FaExclamationTriangle} size={14} />
                      {activeConvoStatus.warningLevel === 'critical' 
                        ? 'Approaching token limit!' 
                        : 'High token usage'}
                    </div>
                  )}
                  <div className="token-details">
                    <div>Total tokens: {activeConvoStatus.totalTokens.toLocaleString()}</div>
                    <div>Input: {activeConvoStatus.inputTokens.toLocaleString()}</div>
                    <div>Output: {activeConvoStatus.outputTokens.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="section timestamps">
              <div>First daily request: {formatDate(usage.dailyFirstRequest)}</div>
              <div>Last request: {formatDate(usage.lastRequestTime)}</div>
              <div>Last response: {formatDate(usage.lastResponseTime)}</div>
            </div>
          </>
        ) : activeTab === 'conversations' ? (
          <>
            <div className="section">
              <h3>Conversation Token Usage</h3>
              <p className="section-description">
                This shows token usage per conversation. Conversations approaching the token limit may experience degraded performance or context loss.
              </p>
              
              {sortedConversations.length === 0 ? (
                <div className="empty-state">No conversation data available</div>
              ) : (
                <div className="conversations-list">
                  {sortedConversations.map(([id, data]) => {
                    const totalTokens = getTotalConversationTokens(id, conversationTokens);
                    const warningLevel = getConversationTokenWarningLevel(id, conversationTokens);
                    const isActive = id === activeConversationId;
                    
                    return (
                      <div 
                        key={id} 
                        className={`conversation-item ${warningLevel} ${isActive ? 'active' : ''}`}
                      >
                        <div className="conversation-item-header">
                          <div className="conversation-title">
                            {isActive ? '▶ Current Conversation' : `Conversation ${id.substring(5, 10)}`}
                          </div>
                          <div className="token-count">
                            {totalTokens.toLocaleString()} tokens
                          </div>
                        </div>
                        
                        <div className="token-breakdown">
                          <div>Input: {data.inputTokens.toLocaleString()}</div>
                          <div>Output: {data.outputTokens.toLocaleString()}</div>
                          <div>Last updated: {formatDate(data.lastUpdated)}</div>
                        </div>
                        
                        {warningLevel !== 'none' && (
                          <div className="warning-message">
                            <Icon icon={FaExclamationTriangle} size={14} />
                            {warningLevel === 'critical' 
                              ? 'This conversation is approaching the token limit. Consider starting a new conversation.'
                              : 'High token usage. The model may lose context of earlier messages.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="section">
              <h3>API Errors</h3>
              {usage.errors.length === 0 ? (
                <div className="empty-state">No errors recorded</div>
              ) : (
                <div className="errors-list">
                  {usage.errors.map((error, index) => (
                    <div key={index} className="error-item">
                      <div className="error-time">{formatDate(error.timestamp)}</div>
                      <div className="error-status">Status: {error.statusCode}</div>
                      <div className="error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
