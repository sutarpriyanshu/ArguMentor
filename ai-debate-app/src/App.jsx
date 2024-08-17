import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styled, { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme, GlobalStyles } from "./themes";
import "./App.css";

const AppContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${(props) => props.theme.body};
  color: ${(props) => props.theme.text};
`;

const Header = styled.header`
  background-color: ${(props) => props.theme.headerBg};
  color: ${(props) => props.theme.headerText};
  text-align: center;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ToggleButton = styled.button`
  background-color: ${(props) => props.theme.toggleBg};
  color: ${(props) => props.theme.toggleText};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
`;

const HomeButton = styled.button`
  background-color: ${(props) => props.theme.buttonBg};
  color: ${(props) => props.theme.buttonText};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const DebateHistory = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
  background-color: ${(props) => props.theme.chatBg};
`;

const DebateEntry = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 4px;
  background-color: ${(props) =>
    props.isUser ? props.theme.userBubbleBg : props.theme.aiBubbleBg};
  color: ${(props) =>
    props.isUser ? props.theme.userBubbleText : props.theme.aiBubbleText};
  border-left: 4px solid
    ${(props) =>
      props.isUser ? props.theme.userBubbleBorder : props.theme.aiBubbleBorder};
`;

function App() {
  const [topic, setTopic] = useState("");
  const [userStance, setUserStance] = useState("");
  const [debateStarted, setDebateStarted] = useState(false);
  const [debateHistory, setDebateHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [debateEnded, setDebateEnded] = useState(false);
  const [debateScore, setDebateScore] = useState(null);
  const sentencesRef = useRef([]);
  const utteranceRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "en" ? "en-US" : "hi-IN";

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        setUserInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, [language]);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      speakNextSentence();
    }
  }, [currentSentenceIndex, isSpeaking]);

  const handleStartDebate = (e) => {
    e.preventDefault();
    setDebateStarted(true);
  };

  const getAIResponse = async (userArgument) => {
    setLoading(true);
    try {
      const response = await axios.post("https://argumentor-plum.vercel.app/api/debate", {
        topic,
        userStance,
        userArgument,
        language,
      });
      const aiResponse = response.data.aiResponse;
      setDebateHistory([
        ...debateHistory,
        { type: "user", text: userArgument },
        { type: "ai", text: aiResponse },
      ]);
    } catch (error) {
      console.error("Error getting AI response:", error);
    }
    setLoading(false);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (userInput.trim()) {
      await getAIResponse(userInput);
      setUserInput("");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const splitIntoSentences = (text) => {
    return text.split(/[।.]/g).filter((sentence) => sentence.trim() !== "");
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sentences = splitIntoSentences(text);
      sentencesRef.current = sentences;
      setCurrentSentenceIndex(0);
      setIsSpeaking(true);
    } else {
      console.error("Speech synthesis not supported");
    }
  };

  const speakNextSentence = () => {
    if (currentSentenceIndex < sentencesRef.current.length) {
      const sentence = sentencesRef.current[currentSentenceIndex];

      utteranceRef.current = new SpeechSynthesisUtterance(sentence);
      utteranceRef.current.lang = language === "en" ? "en-US" : "hi-IN";

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang === utteranceRef.current.lang);
      if (voice) {
        utteranceRef.current.voice = voice;
      }

      utteranceRef.current.onend = () => {
        setCurrentSentenceIndex((prevIndex) => prevIndex + 1);
      };
      utteranceRef.current.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utteranceRef.current);
    } else {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSentenceIndex(0);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const endDebate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/end-debate",
        {
          topic,
          userStance,
          debateHistory,
          language,
        }
      );
      setDebateEnded(true);
      setDebateScore(response.data.score);
    } catch (error) {
      console.error("Error ending debate:", error);
    }
    setLoading(false);
  };

  const resetDebate = () => {
    setTopic("");
    setUserStance("");
    setDebateStarted(false);
    setDebateHistory([]);
    setDebateEnded(false);
    setDebateScore(null);
  };

  return (
    <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
      <GlobalStyles />
      <AppContainer>
        <Header>
          <h1>{language === "en" ? "AI Debate Arena" : "एआई बहस अखाड़ा"}</h1>
          <HeaderButtons>
            <select value={language} onChange={handleLanguageChange}>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
            <ToggleButton onClick={toggleTheme}>
              {theme === "light" ? "🌙" : "☀️"}
            </ToggleButton>
            {debateEnded && (
              <HomeButton onClick={resetDebate}>
                {language === "en" ? "Home" : "होम"}
              </HomeButton>
            )}
          </HeaderButtons>
        </Header>
        <main>
          {!debateStarted ? (
            <div className="debate-setup">
              <h2>
                {language === "en"
                  ? "Set Up Your Debate"
                  : "अपनी बहस तैयार करें"}
              </h2>
              <form onSubmit={handleStartDebate}>
                <div className="form-group">
                  <label htmlFor="topic">
                    {language === "en" ? "Debate Topic:" : "बहस का विषय:"}
                  </label>
                  <input
                    type="text"
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    placeholder={
                      language === "en"
                        ? "Enter the debate topic"
                        : "बहस का विषय दर्ज करें"
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="stance">
                    {language === "en" ? "Your Stance:" : "आपका पक्ष:"}
                  </label>
                  <select
                    id="stance"
                    value={userStance}
                    onChange={(e) => setUserStance(e.target.value)}
                    required
                  >
                    <option value="">
                      {language === "en"
                        ? "Select your stance"
                        : "अपना पक्ष चुनें"}
                    </option>
                    <option value="for">
                      {language === "en" ? "For" : "पक्ष में"}
                    </option>
                    <option value="against">
                      {language === "en" ? "Against" : "विरोध में"}
                    </option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">
                  {language === "en" ? "Start Debate" : "बहस शुरू करें"}
                </button>
              </form>
            </div>
          ) : (
            <div className="debate-area">
              <h2>
                {language === "en" ? `Debate: ${topic}` : `बहस: ${topic}`}
              </h2>
              <DebateHistory>
                {debateHistory.map((entry, index) => (
                  <DebateEntry key={index} isUser={entry.type === "user"}>
                    <strong>
                      {entry.type === "ai"
                        ? language === "en"
                          ? "AI"
                          : "एआई"
                        : language === "en"
                        ? "You"
                        : "आप"}
                      :
                    </strong>
                    <p>{entry.text}</p>
                    {entry.type === "ai" && (
                      <button
                        className="btn-speak"
                        onClick={() => speakText(entry.text)}
                        disabled={isSpeaking}
                      >
                        🔊 {language === "en" ? "Speak" : "बोलें"}
                      </button>
                    )}
                  </DebateEntry>
                ))}
              </DebateHistory>
              {!debateEnded && (
                <form onSubmit={handleUserSubmit} className="argument-form">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                      language === "en"
                        ? "Enter your argument..."
                        : "अपना तर्क दर्ज करें..."
                    }
                    rows="4"
                    required
                  />
                  <div className="button-group">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading
                        ? language === "en"
                          ? "AI is thinking..."
                          : "एआई सोच रहा है..."
                        : language === "en"
                        ? "Submit Argument"
                        : "तर्क जमा करें"}
                    </button>
                    {recognition && (
                      <button
                        type="button"
                        className={`btn-voice ${
                          isListening ? "listening" : ""
                        }`}
                        onClick={toggleListening}
                      >
                        {isListening
                          ? language === "en"
                            ? "Stop Voice Input"
                            : "आवाज इनपुट बंद करें"
                          : language === "en"
                          ? "Start Voice Input"
                          : "आवाज इनपुट शुरू करें"}
                      </button>
                    )}
                    {isSpeaking && (
                      <button
                        type="button"
                        className="btn-stop-speak"
                        onClick={stopSpeaking}
                      >
                        {language === "en" ? "Stop Speaking" : "बोलना बंद करें"}
                      </button>
                    )}
                  </div>
                </form>
              )}
              {debateStarted && !debateEnded && (
                <button onClick={endDebate} className="btn-end-debate">
                  {language === "en" ? "End Debate" : "बहस समाप्त करें"}
                </button>
              )}
              {debateEnded && debateScore !== null && (
                <div className="debate-score">
                  <h3>{language === "en" ? "Debate Score" : "बहस का स्कोर"}</h3>
                  <p>
                    {language === "en"
                      ? `Your score: ${debateScore}`
                      : `आपका स्कोर: ${debateScore}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
