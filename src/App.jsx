import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const TICKER_DATA = [
  { location: "Gate 7 · Concourse C", time: "Kickoff in 15:00", alert: "Stand B queue rising — order now", type: "alert" },
  { location: "Gate 7 · Concourse C", time: "Kickoff in 14:30", alert: "Restrooms at sec 112 are clear", type: "positive" },
  { location: "Gate 7 · Concourse C", time: "Kickoff in 14:00", alert: "Team warmups beginning now", type: "neutral" },
  { location: "Gate 7 · Concourse C", time: "Kickoff in 13:30", alert: "Merchandise stall 2 has 5 min wait", type: "alert" }
];

const StreamMessage = ({ text, isLatest, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState(isLatest ? '' : text);
  
  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(text);
      return;
    }
    
    const words = text.split(' ');
    let currentWordIndex = 0;
    let currentText = '';
    
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        currentText = currentText ? currentText + ' ' + words[currentWordIndex] : words[currentWordIndex];
        setDisplayedText(currentText);
        currentWordIndex++;
        if(onUpdate) onUpdate();
      } else {
        clearInterval(interval);
      }
    }, 60); 
    
    return () => clearInterval(interval);
  }, [text, isLatest, onUpdate]);

  return <>{displayedText}</>;
};

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Welcome. I am FieldPass. I see you are near section 114, gate 7. How can I assist you today.",
      chips: ["I just arrived", "I am hungry", "Half-time plan"]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_DATA.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendQuery = (text) => {
    if (!text.trim()) return;
    
    const newUserMsg = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let botText = "I am here to assist. Ask me for directions, wait times, or food.";
      let nextChips = ["Find restrooms", "Order food"];
      
      if (lower.match(/lost|scared|medical|emergency|help|hurt|doctor/)) {
         botText = "Help has been notified. Stay put. I have shared your location with a staff member who is on the way.";
         nextChips = ["I am safe", "Call security"];
      } else if (lower.match(/arrive|where to go|how to get|directions|seat/)) {
         botText = "Gate 3 has the shortest queue right now (2 min). Proceed to Gate 3, take escalator B to level 2, and walk straight to section 114.";
         nextChips = ["Show map", "Find restrooms", "Order food"];
      } else if (lower.match(/food|drink|hungry|thirsty|order/)) {
         botText = "The nearest concession is Stand C, 50 yards away. Estimated wait time is 4 minutes. I can place a pre-order now so it is ready at half-time.";
         nextChips = ["Pre-order for half-time", "Show menu", "Show map"];
      } else if (lower.match(/half time|halftime|half-time/)) {
         botText = "Suggested 15-minute plan: Visit restroom at sec 112 (1 min wait). Pick up food at Stand C. Return to seat before the second half begins.";
         nextChips = ["Pre-order food now", "Show restroom map"];
      } else if (lower.match(/restroom|bathroom|toilet/)) {
         botText = "The nearest restroom is 50 yards to your left. The current wait time is 2 minutes.";
         nextChips = ["Show map", "Order food", "Find my seat"];
      }
      
      const botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botText,
        chips: nextChips
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputValue;
    setInputValue('');
    sendQuery(text);
  };

  const currentTicker = TICKER_DATA[tickerIndex];

  return (
    <div className="app-container">
      <div className="ticker-bar" key={tickerIndex}>
        <span className="ticker-item location">
          <div className="status-indicator"></div>
          {currentTicker.location}
        </span>
        <span className="ticker-separator">•</span>
        <span className="ticker-item time">{currentTicker.time}</span>
        <span className="ticker-separator">•</span>
        <span className={`ticker-item ${currentTicker.type === 'alert' ? 'alert' : currentTicker.type === 'positive' ? 'positive' : ''}`}>{currentTicker.alert}</span>
      </div>
      
      <header className="app-header">
        <div className="header-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logo-hexagon">
            <polygon points="12 2 22 8 22 16 12 22 2 16 2 8 12 2"></polygon>
            <circle cx="12" cy="12" r="3" fill="#F5C842" stroke="none"></circle>
          </svg>
          <h1>FieldPass</h1>
        </div>
      </header>

      <div className="chat-window">
        {messages.map((msg, index) => {
          const isLatestBot = msg.sender === 'bot' && index === messages.length - 1;
          const showChips = isLatestBot && !isTyping;
          
          return (
            <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
              <div className={`message-content ${msg.sender}`}>
                <div className={`message-bubble ${msg.sender}`}>
                  {msg.sender === 'bot' ? (
                    <StreamMessage 
                      text={msg.text} 
                      isLatest={isLatestBot} 
                      onUpdate={scrollToBottom} 
                    />
                  ) : (
                    msg.text
                  )}
                </div>
                {showChips && msg.chips && (
                  <div className="chips-container">
                    {msg.chips.map((chip, i) => (
                      <button 
                        key={i} 
                        className="chip-btn" 
                        onClick={() => sendQuery(chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="message-wrapper bot">
            <div className="message-content bot">
              <div className="message-bubble bot typing-indicator">
                FieldPass is thinking<span className="dot-one">.</span><span className="dot-two">.</span><span className="dot-three">.</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me anything..."
          className="chat-input"
        />
        <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="send-icon">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}

export default App;
