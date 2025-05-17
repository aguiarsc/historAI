const THINKING_PATTERNS = [
  /^¡?(Claro|Absolutamente|Entendido|Perfecto|Comprendo|Desde luego|Por supuesto|Bien|Genial|Excelente|De acuerdo|Muy bien|Voy a|Puedo|Aquí tienes|Basándome en|Con gusto)/i,
  /^Aquí (te|le) (presento|muestro|dejo|ofrezco|entrego|comparto|va|tienes)/i,
  /^(Generaré|Crearé|Escribiré|Elaboraré|Redactaré|Desarrollaré|Compondré|Produciré)/i,
  /^(Voy|Procedo) a (generar|crear|escribir|elaborar|redactar)/i,
  /^(Sure|Absolutely|Understood|Perfect|I understand|Of course|Certainly|Alright|Great|Excellent|I'll|I will|Here's|Based on|Happy to)/i,
  /^Here (is|are|comes)/i,
  /^(Let me|I'll|I can|I'd be happy to) (create|write|generate|craft|compose|produce|develop)/i
];

const SEPARATOR_PATTERNS = [
  /Aquí (va|tienes|está|te presento|te muestro)( el| la)?:?\s*/i,
  /A continuación:?\s*/i,
  /Comencemos:?\s*/i,
  /Empecemos:?\s*/i,
  /Here (it is|is your|you go|goes):?\s*/i,
  /Let's begin:?\s*/i,
  /Without further ado:?\s*/i,
  /Capítulo \d+:?\s*/i,
  /Chapter \d+:?\s*/i
];
/**
 * Removes common "thinking" or filler patterns from AI responses.
 * @param {string} response
 * @returns {string}
 */
export function removeThinking(response: string): string {
  if (!response) return response;
  
  for (const pattern of SEPARATOR_PATTERNS) {
    const match = response.match(pattern);
    if (match) {
      const separatorIndex = response.indexOf(match[0]);
      if (separatorIndex !== -1) {
        if (/(Chapter|Capítulo) \d+:/.test(match[0])) {
          const parts = response.split(match[0]);
          if (parts.length > 1) {
            return match[0] + parts[1];
          }
        }
        
        return response.substring(separatorIndex + match[0].length).trim();
      }
    }
  }
  
  const paragraphs = response.split(/\n\n+/);
  if (paragraphs.length > 1) {
    for (const pattern of THINKING_PATTERNS) {
      if (pattern.test(paragraphs[0])) {
        return paragraphs.slice(1).join('\n\n').trim();
      }
    }
  }
  
  for (const pattern of THINKING_PATTERNS) {
    if (pattern.test(response.substring(0, 100))) {
      const splitIndex = response.indexOf('\n\n');
      if (splitIndex !== -1 && splitIndex < response.length / 3) {
        return response.substring(splitIndex).trim();
      }
    }
  }
  
  return response;
}

/**
 * Cleans file content by removing thinking patterns and common endings.
 * @param {string} content
 * @returns {string}
 */
export function cleanFileContent(content: string): string {
  let cleanedContent = removeThinking(content);
  
  const commonEndingPatterns = [
    /\n\n+(Espero|Ojalá|Si necesitas|¿Necesitas|¿Te gustaría|¿Quieres|Puedo|Esto debería)/i,
    /\n\n+(I hope|Let me know|If you need|Would you like|Do you want|I can|This should)/i
  ];
  
  for (const pattern of commonEndingPatterns) {
    const match = cleanedContent.match(pattern);
    if (match) {
      const index = cleanedContent.lastIndexOf(match[0]);
      if (index !== -1 && index > cleanedContent.length / 2) {
        cleanedContent = cleanedContent.substring(0, index).trim();
      }
    }
  }
  
  return cleanedContent;
}
