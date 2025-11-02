import React, { useState, useEffect, useCallback, useRef } from "react";
import { PhoneOff, MessageSquare, Code, Maximize, Minimize, X, Mic } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

// --- Enhanced Model Component with Dynamic Speech ---
function DynamicModel({ speechText, onSpeechEnd, ...props }) {
  const { nodes, materials } = useGLTF('/final_prepvio_model.glb');
  const meshRef = useRef();
  const headBoneRef = useRef(null);
  const intervalRef = useRef(null);

  // Enable morph targets
  Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));

  const letterToViseme = {
    a: 'aa', b: 'PP', c: 'CH', d: 'DD', e: 'E', f: 'FF',
    g: 'DD', h: 'sil', i: 'E', k: 'DD', l: 'nn', m: 'PP',
    n: 'nn', o: 'oh', p: 'PP', r: 'aa', s: 'SS', t: 'DD',
    u: 'oh', v: 'FF', w: 'oh', x: 'SS', y: 'E', z: 'SS',
    ' ': 'sil'
  };

  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [chars, setChars] = useState([]);
  const morphKeys = nodes?.rp_carla_rigged_001_geo?.morphTargetDictionary || {};

  // Speech function that uses dynamic text
  useEffect(() => {
    if (!speechText) {
      // Clear animation when no text
      setChars([]);
      setCurrentCharIndex(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.2;
    
    utterance.onend = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentCharIndex(0);
      if (onSpeechEnd) onSpeechEnd();
    };

    utterance.onerror = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (onSpeechEnd) onSpeechEnd();
    };

    window.speechSynthesis.speak(utterance);

    // Setup lip sync
    const textChars = speechText.toLowerCase().split('');
    setChars(textChars);

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < textChars.length) {
        setCurrentCharIndex(i);
        i++;
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 150);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [speechText, onSpeechEnd]);

  // Assign head bone after nodes are loaded
  useEffect(() => {
    if (nodes?.rp_carla_rigged_001_geo?.skeleton) {
      const head = nodes.rp_carla_rigged_001_geo.skeleton.bones.find((b) =>
        b.name.toLowerCase().includes('head')
      );
      if (head) headBoneRef.current = head;
    }
  }, [nodes]);

  // Randomized offsets for natural motion
  const offsetY = useRef(Math.random() * 0.08);
  const offsetX = useRef(Math.random() * 0.05);

  // Animate
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Head rotation animation
    if (headBoneRef.current) {
      headBoneRef.current.rotation.y = Math.sin(t * 0.4 + offsetY.current) * 0.02;
      headBoneRef.current.rotation.x = Math.sin(t * 0.3 + offsetX.current) * 0.04;
    }

    // Lip-sync morph targets
    if (meshRef.current?.morphTargetInfluences && chars.length > 0) {
      const influences = meshRef.current.morphTargetInfluences;
      influences.fill(0);

      const char = chars[currentCharIndex];
      if (char) {
        const viseme = letterToViseme[char] || 'oh';
        const index = morphKeys[viseme];
        if (index !== undefined) influences[index] = 0.8;
      }
    }
  });

  // Only render mesh if it exists
  if (!nodes?.rp_carla_rigged_001_geo) return null;

  return (
    <group
      {...props}
      position={[-0.48, -1.3, 3.967]}
      rotation={[1.9, 0, 0]}
      scale={0.01}
      dispose={null}
    >
      <skinnedMesh
        ref={meshRef}
        geometry={nodes.rp_carla_rigged_001_geo.geometry}
        material={nodes.rp_carla_rigged_001_geo.material}
        skeleton={nodes.rp_carla_rigged_001_geo.skeleton}
        morphTargetInfluences={nodes.rp_carla_rigged_001_geo.morphTargetInfluences || []}
        morphTargetDictionary={nodes.rp_carla_rigged_001_geo.morphTargetDictionary || {}}
      />
      <primitive object={nodes.root} />
    </group>
  );
}

useGLTF.preload('/final_prepvio_model.glb');

// --- Gemini API Constants ---
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

const apiKey = "AIzaSyDFwVPzUlOs-_CRUV_ec_tMEFUTyuP_PRo";

