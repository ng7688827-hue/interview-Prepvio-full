// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { PhoneOff, MessageSquare, Code, Maximize, Minimize, X, Mic } from "lucide-react";
// import { Canvas, useFrame } from "@react-three/fiber";
// import { Environment, useGLTF } from "@react-three/drei";
// import { useNavigate } from "react-router-dom";


// // --- Enhanced Model Component with Dynamic Speech ---
// function DynamicModel({ speechText, onSpeechEnd, ...props }) {
//   const { nodes, materials } = useGLTF('/final_prepvio_model.glb');
//   const meshRef = useRef();
//   const headBoneRef = useRef(null);
//   const intervalRef = useRef(null);

//   // Enable morph targets
//   useEffect(() => {
//     Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));
//   }, [materials]);

//   const letterToViseme = {
//     a: 'aa', b: 'PP', c: 'CH', d: 'DD', e: 'E', f: 'FF',
//     g: 'DD', h: 'sil', i: 'E', k: 'DD', l: 'nn', m: 'PP',
//     n: 'nn', o: 'oh', p: 'PP', r: 'aa', s: 'SS', t: 'DD',
//     u: 'oh', v: 'FF', w: 'oh', x: 'SS', y: 'E', z: 'SS',
//     ' ': 'sil'
//   };

//   const [currentCharIndex, setCurrentCharIndex] = useState(0);
//   const [chars, setChars] = useState([]);
//   const morphKeys = nodes?.rp_carla_rigged_001_geo?.morphTargetDictionary || {};

//   // Speech function that uses dynamic text
//   useEffect(() => {
//     if (!speechText) {
//       setChars([]);
//       setCurrentCharIndex(0);
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//       return;
//     }

//     window.speechSynthesis.cancel();

//     const utterance = new SpeechSynthesisUtterance(speechText);
//     utterance.rate = 1.2;
    
//     utterance.onend = () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//       setCurrentCharIndex(0);
//       if (onSpeechEnd) onSpeechEnd();
//     };

//     utterance.onerror = () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//       if (onSpeechEnd) onSpeechEnd();
//     };

//     window.speechSynthesis.speak(utterance);

//     const textChars = speechText.toLowerCase().split('');
//     setChars(textChars);

//     let i = 0;
//     intervalRef.current = setInterval(() => {
//       if (i < textChars.length) {
//         setCurrentCharIndex(i);
//         i++;
//       } else {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     }, 150);

//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//   }, [speechText, onSpeechEnd]);

//   // Assign head bone after nodes are loaded
//   useEffect(() => {
//     if (nodes?.rp_carla_rigged_001_geo?.skeleton) {
//       const head = nodes.rp_carla_rigged_001_geo.skeleton.bones.find((b) =>
//         b.name.toLowerCase().includes('head')
//       );
//       if (head) headBoneRef.current = head;
//     }
//   }, [nodes]);

//   const offsetY = useRef(Math.random() * 0.08);
//   const offsetX = useRef(Math.random() * 0.05);

//   // Animate
//   useFrame((state) => {
//     const t = state.clock.getElapsedTime();

//     if (headBoneRef.current) {
//       headBoneRef.current.rotation.y = Math.sin(t * 0.4 + offsetY.current) * 0.02;
//       headBoneRef.current.rotation.x = Math.sin(t * 0.3 + offsetX.current) * 0.04;
//     }

//     if (meshRef.current?.morphTargetInfluences && chars.length > 0) {
//       const influences = meshRef.current.morphTargetInfluences;
//       influences.fill(0);

//       const char = chars[currentCharIndex];
//       if (char) {
//         const viseme = letterToViseme[char] || 'oh';
//         const index = morphKeys[viseme];
//         if (index !== undefined) influences[index] = 0.8;
//       }
//     }
//   });

//   if (!nodes?.rp_carla_rigged_001_geo) return null;

//   return (
//     <group
//       {...props}
//       position={[-0.48, -1.3, 3.967]}
//       rotation={[1.9, 0, 0]}
//       scale={0.01}
//       dispose={null}
//     >
//       <skinnedMesh
//         ref={meshRef}
//         geometry={nodes.rp_carla_rigged_001_geo.geometry}
//         material={nodes.rp_carla_rigged_001_geo.material}
//         skeleton={nodes.rp_carla_rigged_001_geo.skeleton}
//         morphTargetInfluences={nodes.rp_carla_rigged_001_geo.morphTargetInfluences || []}
//         morphTargetDictionary={nodes.rp_carla_rigged_001_geo.morphTargetDictionary || {}}
//       />
//       <primitive object={nodes.root} />
//     </group>
//   );
// }

// useGLTF.preload('/final_prepvio_model.glb');

// // --- API Constants ---
// const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
// const BACKEND_UPLOAD_URL = "/api/upload"; 
// const apiKey = "fw_3ZRYSYVzzkpfzTQXYpxbZiiq"; // Replace with your Fireworks API key

// // Generate report with feedback
// const generateReportContent = (messages, company, role) => {
//   let content = `--- Mock Interview Report ---\n\n`;
//   content += `Role: ${role}\n`;
//   content += `Company Type: ${company}\n`;
//   content += `Date: ${new Date().toLocaleDateString()}\n\n`;
//   content += `--- Conversation Log ---\n\n`;

//   messages.forEach((msg) => {
//     content += `${msg.sender}: ${msg.text}\n`;
    
//     if (msg.sender === "User" && msg.feedback) {
//       const suggestion = msg.feedback.suggestion || "";
//       const example = msg.feedback.example || "";
//       content += `[Feedback]: ${suggestion}|||${example}\n`;
//     }
//   });

//   content += `\n=== FINAL ANALYSIS ===\n\n`;
//   content += `**Overall Performance Summary**\n`;
//   content += `This interview covered both HR and technical aspects for the ${role} position.\n\n`;
  
//   content += `**Key Strengths Observed**\n`;
//   content += `- Engaged actively throughout the conversation\n`;
//   content += `- Demonstrated willingness to learn and improve\n\n`;
  
//   content += `**General Recommendations**\n`;
//   content += `1. Continue practicing technical concepts relevant to ${role}\n`;
//   content += `2. Use the STAR method for behavioral questions\n`;
//   content += `3. Build small projects to demonstrate practical skills\n`;
//   content += `4. Review feedback provided after each response above\n`;

//   return content;
// };

