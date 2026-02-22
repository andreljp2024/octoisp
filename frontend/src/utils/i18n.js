import ptBR from '../i18n/pt-br.json';

// Objeto para armazenar os dicionários de tradução
const dictionaries = {
  'pt-BR': ptBR,
};

/**
 * Função para obter a tradução de uma chave específica
 * @param {string} key - A chave de tradução (ex: 'common.save')
 * @param {string} lang - O código do idioma (padrão: 'pt-BR')
 * @returns {string} - A tradução correspondente
 */
export function t(key, lang = 'pt-BR') {
  const dictionary = dictionaries[lang];
  
  if (!dictionary) {
    console.warn(`Dicionário não encontrado para o idioma: ${lang}`);
    // Retorna a chave original se o dicionário não existir
    return key;
  }

  // Divide a chave por pontos para navegar nos objetos aninhados
  const keys = key.split('.');
  let translation = dictionary;

  for (const k of keys) {
    if (translation && typeof translation === 'object') {
      translation = translation[k];
    } else {
      // Se não encontrar a tradução, retorna a chave original
      console.warn(`Tradução não encontrada para a chave: ${key}`);
      return key;
    }
  }

  // Retorna a tradução encontrada ou a chave original se não for uma string
  return typeof translation === 'string' ? translation : key;
}

/**
 * Função para verificar se um idioma está disponível
 * @param {string} lang - O código do idioma
 * @returns {boolean} - Verdadeiro se o idioma estiver disponível
 */
export function isLanguageAvailable(lang) {
  return !!dictionaries[lang];
}

/**
 * Função para obter os idiomas disponíveis
 * @returns {Array<string>} - Lista de códigos de idioma disponíveis
 */
export function getAvailableLanguages() {
  return Object.keys(dictionaries);
}

/**
 * Função para definir o idioma padrão
 * @param {string} lang - O código do idioma
 * @returns {void}
 */
export function setDefaultLanguage(lang) {
  if (isLanguageAvailable(lang)) {
    localStorage.setItem('defaultLanguage', lang);
  } else {
    console.warn(`Idioma não disponível: ${lang}`);
  }
}

/**
 * Função para obter o idioma padrão
 * @returns {string} - Código do idioma padrão
 */
export function getDefaultLanguage() {
  return localStorage.getItem('defaultLanguage') || 'pt-BR';
}