// Main InterviewScreen component
const InterviewScreen = ({ companyType = "Tech Startup", role = "Full Stack Developer", setStage = () => {}, userId = "user1" }) => {
  const userVideoRef = useRef(null);
  const screenRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- State ---
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewStage, setInterviewStage] = useState("intro");
  const [currentAiSpeech, setCurrentAiSpeech] = useState("");

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Format chat for Gemini
  const formatHistoryForGemini = useCallback((history) => {
    return history.map((msg) => ({
      role: msg.sender === "AI" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));
  }, []);

  // Fetch from Gemini
  const fetchGeminiContent = useCallback(async (contents, systemInstruction) => {
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      throw new Error("Please set your Gemini API key");
    }

    const payload = {
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          
          if (res.status === 403) {
            throw new Error("API Key is invalid or restricted");
          } else if (res.status === 429) {
            throw new Error("Rate limit exceeded");
          } else {
            throw new Error(`API error: ${res.status}`);
          }
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text && attempts === maxAttempts - 1) {
          throw new Error("Empty response from API");
        }
        
        if (text) return text;
        
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) throw err;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }, []);

  // Handle speech completion
  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
    setCurrentAiSpeech("");
  }, []);

  // Text-to-speech trigger
  const textToSpeech = useCallback(async (text) => {
    if (!text) return;
    
    setIsSpeaking(true);
    setCurrentAiSpeech(text);
    
    // Wait for speech to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }, []);

  // Speech recognition
  const startSpeechRecognition = useCallback(() => {
    if (isLoadingAI || isSpeaking) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition not supported");
      return;
    }

    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };
    
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputValue(transcript);
    };
    
    recognition.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      setError("Error in speech recognition");
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    
    try {
      recognition.start();
    } catch(e) {
      console.error("Recognition start failed:", e);
      setIsRecording(false);
    }
  }, [isLoadingAI, isSpeaking, isRecording]);

  // Send Message Handler
  const handleSendMessage = useCallback(
    async (text) => {
      const messageToSend = text.trim();
      if (!messageToSend || isLoadingAI || isSpeaking) return;
      
      setError(null);
      setInputValue("");

      const userMsg = {
        sender: "You",
        text: messageToSend,
        time: new Date().toLocaleTimeString(),
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setIsLoadingAI(true);

      try {
        let systemInstruction = "";
        
        if (interviewStage === "intro") {
          systemInstruction = `You are conducting the initial HR round of a ${role} interview.
Continue with 2–3 introductory or personality-based questions.
Once the user gives 2–3 responses, gently transition to technical questions.
When you transition, say something like: "Alright, let's now move on to some technical questions related to ${role}."`;
        } else if (interviewStage === "transition") {
          systemInstruction = `You are now transitioning from HR to technical questions for a ${role} at a ${companyType}.
Start introducing simple technical questions like basic concepts or practical examples.
After 2–3 of these, move into deeper role-specific technical questions.`;
        } else {
          systemInstruction = `You are now in the technical round for a ${role} at a ${companyType}.
Ask only one clear technical question at a time based on the candidate's last answer.
Focus on coding logic, frameworks, problem-solving, and optimization.`;
        }

        const formattedHistory = formatHistoryForGemini([...chatMessages, userMsg]);
        const aiReply = await fetchGeminiContent(formattedHistory, systemInstruction);

        const lowerReply = aiReply.toLowerCase();
        if (interviewStage === "intro" && (lowerReply.includes("move on to some technical") || lowerReply.includes("let's now move to technical"))) {
          setInterviewStage("transition");
        } else if (interviewStage === "transition" && (lowerReply.includes("advanced") || lowerReply.includes("deep dive") || lowerReply.includes("complex"))) {
          setInterviewStage("technical");
        }

        const aiMsg = {
          sender: "AI",
          text: aiReply,
          time: new Date().toLocaleTimeString(),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        await textToSpeech(aiReply);
      } catch (err) {
        console.error("Error communicating with AI:", err);
        setError(err.message || "AI connection error");
      } finally {
        setIsLoadingAI(false);
      }
    },
    [isLoadingAI, isSpeaking, chatMessages, interviewStage, role, companyType, formatHistoryForGemini, fetchGeminiContent, textToSpeech]
  );

  // Camera setup
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setCameraAllowed(true);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          await userVideoRef.current.play().catch((e) => console.log("Play error:", e));
        }
      } catch (error) {
        setCameraAllowed(false);
        console.error("Camera access denied:", error);
        setError("Camera access denied");
      }
    };
    startCamera();
  }, []);

  // Initial AI Greeting
  useEffect(() => {
    if (cameraAllowed && companyType && role && !greeted) {
      const startAiConversation = async () => {
        try {
          const greetingPrompt = `You are a friendly professional interviewer for a ${role} at a ${companyType}.
Start the mock interview. Greet the candidate professionally, mention the company type "${companyType}" and the role "${role}",
then begin with an appropriate first question (like, "Can you start by telling me a little about yourself?").`;
          
          setIsLoadingAI(true);
          setChatMessages([]);
          
          const initialContent = [
            { role: "user", parts: [{ text: "Start the interview introduction." }] },
          ];
          
          const aiQ = await fetchGeminiContent(initialContent, greetingPrompt);
          
          const firstMsg = {
            sender: "AI",
            text: aiQ,
            time: new Date().toLocaleTimeString(),
          };
          setChatMessages([firstMsg]);
          await textToSpeech(aiQ);
          setGreeted(true);
        } catch (error) {
          console.error("Error sending initial greeting:", error);
          setError(error.message || "Failed to start AI conversation");
        } finally {
          setIsLoadingAI(false);
        }
      };
      startAiConversation();
    }
  }, [cameraAllowed, companyType, role, greeted, fetchGeminiContent, textToSpeech]);

  // Fullscreen toggle
  const toggleFullScreen = async () => {
    const elem = screenRef.current;
    if (!document.fullscreenElement) {
      await elem.requestFullscreen();
      setIsFullScreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  if (!cameraAllowed && !error) {
    return (
      <div className="text-center mt-20 text-lg text-gray-700">
        Requesting camera permission...
      </div>
    );
  }

  return (
    <div
      ref={screenRef}
      className={`relative bg-gray-900 text-white flex flex-col justify-between overflow-hidden transition-all duration-300
        ${isFullScreen ? "w-full h-full rounded-none mt-0" : "max-w-7xl mx-auto mt-4 rounded-xl shadow-xl h-[80vh]"}`}
      style={{ background: "linear-gradient(135deg, #1f2937, #111827)" }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-3 bg-gray-800 rounded-t-2xl flex-shrink-0">
        <h2 className="text-lg font-light text-gray-200">
          {companyType} — {role}
        </h2>
        <button onClick={toggleFullScreen} className="p-2 hover:bg-gray-700 rounded-full">
          {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

      {/* MAIN AREA */}
      <div className="flex-grow flex items-center justify-center relative overflow-hidden">
        <video
          ref={userVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain transform scale-x-[-1] bg-black"
        />
        <p className="absolute bottom-4 left-6 bg-black bg-opacity-50 text-sm px-3 py-1 rounded-md z-10">
          You
        </p>
        
        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-800 text-white p-6 rounded-lg shadow-xl z-20 max-w-md">
            <p className="font-semibold text-lg mb-2">Error:</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="mt-4 bg-white text-red-800 px-4 py-2 rounded hover:bg-gray-100 transition"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {isSpeaking && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-20 animate-pulse text-sm">
            AI is speaking...
          </div>
        )}

        {/* 3D INTERVIEWER MODEL */}
        <div
          className="absolute bottom-6 right-6 w-[250px] h-[200px] rounded-lg overflow-hidden border-2 border-white shadow-lg z-10"
          style={{
            backgroundImage: `url(/image.jpg)`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.6} />
            <Environment preset="studio" />
            <DynamicModel 
              speechText={currentAiSpeech} 
              onSpeechEnd={handleSpeechEnd}
            />
          </Canvas>
          <p className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            AI Interviewer
          </p>
        </div>

        {/* Chat Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col text-gray-800 z-20 transform transition-transform duration-300 ${
            isChatOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Conversation</h2>
            <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`p-3 rounded-xl max-w-[75%] shadow-md ${
                    msg.sender === "You"
                      ? "bg-indigo-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  <span className="text-xs font-semibold opacity-80">{msg.sender}</span>
                  <p className="text-sm mt-1">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoadingAI && (
              <div className="text-gray-500 italic flex justify-start">
                <div className="p-3 bg-gray-100 rounded-xl rounded-tl-none text-sm shadow-sm">AI is typing…</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t bg-gray-50 flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={startSpeechRecognition}
              disabled={isLoadingAI || isSpeaking}
              className={`p-3 rounded-xl transition ${
                isRecording
                  ? "bg-red-500 text-white shadow-red-500/50 shadow-lg animate-pulse"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type or speak your response..."
              className="flex-grow p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
              disabled={isLoadingAI || isSpeaking}
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoadingAI || isSpeaking}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* CONTROL BAR */}
      <div className="flex justify-center gap-12 bg-gray-800 py-4 border-t border-gray-700 rounded-b-2xl flex-shrink-0">
        <button
          onClick={() => setStage("rounds")}
          className="flex flex-col items-center text-red-500 hover:text-red-400 transition"
        >
          <PhoneOff className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">End Interview</span>
        </button>
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex flex-col items-center transition ${isChatOpen ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
        >
          <MessageSquare className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Chat</span>
        </button>
        <button
          onClick={() => console.log("Code editor coming soon")}
          className="flex flex-col items-center text-gray-300 hover:text-white transition"
        >
          <Code className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Code Editor</span>
        </button>
      </div>
    </div>
  );
};

export default InterviewScreen;