// const InterviewScreen = ({ 
//   companyType = "Tech Startup", 
//   role = "Full Stack Developer", 
//   setStage = () => {}, 
//   userId = "user1" 
// }) => {
//   const userVideoRef = useRef(null);
//   const screenRef = useRef(null);
//   const chatEndRef = useRef(null);
//   const recognitionRef = useRef(null);

//   const [isFullScreen, setIsFullScreen] = useState(false);
//   const [cameraAllowed, setCameraAllowed] = useState(false);
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [inputValue, setInputValue] = useState("");
//   const [isLoadingAI, setIsLoadingAI] = useState(false);
//   const [greeted, setGreeted] = useState(false);
//   const [error, setError] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [interviewStage, setInterviewStage] = useState("intro");
//   const [currentAiSpeech, setCurrentAiSpeech] = useState("");
//   const navigate = useNavigate();

//   const endInterview = useCallback(() => {
//     console.log("Interview ended and resources cleaned.");
//     if (window.speechSynthesis) window.speechSynthesis.cancel();
//     if (window.currentMediaStream) {
//       window.currentMediaStream.getTracks().forEach(track => track.stop());
//       window.currentMediaStream = null;
//     }
//     if (userVideoRef.current?.srcObject) {
//       userVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
//       userVideoRef.current.srcObject = null;
//     }
//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//       recognitionRef.current = null;
//     }
//     setIsSpeaking(false);
//     setIsRecording(false);
//     setGreeted(false);
//     setChatMessages([]);
//     setError(null);
//     console.log("✅ All media and states cleared.");
//   }, []);

//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       sessionStorage.setItem("refreshFlag", "true");
//     };
//     window.addEventListener("beforeunload", handleBeforeUnload);

//     if (sessionStorage.getItem("refreshFlag") === "true") {
//       sessionStorage.removeItem("refreshFlag");
//       endInterview();
//       navigate("/", { replace: true });
//     }

//     return () => {
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//     };
//   }, [navigate, endInterview]);

//   useEffect(() => {
//     window.history.pushState(null, "", window.location.pathname);

//     const handlePopState = (e) => {
//       console.log("⬅️ User navigated back — ending interview and blocking forward navigation");

//       window.history.pushState(null, "", window.location.pathname);
      
//       if (window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//         recognitionRef.current = null;
//       }
//       if (userVideoRef.current?.srcObject) {
//         userVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
//         userVideoRef.current.srcObject = null;
//       }
//       if (window.currentMediaStream) {
//         window.currentMediaStream.getTracks().forEach(track => track.stop());
//         window.currentMediaStream = null;
//       }

//       navigate("/", { replace: true });
//     };

//     window.addEventListener("popstate", handlePopState);
    
//     return () => {
//       window.removeEventListener("popstate", handlePopState);
//     };
//   }, [navigate]);

//   useEffect(() => {
//     return () => {
//       endInterview();
//     };
//   }, [endInterview]);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [chatMessages]);

//   const formatHistoryForFireworks = useCallback((history) => {
//     return history.map((msg) => ({
//       role: msg.sender === "AI" ? "assistant" : "user",
//       content: msg.text,
//     }));
//   }, []);

//   const fetchFireworksContent = useCallback(async (messages, systemInstruction) => {
//     const messagesWithSystem = [
//       { role: "system", content: systemInstruction },
//       ...messages
//     ];

//     let attempts = 0;
//     const maxAttempts = 3;

//     while (attempts < maxAttempts) {
//       try {
//         const res = await fetch(FIREWORKS_API_URL, {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${apiKey}`,
//             "Content-Type": "application/json",
//             "Accept": "application/json"
//           },
//           body: JSON.stringify({
//             model: "accounts/fireworks/models/deepseek-v3p1",
//             messages: messagesWithSystem
//           })
//         });

//         if (!res.ok) {
//           const errorText = await res.text();
//           console.error("API Error:", errorText);
          
//           if (res.status === 403) throw new Error("API Key is invalid or restricted");
//           if (res.status === 429) throw new Error("Rate limit exceeded. Try again later.");
//           throw new Error(`API error: ${res.status}`);
//         }

//         const data = await res.json();
//         const text = data?.choices?.[0]?.message?.content;
        
//         if (!text && attempts === maxAttempts - 1) {
//           throw new Error("Empty response from API");
//         }
        
//         if (text) return text;
        
//       } catch (err) {
//         attempts++;
//         if (attempts >= maxAttempts) throw err;
//         await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
//       }
//     }
//   }, []);

//   const generateFeedbackForAnswer = useCallback(async (userAnswer, aiQuestion) => {
//     try {
//       const feedbackPrompt = `You are an interview coach analyzing a candidate's answer.

// Previous Question: "${aiQuestion}"
// Candidate's Answer: "${userAnswer}"

// Provide constructive feedback in this EXACT format (no additional text):
// SUGGESTION: [One specific improvement suggestion in 1-2 sentences]
// EXAMPLE: [A better way to phrase the answer in 1 sentence]

// Keep it concise and actionable.`;

//       const feedbackMessages = [
//         { role: "user", content: feedbackPrompt }
//       ];

//       const feedbackText = await fetchFireworksContent(feedbackMessages, "You are a helpful interview coach providing brief, actionable feedback.");
      
//       const suggestionMatch = feedbackText.match(/SUGGESTION:\s*(.+?)(?=EXAMPLE:|$)/s);
//       const exampleMatch = feedbackText.match(/EXAMPLE:\s*(.+?)$/s);
      
//       return {
//         suggestion: suggestionMatch ? suggestionMatch[1].trim() : "Keep practicing to improve your interview responses.",
//         example: exampleMatch ? exampleMatch[1].trim() : ""
//       };
//     } catch (err) {
//       console.error("Feedback generation error:", err);
//       return {
//         suggestion: "Consider providing more specific examples from your experience.",
//         example: "Try structuring your answer with concrete details about what you did and what you achieved."
//       };
//     }
//   }, [fetchFireworksContent]);

//   const handleSpeechEnd = useCallback(() => {
//     setIsSpeaking(false);
//     setCurrentAiSpeech("");
//     setTimeout(() => startSpeechRecognition(), 500);
//   }, []);

//   const textToSpeech = useCallback((text) => {
//     if (!text) return;
//     setIsSpeaking(true);
//     setCurrentAiSpeech(text);
//   }, []);

//   const handleSendMessage = useCallback(
//     async (text) => {
//       const messageToSend = text.trim();
//       if (!messageToSend || isLoadingAI || isSpeaking) return;
      
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//         recognitionRef.current = null;
//         setIsRecording(false);
//       }
      
