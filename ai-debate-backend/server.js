const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { translateText } = require('./translate');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/api/debate', async (req, res) => {
  try {
    const { topic, userStance, userArgument, language } = req.body;
    
    const aiStance = userStance === 'for' ? 'against' : 'for';
    
    // Translate user argument to English if it's not in English
    const translatedUserArgument = language !== 'en'
      ? await translateText(userArgument, 'en')
      : userArgument;
    
      let prompt = `We are debating the topic: "${topic}". You are arguing ${aiStance} this topic.
      The user, who is arguing ${userStance} the topic, said: "${translatedUserArgument}"
      Respond to their argument with a counterargument of about 100 words.`;
  
      if (language === 'hi') {
        prompt += " Please provide your response in Hindi.";
      }
  
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
  
      // Truncate the response to roughly 100 words
      const words = text.split(/\s+/);
      const truncatedResponse = words.slice(0, 100).join(' ') + (words.length > 100 ? '...' : '');
  
      // If the language is not Hindi and the AI response is in English, translate it
      const translatedResponse = language === 'hi' && !isHindi(truncatedResponse)
        ? await translateText(truncatedResponse, 'hi')
        : truncatedResponse;
  
      res.json({ aiResponse: translatedResponse });
    } catch (error) {
      console.error('Error generating debate response:', error);
      res.status(500).json({ error: 'An error occurred while generating the debate response.' });
    }
  });
  
  app.post('/api/end-debate', async (req, res) => {
    try {
      const { topic, userStance, debateHistory, language } = req.body;
  
      // Translate the debate history to English if it's not already in English
      const translatedHistory = await Promise.all(debateHistory.map(async (entry) => {
        if (language !== 'en') {
          const translatedText = await translateText(entry.text, 'en');
          return { ...entry, text: translatedText };
        }
        return entry;
      }));
  
      // Prepare the prompt for the AI to evaluate the debate
      const prompt = `
        Evaluate the following debate on the topic: "${topic}".
        The user's stance was: ${userStance}.
        
        Debate history:
        ${translatedHistory.map(entry => `${entry.type.toUpperCase()}: ${entry.text}`).join('\n')}
        
        Based on the arguments presented, provide a score for the user's performance in the debate.
        Score should be between 0 and 100, where 0 is the lowest and 100 is the highest.
        Only return the numeric score, without any additional text.
      `;
  
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const score = parseInt(response.text().trim(), 10);
  
      res.json({ score });
    } catch (error) {
      console.error('Error ending debate:', error);
      res.status(500).json({ error: 'An error occurred while ending the debate.' });
    }
  });
  
  // Helper function to check if text is in Hindi
  function isHindi(text) {
    // This is a simple check and might not be 100% accurate
    return /[\u0900-\u097F]/.test(text);
  }
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));