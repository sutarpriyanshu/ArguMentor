// translate.js
const {Translate} = require('@google-cloud/translate').v2;

// Your Google Cloud Project ID
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

// Instantiates a client
const translate = new Translate({projectId});

async function translateText(text, targetLanguage) {
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error('Error translating text:', error);
    return text;
  }
}

module.exports = { translateText };