//       setError(null);
//       setInputValue("");

//       const lastAiMessage = chatMessages.filter(m => m.sender === "AI").slice(-1)[0];
//       const lastAiQuestion = lastAiMessage ? lastAiMessage.text : "";

//       const userMsg = {
//         sender: "User",
//         text: messageToSend,
//         time: new Date().toLocaleTimeString(),
//         feedback: null
//       };
      
//       setChatMessages((prev) => [...prev, userMsg]);
//       setIsLoadingAI(true);

//       try {
//         let systemInstruction = "";
        
//         if (interviewStage === "intro") {
//           systemInstruction = `You are conducting the initial HR round of a ${role} interview.
// Continue with 2–3 introductory or personality-based questions.
// Once the user gives 2–3 responses, gently transition to technical questions.
// When you transition, say something like: "Alright, let's now move on to some technical questions related to ${role}."`;
//         } else if (interviewStage === "transition") {
//           systemInstruction = `You are now transitioning from HR to technical questions for a ${role} at a ${companyType}.
// Start introducing simple technical questions like basic concepts or practical examples.
// After 2–3 of these, move into deeper role-specific technical questions.`;
//         } else {
//           systemInstruction = `You are now in the technical round for a ${role} at a ${companyType}.
// Ask only one clear technical question at a time based on the candidate's last answer.
// Focus on coding logic, frameworks, problem-solving, and optimization.`;
//         }

//         const formattedHistory = formatHistoryForFireworks([...chatMessages, userMsg]);
//         const aiReply = await fetchFireworksContent(formattedHistory, systemInstruction);

//         const feedback = await generateFeedbackForAnswer(messageToSend, lastAiQuestion);
        
//         setChatMessages((prev) => {
//           const updated = [...prev];
//           const lastUserIndex = updated.map(m => m.sender).lastIndexOf("User");
//           if (lastUserIndex !== -1) {
//             updated[lastUserIndex] = { ...updated[lastUserIndex], feedback };
//           }
//           return updated;
//         });

//         const lowerReply = aiReply.toLowerCase();
//         if (interviewStage === "intro" && (lowerReply.includes("move on to some technical") || lowerReply.includes("let's now move to technical"))) {
//           setInterviewStage("transition");
//         } else if (interviewStage === "transition" && (lowerReply.includes("advanced") || lowerReply.includes("deep dive") || lowerReply.includes("complex"))) {
//           setInterviewStage("technical");
//         }

//         const aiMsg = {
//           sender: "AI",
//           text: aiReply,
//           time: new Date().toLocaleTimeString(),
//         };
//         setChatMessages((prev) => [...prev, aiMsg]);
//         await textToSpeech(aiReply);
        
//       } catch (err) {
//         console.error("Error communicating with AI:", err);
//         setError(err.message || "AI connection error");
//       } finally {
//         setIsLoadingAI(false);
//       }
//     },
//     [isLoadingAI, isSpeaking, chatMessages, interviewStage, role, companyType, formatHistoryForFireworks, fetchFireworksContent, textToSpeech, generateFeedbackForAnswer]
//   );

//   const startSpeechRecognition = useCallback(() => {
//     if (isLoadingAI || isSpeaking) return;

//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) {
//       setError("Speech Recognition not supported in this browser.");
//       return;
//     }

//     if (recognitionRef.current && isRecording) {
//       recognitionRef.current.stop();
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-US";
//     recognition.continuous = false;
//     recognition.interimResults = false;
//     recognitionRef.current = recognition;

//     recognition.onstart = () => {
//       setIsRecording(true);
//       setError(null);
//     };
    
//     recognition.onresult = (e) => {
//       const transcript = Array.from(e.results)
//         .map(result => result[0].transcript)
//         .join('');
//       setInputValue(transcript);
//     };
    
//     recognition.onerror = (e) => {
//       console.error("Speech Recognition Error:", e);
//       if (e.error !== 'no-speech') {
//         setError("Error in speech recognition: " + e.error);
//       }
//       setIsRecording(false);
//     };
    
//     recognition.onend = () => {
//       setIsRecording(false);
//       recognitionRef.current = null;
      
//       if (inputValue.trim()) {
//         handleSendMessage(inputValue);
//       }
//     };
    
//     try {
//       recognition.start();
//     } catch(e) {
//       console.error("Recognition start failed:", e);
//       setIsRecording(false);
//     }
//   }, [isLoadingAI, isSpeaking, isRecording, handleSendMessage, inputValue]);
  
//   const handleEndInterview = useCallback(async () => {
//     if (isLoadingAI || isSpeaking) return;

//     if (window.speechSynthesis.speaking) {
//       window.speechSynthesis.cancel();
//     }
//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//       recognitionRef.current = null;
//     }

//     const reportText = generateReportContent(chatMessages, companyType, role);
//     const sanitizedRole = role.replace(/[^a-zA-Z0-9]/g, '_');
//     const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
//     const filename = `${sanitizedRole}_Report_${timestamp}.pdf`;
    
//     setIsLoadingAI(true);
//     setError("Analyzing the Interview");

//     try {
//       const response = await fetch(BACKEND_UPLOAD_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           filename,
//           content: reportText,
//           role,
//           companyType,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setError(`Report saved! Redirecting to summary page...`);
//         console.log("Uploaded Report URL:", data.publicUrl);

//         localStorage.setItem("interviewReport", JSON.stringify({
//           role,
//           companyType,
//           reportUrl: data.publicUrl,
//           timestamp: new Date().toISOString(),
//         }));

//         setTimeout(() => {
//           setError(null);
//           navigate("/after-interview", { replace: true });
//         }, 3000);
//       } else {
//         throw new Error(data.details || data.error || "Unknown upload error.");
//       }
//     } catch (err) {
//       console.error("Upload failed:", err);
//       setError(`❌ Report upload failed: ${err.message}. Please try again.`);
//     } finally {
//       setIsLoadingAI(false);
//     }
//   }, [chatMessages, companyType, role, setStage, isLoadingAI, isSpeaking, navigate]);

//   useEffect(() => {
//     const startCamera = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: {
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//             frameRate: { ideal: 30 },
//             facingMode: "user"
//           },
//           audio: true,
//         });
//         setCameraAllowed(true);
//         if (userVideoRef.current) {
//           userVideoRef.current.srcObject = stream;
//           userVideoRef.current.playsInline = true;
//           await userVideoRef.current.play().catch((e) => console.log("Play error:", e));
//         }
//       } catch (error) {
//         setCameraAllowed(false);
//         console.error("Camera access denied:", error);
//         setError("Camera/Mic access denied. Please enable them to continue.");
//       }
//     };
//     startCamera();
    
