import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [answer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isStreaming) return;

    setIsStreaming(true);
    setIsDone(false);
    setAnswer("");
    setError(null);
    
    // Blur input to focus user on the output
    inputRef.current?.blur();

    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: question,
        config: {
          systemInstruction: "You are Mr. Want. Answer the user's question immediately, concisely, and accurately. Do not use markdown headers or heavy formatting. Just plain, direct text. Maximum efficiency.",
        }
      });

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          setAnswer(prev => prev + c.text);
        }
      }
      setIsDone(true);
    } catch (err: any) {
      console.error(err);
      setError("Mr. Want is currently unavailable. Please try again.");
    } finally {
      setIsStreaming(false);
      // Re-focus if error, otherwise keep focus on content/reset button logic
      if (!answer) inputRef.current?.focus();
    }
  };

  const handleReset = () => {
    setQuestion("");
    setAnswer("");
    setIsDone(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        {/* Header / Brand */}
        <div style={styles.header}>
          <h1 style={styles.logo}>Mr. Want</h1>
        </div>

        {/* Output Stage */}
        {(answer || isStreaming || error) && (
          <div style={styles.outputContainer} ref={scrollRef}>
             {error ? (
              <p style={styles.errorText}>{error}</p>
            ) : (
              <p style={styles.answerText}>
                {answer}
                {isStreaming && <span style={styles.cursor} />}
              </p>
            )}
          </div>
        )}

        {/* Input Stage - Moves to bottom or stays center based on state */}
        <div style={styles.inputContainer}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to know?"
              style={styles.input}
              disabled={isStreaming}
              autoComplete="off"
            />
            <div style={styles.actionRight}>
              {isDone ? (
                <button type="button" onClick={handleReset} style={styles.resetButton}>
                  New
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={!question.trim() || isStreaming}
                  style={styles.submitButton}
                >
                  {isStreaming ? (
                    <div style={styles.spinner} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

// Vercel-inspired Design System
const styles: Record<string, React.CSSProperties> = {
  page: {
    backgroundColor: "#000000",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "#ededed",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  main: {
    maxWidth: "640px",
    width: "100%",
    margin: "0 auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: "60px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
  },
  logo: {
    fontSize: "80px",
    fontWeight: "800",
    letterSpacing: "-4px",
    background: "linear-gradient(180deg, #FFFFFF 0%, #666666 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    lineHeight: "1",
    filter: "drop-shadow(0 0 30px rgba(255,255,255,0.1))",
  },
  outputContainer: {
    minHeight: "100px",
    marginBottom: "40px",
    animation: "fadeIn 0.3s ease",
  },
  answerText: {
    fontSize: "24px",
    lineHeight: "1.5",
    fontWeight: "400",
    whiteSpace: "pre-wrap",
    margin: 0,
    color: "#fff",
  },
  errorText: {
    color: "#ff3333",
    fontSize: "16px",
    textAlign: "center",
  },
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  form: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#0a0a0a",
    border: "1px solid #333",
    borderRadius: "12px",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "20px",
    fontSize: "16px",
    color: "#fff",
    outline: "none",
    width: "100%",
  },
  actionRight: {
    paddingRight: "12px",
    display: "flex",
    alignItems: "center",
  },
  submitButton: {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.1s ease",
    padding: 0,
  },
  resetButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid #ccc",
    borderTopColor: "#000",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  cursor: {
    display: "inline-block",
    width: "10px",
    height: "24px",
    backgroundColor: "#0070f3",
    marginLeft: "4px",
    verticalAlign: "text-bottom",
    animation: "blink 1s step-end infinite",
  }
};

// Global styles for animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  ::selection { background: #333; color: #fff; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleSheet);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);