// InterviewScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { PhoneOff, MessageSquare, Code, Maximize, Minimize, X } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Model } from "../interview-page/Model.jsx"; // adjust path if needed

const InterviewScreen = ({ companyType, role, setStage }) => {
  const userVideoRef = useRef(null);
  const screenRef = useRef(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "AI", time: "9:22 AM", text: "Introduce yourself." },
    { sender: "You", time: "9:23 AM", text: "Hello, I’m Afnan — passionate about web development!" },
    { sender: "AI", time: "9:25 AM", text: "Nice! Can you explain the difference between var, let, and const?" },
  ]);
  const [inputValue, setInputValue] = useState("");

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
        alert("Please allow camera access to start the interview.");
      }
    };
    startCamera();
  }, []);

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

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMessage = { sender: "You", time: "Now", text: inputValue };
    setChatMessages((prev) => [...prev, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", time: "Now", text: "Good answer! Let's move to the next question." },
      ]);
    }, 1000);

    setInputValue("");
  };

  if (!cameraAllowed)
    return (
      <div className="text-center mt-20 text-lg text-gray-700">
        Please allow camera permission to begin your interview.
      </div>
    );

  return (
    <div
      ref={screenRef}
      className="relative bg-gray-900 text-white flex flex-col justify-between max-w-6xl mx-auto mt-8 rounded-2xl shadow-2xl h-[85vh] overflow-hidden"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-3 bg-gray-800 rounded-t-2xl">
        <h2 className="text-lg font-light text-gray-200">
          {companyType} — {role}
        </h2>
        <button onClick={toggleFullScreen} className="p-2 hover:bg-gray-700 rounded-full">
          {isFullScreen ? <Minimize /> : <Maximize />}
        </button>
      </div>

      {/* MAIN VIDEO AREA */}
      <div className="flex-grow flex items-center justify-center relative overflow-hidden bg-black">
        {/* Candidate Camera */}
        <video
          ref={userVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain transform scale-x-[-1] bg-black"
        ></video>
        <p className="absolute bottom-4 left-6 bg-black bg-opacity-50 text-sm px-3 py-1 rounded-md">
          You
        </p>

        {/* 3D INTERVIEWER MODEL */}
        <div
          className="absolute bottom-6 right-6 w-[300px] h-[250px] rounded-lg overflow-hidden border-2 border-white shadow-lg"
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
            <Model />
          </Canvas>
        </div>

        {/* CHAT PANEL */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col text-gray-800 z-20 transform transition-transform duration-300 ${
            isChatOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Chat Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold">Conversation</h2>
            <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`p-3 rounded-xl max-w-[75%] ${
                    msg.sender === "You"
                      ? "bg-indigo-100 text-gray-800 rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  <p className="text-xs font-semibold">{msg.sender}</p>
                  <p className="text-sm mt-1">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your response..."
              className="flex-grow p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* CONTROL BAR */}
      <div className="flex justify-center gap-8 bg-gray-800 py-4 border-t border-gray-700 rounded-b-2xl">
        <button
          onClick={() => setStage("rounds")}
          className="flex flex-col items-center text-red-500 hover:text-red-400 transition"
        >
          <PhoneOff className="w-7 h-7 mb-1" />
          <span className="text-xs">End</span>
        </button>
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex flex-col items-center text-gray-300 hover:text-white transition"
        >
          <MessageSquare className="w-7 h-7 mb-1" />
          <span className="text-xs">Chat</span>
        </button>
        <button
          onClick={() => alert("Code editor coming soon")}
          className="flex flex-col items-center text-gray-300 hover:text-white transition"
        >
          <Code className="w-7 h-7 mb-1" />
          <span className="text-xs">Code</span>
        </button>
      </div>
    </div>
  );
};

export default InterviewScreen;