//     return () => {
//       if (userVideoRef.current?.srcObject) {
//         const tracks = userVideoRef.current.srcObject.getTracks();
//         tracks.forEach(track => track.stop());
//       }
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (cameraAllowed && companyType && role && !greeted) {
//       const startAiConversation = async () => {
//         try {
//           const greetingPrompt = `You are a friendly professional interviewer for a ${role} at a ${companyType}.
// Start the mock interview. Greet the candidate professionally, mention the company type "${companyType}" and the role "${role}",
// then begin with an appropriate first question (like, "Can you start by telling me a little about yourself?").`;
          
//           setIsLoadingAI(true);
//           setChatMessages([]);
          
//           const initialMessages = [
//             { role: "user", content: "Start the interview introduction." },
//           ];
          
//           const aiQ = await fetchFireworksContent(initialMessages, greetingPrompt);
          
//           const firstMsg = {
//             sender: "AI",
//             text: aiQ,
//             time: new Date().toLocaleTimeString(),
//           };
//           setChatMessages([firstMsg]);
//           await textToSpeech(aiQ);
//           setGreeted(true);
//         } catch (error) {
//           console.error("Error sending initial greeting:", error);
//           setError(error.message || "Failed to start AI conversation");
//         } finally {
//           setIsLoadingAI(false);
//         }
//       };
//       startAiConversation();
//     }
//   }, [cameraAllowed, companyType, role, greeted, fetchFireworksContent, textToSpeech]);

//   const toggleFullScreen = async () => {
//     const elem = screenRef.current;
//     if (!document.fullscreenElement) {
//       await elem.requestFullscreen();
//       setIsFullScreen(true);
//     } else {
//       await document.exitFullscreen();
//       setIsFullScreen(false);
//     }
//   };

//   if (!cameraAllowed && !error) {
//     return (
//       <div className="text-center mt-20 text-lg text-gray-700">
//         Requesting camera and microphone permission...
//       </div>
//     );
//   }

//   return (
//     <div
//       ref={screenRef}
//       className={`relative bg-gray-900 text-white flex flex-col justify-between overflow-hidden transition-all duration-300
//         ${isFullScreen ? "w-full h-full rounded-none mt-0" : "max-w-7xl mx-auto mt-4 rounded-xl shadow-xl h-[80vh]"}`}
//       style={{ background: "linear-gradient(135deg, #1f2937, #111827)" }}
//     >
//       <div className="flex justify-between items-center px-6 py-3 bg-gray-800 rounded-t-2xl flex-shrink-0">
//         <h2 className="text-lg font-light text-gray-200">
//           {companyType} — {role}
//         </h2>
//         <button onClick={toggleFullScreen} className="p-2 hover:bg-gray-700 rounded-full">
//           {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
//         </button>
//       </div>

//       <div className="flex-grow flex items-center justify-center relative overflow-hidden">
//         <video
//           ref={userVideoRef}
//           autoPlay
//           playsInline
//           muted
//           className="w-full h-full object-contain transform scale-x-[-1] bg-black"
//         />
//         <p className="absolute bottom-4 left-6 bg-black bg-opacity-50 text-sm px-3 py-1 rounded-md z-10">
//           You
//         </p>
        
//         {error && (
//           <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white p-6 rounded-lg shadow-xl z-20 max-w-md
//               ${error.includes("✅ Report saved!") ? 'bg-green-600' : 
//                 error.includes("Analyzing the Interview") ? 'bg-yellow-600' : 
//                 'bg-red-800'
//               }`}
//           >
//             <p className="font-semibold text-lg mb-2">
//               {error.includes("✅ Report saved!") ? 'Success' : 
//                 error.includes("Analyzing the Interview") ? 'Processing Report' : 
//                 'Error'
//               }
//             </p>
//             <p className="text-sm">{error}</p>
//             {error.includes("❌") && (
//               <button 
//                 onClick={() => setError(null)} 
//                 className="mt-4 bg-white text-red-800 px-4 py-2 rounded hover:bg-gray-100 transition"
//               >
//                 Dismiss
//               </button>
//             )}
//           </div>
//         )}
        
//         {isSpeaking && (
//           <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-20 animate-pulse text-sm">
//             AI is speaking...
//           </div>
//         )}

//         <div
//           className="absolute bottom-6 right-6 w-[250px] h-[200px] rounded-lg overflow-hidden border-2 border-white shadow-lg z-10"
//           style={{
//             backgroundImage: `url(/image.jpg)`,
//             backgroundSize: "cover",
//             backgroundRepeat: "no-repeat",
//             backgroundPosition: "center",
//           }}
//         >
//           <Canvas camera={{ position: [0, 0, 5] }}>
//             <ambientLight intensity={0.6} />
//             <Environment preset="studio" />
//             <DynamicModel 
//               speechText={currentAiSpeech} 
//               onSpeechEnd={handleSpeechEnd}
//             />
//           </Canvas>
//           <p className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
//             AI Interviewer
//           </p>
//         </div>

//         <div
//           className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col text-gray-800 z-20 transform transition-transform duration-300 ${
//             isChatOpen ? "translate-x-0" : "translate-x-full"
//           }`}
//         >
//           <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100 flex-shrink-0">
//             <h2 className="text-xl font-semibold text-gray-800">Conversation</h2>
//             <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
//               <X className="w-6 h-6 text-gray-700" />
//             </button>
//           </div>

//           <div className="flex-grow overflow-y-auto p-4 space-y-4">
//             {chatMessages.map((msg, idx) => (
//               <div key={idx}>
//                 <div className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}>
//                   <div
//                     className={`p-3 rounded-xl max-w-[75%] shadow-md ${
//                       msg.sender === "User"
//                         ? "bg-indigo-500 text-white rounded-br-none"
//                         : "bg-gray-200 text-gray-800 rounded-tl-none"
//                     }`}
//                   >
//                     <span className="text-xs font-semibold opacity-80">{msg.sender}</span>
//                     <p className="text-sm mt-1">{msg.text}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {isLoadingAI && !error && (
//               <div className="text-gray-500 italic flex justify-start">
//                 <div className="p-3 bg-gray-100 rounded-xl rounded-tl-none text-sm shadow-sm">AI is typing…</div>
//               </div>
//             )}
//             <div ref={chatEndRef} />
//           </div>

//           <div className="p-4 border-t bg-gray-50 flex gap-2 flex-shrink-0">
//             <button
//               type="button"
//               onClick={startSpeechRecognition}
//               disabled={isLoadingAI || isSpeaking}
//               className={`p-3 rounded-xl transition ${
//                 isRecording
//                   ? "bg-red-500 text-white shadow-red-500/50 shadow-lg animate-pulse"
//                   : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
//               }`}
//             >
//               <Mic className="w-5 h-5" />
//             </button>
//             <input
//               type="text"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               placeholder="Type or speak your response..."
//               className="flex-grow p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
//               onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
//               disabled={isLoadingAI || isSpeaking}
//             />
//             <button
//               onClick={() => handleSendMessage(inputValue)}
//               disabled={!inputValue.trim() || isLoadingAI || isSpeaking}
//               className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition disabled:opacity-50"
//             >
// Send
//             </button>
//           </div>
//         </div>
//       </div>

//            <div className="flex justify-center gap-12 bg-gray-800 py-4 border-t border-gray-700 rounded-b-2xl flex-shrink-0">
//         <button
//           onClick={handleEndInterview}
//           disabled={isLoadingAI || isSpeaking}
//           className="flex flex-col items-center text-red-500 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           <PhoneOff className="w-7 h-7 mb-1" />
//           <span className="text-xs font-medium">End Interview</span>
//         </button>
//         <button
//           onClick={() => setIsChatOpen(!isChatOpen)}
//           className={`flex flex-col items-center transition ${isChatOpen ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
//         >
//           <MessageSquare className="w-7 h-7 mb-1" />
//           <span className="text-xs font-medium">Chat</span>
//         </button>
//         <button
//           onClick={() => setError("Code editor feature is coming soon!")}
//           className="flex flex-col items-center text-gray-300 hover:text-white transition"
//         >
//           <Code className="w-7 h-7 mb-1" />
//           <span className="text-xs font-medium">Code Editor</span>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default InterviewScreen;

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PhoneOff, MessageSquare, Code, Maximize, Minimize, X, Mic } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

// --- Code Editor Modal Component ---
const CodeEditorModal = ({ isOpen, onClose, problem, onSuccess }) => {
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);

  if (!isOpen) return null;

  const boilerplate = problem?.boilerplate?.[language] || `// Waiting for coding problem...`;

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (editorRef.current && problem?.boilerplate?.[language]) {
      editorRef.current.setValue(problem.boilerplate[language]);
    }
  }, [problem, language]);

  const handleRun = async () => {
  const code = editorRef.current?.getValue();
  if (!code || !problem?.testCases) {
    setOutput([{ id: 0, output: "⚠️ No test cases available!" }]);
    return;
  }

  setLoading(true);
  setOutput([{ id: 0, output: "⏳ Running test cases..." }]);

  try {
    const results = [];
    let allPassed = true;

    for (let i = 0; i < problem.testCases.length; i++) {
      const test = problem.testCases[i];
      const args = test.input;

      const executionBoilerplate =
        language === "python"
          ? `\n\nprint(${problem.functionName}(${args}))`
          : language === "cpp"
          ? `\n#include <iostream>\nint main() {\n  std::cout << ${problem.functionName}(${args}) << std::endl;\n  return 0;\n}`
          : `\n\nconsole.log(${problem.functionName}(${args}));`;

      const userCode = `${code}\n${executionBoilerplate}`;

      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: userCode }),
      });

      const data = await res.json();
      const result = data.run?.output?.trim() || data.run?.stderr?.trim() || "No output";

      const passed = result === test.expected.trim();
      if (!passed) allPassed = false;

      results.push({
        id: i + 1,
        input: test.input,
        expected: test.expected,
        output: result,
        passed,
      });
    }

    setOutput(results);

    // 🟢 If all passed → close editor and continue interview
    if (allPassed) {
      setOutput(prev => [
        ...prev,
        { id: 999, output: "🎉 ALL TEST CASES PASSED! Great job!" }
      ]);

      // Close editor after a small delay
      // setTimeout(() => {
      //   setIsCodeEditorOpen(false);
      // }, 800);

      // MOVE TO NEXT QUESTION AUTOMATICALLY
      // handleSendMessage(
      //   "I have completed the coding problem successfully. Please give me the next interview question."
      // );
      if (allPassed) {
  setOutput(prev => [
    ...prev,
    { id: 999, output: "🎉 ALL TEST CASES PASSED! Great job!" }
  ]);

  setTimeout(() => {
    onSuccess();   // <-- tell parent “I passed!”
  }, 800);
}

    }

  } catch (err) {
    console.error(err);
    setOutput([{ id: 0, output: "❌ Execution error. Check backend connection." }]);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-7xl max-h-[95vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-800 px-6 py-4 border-b border-gray-700 rounded-t-lg">
          <h2 className="text-xl font-semibold text-white">Code Editor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Problem Description */}
          <div className="w-1/3 border-r border-gray-700 overflow-auto bg-gray-800 p-6">
            <h3 className="text-2xl font-bold text-green-400 mb-4">
              {problem?.title || "No Problem Loaded"}
            </h3>
            
            {problem?.companies && problem.companies.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-400 uppercase">Asked in Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {problem.companies.map((company, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs font-medium border border-blue-700"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-300 mb-4 text-base leading-relaxed">
              {problem?.description || "Waiting for the interviewer to assign a coding problem..."}
            </p>
            
            {problem?.example && (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h4 className="text-yellow-300 font-semibold mb-2 text-lg">Example</h4>
                <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap">
                  {problem.example}
                </pre>
              </div>
            )}

            {problem?.testCases && problem.testCases.length > 0 && (
              <div>
                <h4 className="text-cyan-300 font-semibold mb-3 text-lg">Test Cases</h4>
                <ul className="list-disc ml-5 text-gray-300 space-y-1">
                  {problem.testCases.map((test, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-medium">Input:</span> {test.input} → <span className="font-medium">Expected:</span> {test.expected}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center bg-[#252526] px-4 py-2 border-b border-gray-700">
              <select
                className="bg-[#1e1e1e] text-gray-200 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
              <button
                onClick={handleRun}
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-semibold shadow-lg transition ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 transform hover:scale-105"
                }`}
              >
                {loading ? "Running..." : "Run Code"}
              </button>
            </div>

            <Editor
              height="60%"
              theme="vs-dark"
              language={language === "cpp" ? "cpp" : language}
              value={boilerplate}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily: "Consolas, 'Courier New', monospace",
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorSmoothCaretAnimation: true,
                renderWhitespace: "none",
                lineNumbers: "on",
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />

            {/* Output Console */}
            <div className="h-40 bg-gray-950 text-white p-4 overflow-auto border-t border-gray-700 font-mono">
              <h4 className="text-cyan-400 font-bold mb-3 text-xl">Execution Results</h4>
              {Array.isArray(output) ? (
                output.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded mb-3 border ${
                      res.id === 0
                        ? "bg-gray-700 border-gray-600"
                        : res.passed
                        ? "bg-green-900 border-green-700"
                        : "bg-red-900 border-red-700"
                    }`}
                  >
                    {res.id !== 0 ? (
                      <>
                        <strong className="text-lg">Test {res.id}:</strong>{" "}
                        <span
                          className={`font-bold ${
                            res.passed ? "text-green-300" : "text-red-300"
                          }`}
                        >
                          {res.passed ? "PASSED" : "FAILED"}
                        </span>
                        <div className="mt-1 text-sm">
                          <span className="text-gray-400 block">Input: {res.input}</span>
                          <span className="text-gray-400 block">Expected: {res.expected}</span>
                          <span className="text-gray-400 block">
                            Output: <span className="text-white whitespace-pre-wrap">{res.output}</span>
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-white">{res.output}</div>
                    )}
                  </div>
                ))
              ) : (
                <pre className="text-red-400">{output}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Enhanced Model Component with Dynamic Speech ---
function DynamicModel({ speechText, onSpeechEnd, ...props }) {
  const { nodes, materials } = useGLTF('/final_prepvio_model.glb');
  const meshRef = useRef();
  const headBoneRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));
  }, [materials]);

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

  useEffect(() => {
    if (!speechText) {
      setChars([]);
      setCurrentCharIndex(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

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

  useEffect(() => {
    if (nodes?.rp_carla_rigged_001_geo?.skeleton) {
      const head = nodes.rp_carla_rigged_001_geo.skeleton.bones.find((b) =>
        b.name.toLowerCase().includes('head')
      );
      if (head) headBoneRef.current = head;
    }
  }, [nodes]);

  const offsetY = useRef(Math.random() * 0.08);
  const offsetX = useRef(Math.random() * 0.05);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (headBoneRef.current) {
      headBoneRef.current.rotation.y = Math.sin(t * 0.4 + offsetY.current) * 0.02;
      headBoneRef.current.rotation.x = Math.sin(t * 0.3 + offsetX.current) * 0.04;
    }

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

// --- API Constants ---
const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const BACKEND_UPLOAD_URL = "/api/upload"; 
const apiKey = "fw_3ZLCds9uiu6JBgAe2VWkWYh9";

const generateReportContent = (messages, company, role) => {
  let content = `--- Mock Interview Report ---\n\n`;
  content += `Role: ${role}\n`;
  content += `Company Type: ${company}\n`;
  content += `Date: ${new Date().toLocaleDateString()}\n\n`;
  content += `--- Conversation Log ---\n\n`;

  messages.forEach((msg) => {
    content += `${msg.sender}: ${msg.text}\n`;
    
    if (msg.sender === "User" && msg.feedback) {
      const suggestion = msg.feedback.suggestion || "";
      const example = msg.feedback.example || "";
      content += `[Feedback]: ${suggestion}|||${example}\n`;
    }
  });

  content += `\n=== FINAL ANALYSIS ===\n\n`;
  content += `**Overall Performance Summary**\n`;
  content += `This interview covered both HR and technical aspects for the ${role} position.\n\n`;
  
  content += `**Key Strengths Observed**\n`;
  content += `- Engaged actively throughout the conversation\n`;
  content += `- Demonstrated willingness to learn and improve\n\n`;
  
  content += `**General Recommendations**\n`;
  content += `1. Continue practicing technical concepts relevant to ${role}\n`;
  content += `2. Use the STAR method for behavioral questions\n`;
  content += `3. Build small projects to demonstrate practical skills\n`;
  content += `4. Review feedback provided after each response above\n`;

  return content;
};

const InterviewScreen = ({ 
  companyType = "Tech Startup", 
  role = "Full Stack Developer", 
  setStage = () => {}, 
  userId = "user1" 
}) => {
  const userVideoRef = useRef(null);
  const screenRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

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
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [codingProblem, setCodingProblem] = useState(null);
  const navigate = useNavigate();

  const endInterview = useCallback(() => {
    console.log("Interview ended and resources cleaned.");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.currentMediaStream) {
      window.currentMediaStream.getTracks().forEach(track => track.stop());
      window.currentMediaStream = null;
    }
    if (userVideoRef.current?.srcObject) {
      userVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      userVideoRef.current.srcObject = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsSpeaking(false);
    setIsRecording(false);
    setGreeted(false);
    setChatMessages([]);
    setError(null);
    console.log("✅ All media and states cleared.");
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("refreshFlag", "true");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    if (sessionStorage.getItem("refreshFlag") === "true") {
      sessionStorage.removeItem("refreshFlag");
      endInterview();
      navigate("/", { replace: true });
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [navigate, endInterview]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);

    const handlePopState = (e) => {
      console.log("⬅️ User navigated back — ending interview and blocking forward navigation");

      window.history.pushState(null, "", window.location.pathname);
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (userVideoRef.current?.srcObject) {
        userVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        userVideoRef.current.srcObject = null;
      }
      if (window.currentMediaStream) {
        window.currentMediaStream.getTracks().forEach(track => track.stop());
        window.currentMediaStream = null;
      }

      navigate("/", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  useEffect(() => {
    return () => {
      endInterview();
    };
  }, [endInterview]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const formatHistoryForFireworks = useCallback((history) => {
    return history.map((msg) => ({
      role: msg.sender === "AI" ? "assistant" : "user",
      content: msg.text,
    }));
  }, []);

  const fetchFireworksContent = useCallback(async (messages, systemInstruction) => {
  const messagesWithSystem = [
    { role: "system", content: systemInstruction },
    ...messages
  ];

  try {
    const res = await fetch(FIREWORKS_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "accounts/fireworks/models/deepseek-v3p1",   // ✅ FIXED MODEL
        messages: messagesWithSystem
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error:", errorText);
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "No response";
  } catch (err) {
    console.error("Fireworks API Error:", err);
    throw err;
  }
}, []);


  const generateFeedbackForAnswer = useCallback(async (userAnswer, aiQuestion) => {
    try {
      const feedbackPrompt = `You are an interview coach analyzing a candidate's answer.

Previous Question: "${aiQuestion}"
Candidate's Answer: "${userAnswer}"

Provide constructive feedback in this EXACT format (no additional text):
SUGGESTION: [One specific improvement suggestion in 1-2 sentences]
EXAMPLE: [A better way to phrase the answer in 1 sentence]

Keep it concise and actionable.`;

      const feedbackMessages = [
        { role: "user", content: feedbackPrompt }
      ];

      const feedbackText = await fetchFireworksContent(feedbackMessages, "You are a helpful interview coach providing brief, actionable feedback.");
      
      const suggestionMatch = feedbackText.match(/SUGGESTION:\s*(.+?)(?=EXAMPLE:|$)/s);
      const exampleMatch = feedbackText.match(/EXAMPLE:\s*(.+?)$/s);
      
      return {
        suggestion: suggestionMatch ? suggestionMatch[1].trim() : "Keep practicing to improve your interview responses.",
        example: exampleMatch ? exampleMatch[1].trim() : ""
      };
    } catch (err) {
      console.error("Feedback generation error:", err);
      return {
        suggestion: "Consider providing more specific examples from your experience.",
        example: "Try structuring your answer with concrete details about what you did and what you achieved."
      };
    }
  }, [fetchFireworksContent]);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
    setCurrentAiSpeech("");
    setTimeout(() => startSpeechRecognition(), 500);
  }, []);

  const textToSpeech = useCallback((text) => {
    if (!text) return;
    setIsSpeaking(true);
    setCurrentAiSpeech(text);
  }, []);

  const generateCodingProblem = useCallback(async () => {
  try {
    const response = await fetch("http://localhost:5000/api/interview/fireworks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Backend Error:", err);
      throw new Error(err?.error || "Failed to reach backend");
    }

    const data = await response.json();

    // ✅ If backend already returns clean JSON
    if (data.title && data.description && data.testCases) {
      setCodingProblem(data);
      setIsCodeEditorOpen(true);
      return;
    }

    // ⚙️ If backend returns Fireworks wrapper (fallback)
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response text");

    let cleanJson = text.replace(/```json|```/g, "").trim();
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    const parsed = JSON.parse(match[0]);

    setCodingProblem(parsed);
    setIsCodeEditorOpen(true);
  } catch (error) {
    console.error("Error generating problem:", error);
    setError("❌ Failed to generate coding problem. Please try again.");
  }
}, []);


  const handleSendMessage = useCallback(
    async (text) => {
      const messageToSend = text.trim();
      if (!messageToSend || isLoadingAI || isSpeaking) return;
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
      }
      
      setError(null);
      setInputValue("");

      const lastAiMessage = chatMessages.filter(m => m.sender === "AI").slice(-1)[0];
      const lastAiQuestion = lastAiMessage ? lastAiMessage.text : "";

      const userMsg = {
        sender: "User",
        text: messageToSend,
        time: new Date().toLocaleTimeString(),
        feedback: null
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
          systemInstruction = `
You are now in the technical round for a ${role} at a ${companyType}.
Ask ONE technical question at a time.

You MUST include coding problems naturally in the flow.
Examples:
- "Write a function to..."
- "Implement a solution for..."
- "Solve the following problem..."

Formatting rules:
1. Only ONE coding problem at a time.
2. Provide clear input/output examples.
3. DO NOT mention or open the code editor — the app handles that automatically.
`;

        }

        const formattedHistory = formatHistoryForFireworks([...chatMessages, userMsg]);
        const aiReply = await fetchFireworksContent(formattedHistory, systemInstruction);
        // --- AUTO-DETECT CODING PROBLEM FROM AI ---
if (
  aiReply.toLowerCase().includes("coding") ||
  aiReply.toLowerCase().includes("programming") ||
  aiReply.toLowerCase().includes("write a function") ||
  aiReply.toLowerCase().includes("solve") ||
  aiReply.toLowerCase().includes("implement")
) {
  try {
    const response = await fetch("http://localhost:5000/api/interview/fireworks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    setCodingProblem(data);      // load coding problem
    setIsCodeEditorOpen(true);   // auto-open editor

  } catch (err) {
    console.error("Error loading coding problem:", err);
    setError("❌ Failed to load coding problem.");
  }
}


        const feedback = await generateFeedbackForAnswer(messageToSend, lastAiQuestion);
        
        setChatMessages((prev) => {
          const updated = [...prev];
          const lastUserIndex = updated.map(m => m.sender).lastIndexOf("User");
          if (lastUserIndex !== -1) {
            updated[lastUserIndex] = { ...updated[lastUserIndex], feedback };
          }
          return updated;
        });

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
    [isLoadingAI, isSpeaking, chatMessages, interviewStage, role, companyType, formatHistoryForFireworks, fetchFireworksContent, textToSpeech, generateFeedbackForAnswer]
  );

 const startSpeechRecognition = useCallback(() => {
    if (isLoadingAI || isSpeaking) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };
    
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join('');
      setInputValue(transcript);
    };
    
    recognition.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      if (e.error !== 'no-speech') {
        setError("Error in speech recognition: " + e.error);
      }
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      
      if (inputValue.trim()) {
        handleSendMessage(inputValue);
      }
    };
    
    try {
      recognition.start();
    } catch(e) {
      console.error("Recognition start failed:", e);
      setIsRecording(false);
    }
  }, [isLoadingAI, isSpeaking, isRecording, handleSendMessage, inputValue]);
  
  const handleEndInterview = useCallback(async () => {
    if (isLoadingAI || isSpeaking) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const reportText = generateReportContent(chatMessages, companyType, role);
    const sanitizedRole = role.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = `${sanitizedRole}_Report_${timestamp}.pdf`;
    
    setIsLoadingAI(true);
    setError("Analyzing the Interview");

    try {
      const response = await fetch(BACKEND_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: reportText,
          role,
          companyType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(`Report saved! Redirecting to summary page...`);
        console.log("Uploaded Report URL:", data.publicUrl);

        localStorage.setItem("interviewReport", JSON.stringify({
          role,
          companyType,
          reportUrl: data.publicUrl,
          timestamp: new Date().toISOString(),
        }));

        setTimeout(() => {
          setError(null);
          navigate("/after-interview", { replace: true });
        }, 3000);
      } else {
        throw new Error(data.details || data.error || "Unknown upload error.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError(`❌ Report upload failed: ${err.message}. Please try again.`);
    } finally {
      setIsLoadingAI(false);
    }
  }, [chatMessages, companyType, role, setStage, isLoadingAI, isSpeaking, navigate]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: "user"
          },
          audio: true,
        });
        setCameraAllowed(true);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.playsInline = true;
          await userVideoRef.current.play().catch((e) => console.log("Play error:", e));
        }
      } catch (error) {
        setCameraAllowed(false);
        console.error("Camera access denied:", error);
        setError("Camera/Mic access denied. Please enable them to continue.");
      }
    };
    startCamera();
    
    return () => {
      if (userVideoRef.current?.srcObject) {
        const tracks = userVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 🚀 TEST MODE: Generate coding question before greeting
// 🚀 Generate coding question BEFORE greeting
  useEffect(() => {
    if (cameraAllowed && !codingProblem) {
      console.log("⚡ Generating coding question before greeting...");

      const loadEarlyCodingProblem = async () => {
        try {
          setIsLoadingAI(true);
          const response = await fetch("http://localhost:5000/api/interview/fireworks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            throw new Error("Failed to generate coding problem");
          }

          const data = await response.json();
          console.log("✅ Coding problem generated:", data);
          
          setCodingProblem(data);
          setIsCodeEditorOpen(true);
          
          // Now proceed with greeting
          const greetingPrompt = `You are a friendly professional interviewer for a ${role} at a ${companyType}.
Start the mock interview. Greet the candidate professionally, mention the company type "${companyType}" and the role "${role}",
then begin with an appropriate first question (like, "Can you start by telling me a little about yourself?").`;
          
          const initialMessages = [
            { role: "user", content: "Start the interview introduction." },
          ];
          
          const aiQ = await fetchFireworksContent(initialMessages, greetingPrompt);
          
          // Format the coding problem for chat display
          const codingQuestionText = `${data.title || "Coding Challenge"}

${data.description || ""}

${data.example ? `Example:\n${data.example}` : ""}

${data.testCases && data.testCases.length > 0 ? `\nTest Cases:\n${data.testCases.map((tc, i) => `${i + 1}. Input: ${tc.input} → Expected: ${tc.expected}`).join('\n')}` : ""}

You can use the Code Editor to solve this problem.`;

          const messages = [
            {
              sender: "AI",
              text: aiQ,
              time: new Date().toLocaleTimeString(),
            },
            {
              sender: "AI",
              text: codingQuestionText,
              time: new Date().toLocaleTimeString(),
            }
          ];
          
          setChatMessages(messages);
          
          // Speak the greeting first, then mention the coding challenge
          const fullSpeech = `${aiQ}. I've also shared a coding challenge in the chat. Please take a look at it in the code editor.`;
          await textToSpeech(fullSpeech);
          setGreeted(true);
          
        } catch (err) {
          console.error("Error in early setup:", err);
          setError(`❌ Failed to initialize interview: ${err.message}`);
        } finally {
          setIsLoadingAI(false);
        }
      };

      loadEarlyCodingProblem();
    }
  }, [cameraAllowed, greeted, codingProblem, role, companyType, fetchFireworksContent, textToSpeech]);


  useEffect(() => {
    if (cameraAllowed && companyType && role && !greeted) {
      const startAiConversation = async () => {
        try {
          const greetingPrompt = `You are a friendly professional interviewer for a ${role} at a ${companyType}.
Start the mock interview. Greet the candidate professionally, mention the company type "${companyType}" and the role "${role}",
then begin with an appropriate first question (like, "Can you start by telling me a little about yourself?").`;
          
          setIsLoadingAI(true);
          setChatMessages([]);
          
          const initialMessages = [
            { role: "user", content: "Start the interview introduction." },
          ];
          
          const aiQ = await fetchFireworksContent(initialMessages, greetingPrompt);
          
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
  }, [cameraAllowed, companyType, role, greeted, fetchFireworksContent, textToSpeech]);

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
        Requesting camera and microphone permission...
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
      <div className="flex justify-between items-center px-6 py-3 bg-gray-800 rounded-t-2xl flex-shrink-0">
        <h2 className="text-lg font-light text-gray-200">
          {companyType} — {role}
        </h2>
        <button onClick={toggleFullScreen} className="p-2 hover:bg-gray-700 rounded-full">
          {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

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
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white p-6 rounded-lg shadow-xl z-20 max-w-md
              ${error.includes("✅ Report saved!") ? 'bg-green-600' : 
                error.includes("Analyzing the Interview") ? 'bg-yellow-600' : 
                'bg-red-800'
              }`}
          >
            <p className="font-semibold text-lg mb-2">
              {error.includes("✅ Report saved!") ? 'Success' : 
                error.includes("Analyzing the Interview") ? 'Processing Report' : 
                'Error'
              }
            </p>
            <p className="text-sm">{error}</p>
            {error.includes("❌") && (
              <button 
                onClick={() => setError(null)} 
                className="mt-4 bg-white text-red-800 px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
        
        {isSpeaking && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-20 animate-pulse text-sm">
            AI is speaking...
          </div>
        )}

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
              <div key={idx}>
                <div className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-3 rounded-xl max-w-[75%] shadow-md ${
                      msg.sender === "User"
                        ? "bg-indigo-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-tl-none"
                    }`}
                  >
                    <span className="text-xs font-semibold opacity-80">{msg.sender}</span>
                    <p className="text-sm mt-1">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoadingAI && !error && (
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

           <div className="flex justify-center gap-12 bg-gray-800 py-4 border-t border-gray-700 rounded-b-2xl flex-shrink-0">
        <button
          onClick={handleEndInterview}
          disabled={isLoadingAI || isSpeaking}
          className="flex flex-col items-center text-red-500 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
  onClick={() => {
    if (!codingProblem) {
      setError("⚠️ No coding problem assigned yet!");
      return;
    }
    setIsCodeEditorOpen(true);
  }}
  disabled={isLoadingAI}
  className="flex flex-col items-center text-gray-300 hover:text-white transition disabled:opacity-50"
>
  <Code className="w-7 h-7 mb-1" />
  <span className="text-xs font-medium">Code Editor</span>
</button>




      </div>
      {isCodeEditorOpen && (
  <CodeEditorModal
  isOpen={isCodeEditorOpen}
  onClose={() => setIsCodeEditorOpen(false)}
  problem={codingProblem}
  onSuccess={() => {
    setIsCodeEditorOpen(false);
    handleSendMessage(
      "I have completed the coding problem successfully. Please give me the next interview question."
    );
  }}
/>
)}

    </div>
  );
};

export default InterviewScreen;