import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, Mic, Volume2, StopCircle, Check } from 'lucide-react';

// --- Configuration ---
const SERVER_ENDPOINT = '/api/interview/ask';
const SAMPLE_RATE = 24000; // Gemini TTS default sample rate

const COMPANY_TYPES = ['Product (High-Scale)', 'Service (Client-Focused)', 'Startup (Fast-Paced)'];

// Role Mapping: Defines available roles based on the selected company type
const ROLE_MAPPING = {
    'Product (High-Scale)': ['Frontend Engineer (React)', 'Backend Engineer (Node/Go)', 'DevOps Engineer (Cloud)'],
    'Service (Client-Focused)': ['Full Stack Engineer (JS)', 'Project Manager', 'Solutions Architect'],
    'Startup (Fast-Paced)': ['Full Stack Engineer (TS/React)', 'Data Scientist/ML Engineer', 'Founding Engineer (Generalist)'],
};

// --- Audio Utility Functions (for playing PCM data from server) ---

const base64ToArrayBuffer = (base64) => {
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        console.log("Audio Step 2: Base64 converted to ArrayBuffer successfully. Length:", len);
        return bytes.buffer;
    } catch (e) {
        console.error("Audio Error: Failed at base64ToArrayBuffer.", e);
        return null;
    }
};

const pcmToWav = (pcm16) => {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit PCM
    const byteRate = SAMPLE_RATE * numChannels * bytesPerSample;
    const blockAlign = numChannels * bytesPerSample;

    // 44 bytes for the WAV header + PCM data length
    const wavData = new DataView(new ArrayBuffer(44 + pcm16.byteLength));
    let offset = 0;

    try {
        // RIFF header
        wavData.setUint32(offset, 0x52494646, false); offset += 4; // 'RIFF'
        wavData.setUint32(offset, 36 + pcm16.byteLength, true); offset += 4; // File size
        wavData.setUint32(offset, 0x57415645, false); offset += 4; // 'WAVE'

        // fmt chunk
        wavData.setUint32(offset, 0x666d7420, false); offset += 4; // 'fmt '
        wavData.setUint32(offset, 16, true); offset += 4; // Chunk size (16 for PCM)
        wavData.setUint16(offset, 1, true); offset += 2; // Audio format (1 for PCM)
        wavData.setUint16(offset, numChannels, true); offset += 2; // Number of channels
        wavData.setUint32(offset, SAMPLE_RATE, true); offset += 4; // Sample rate
        wavData.setUint32(offset, byteRate, true); offset += 4; // Byte rate
        wavData.setUint16(offset, blockAlign, true); offset += 2; // Block align
        wavData.setUint16(offset, 8 * bytesPerSample, true); offset += 2; // Bits per sample (16)

        // data chunk
        wavData.setUint32(offset, 0x64617461, false); offset += 4; // 'data'
        wavData.setUint32(offset, pcm16.byteLength, true); offset += 4; // Data size

        // Copy PCM data
        const pcm8 = new Uint8Array(pcm16.buffer);
        for (let i = 0; i < pcm8.length; i++) {
            wavData.setInt8(offset + i, pcm8[i]);
        }

        console.log("Audio Step 3: Raw PCM successfully converted to WAV Blob.");
        return new Blob([wavData.buffer], { type: 'audio/wav' });

    } catch (e) {
        console.error("Audio Error: Failed at pcmToWav conversion.", e);
        return null;
    }
};

// --- React Component ---

const VirtualInterviewApp = () => {
    // Set initial state to null to enforce selection
    const [stage, setStage] = useState('setup');
    const [companyType, setCompanyType] = useState(null);
    const [role, setRole] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [roleWarning, setRoleWarning] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const messagesEndRef = useRef(null);
    const audioPlayerRef = useRef(new Audio());

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Handle audio playback logic
    const playAudio = useCallback((base64AudioData) => {
        if (!base64AudioData || isPlaying) {
            console.log("Audio Skipped: No data or already playing.");
            return;
        }

        console.log("Audio Step 1: Starting audio processing.");

        try {
            const pcmBuffer = base64ToArrayBuffer(base64AudioData);
            if (!pcmBuffer) throw new Error("Could not convert Base64 data to ArrayBuffer.");
            
            const pcm16 = new Int16Array(pcmBuffer); 
            const wavBlob = pcmToWav(pcm16);
            if (!wavBlob) throw new Error("Could not convert PCM data to WAV Blob.");
            
            const audioUrl = URL.createObjectURL(wavBlob);
            
            audioPlayerRef.current.src = audioUrl;
            
            audioPlayerRef.current.onplay = () => {
                setIsPlaying(true);
                console.log("Audio Step 5: Playback started.");
            };
            audioPlayerRef.current.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
                console.log("Audio Step 6: Playback ended and URL revoked.");
            };
            audioPlayerRef.current.onerror = (e) => {
                console.error("Audio Step 6 (Error): Playback failed on the Audio element.", e);
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
                setChatHistory(prev => [...prev, { role: 'system', text: 'Error playing audio response. Check console for details.' }]);
            };
            
            console.log("Audio Step 4: Attempting to play audio...");
            audioPlayerRef.current.play().catch(e => {
                console.error("Audio Step 4 (Error): Play Promise rejected. This often means the browser blocked autoplay. User interaction is required.", e);
                setChatHistory(prev => [...prev, { role: 'system', text: 'Playback failed. Please try clicking the replay icon next to the question once it appears.' }]);
                setIsPlaying(false); // Reset in case of failure
            });

        } catch (error) {
            console.error("Audio Error: Failed to process or play audio:", error);
            setChatHistory(prev => [...prev, { role: 'system', text: `Failed to play audio: ${error.message}` }]);
        }
    }, [isPlaying]);

    // Cleanup function for audio player
    useEffect(() => {
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.onended = null;
                audioPlayerRef.current.onerror = null;
            }
        };
    }, []);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Function to handle communication with the Express backend
    const askServerForNextQuestion = useCallback(async (history) => {
        setLoading(true);

        const payload = { chatHistory: history, companyType, role };

        try {
            const response = await fetch(SERVER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: 'Non-JSON server error. Check routing.' }));
                console.error('Server Error Response:', errorBody);
                throw new Error(errorBody.message || `Server call failed with status: ${response.status}`);
            }

            const { text, audioData } = await response.json();
            
            if (audioData) {
                console.log("Server Response Check: Audio data (base64) received from server.");
            } else {
                console.log("Server Response Check: ONLY text received from server (TTS may have failed on backend).");
            }
            
            setChatHistory(prev => [...prev, { role: 'ai', text, audioData }]);

            if (audioData) {
                // Play immediately after setting history
                playAudio(audioData);
            }

        } catch (error) {
            console.error("Interview Server Error:", error);
            setChatHistory(prev => [...prev, { role: 'ai', text: `An error occurred: ${error.message}. Please check your backend server.` }]);
        } finally {
            setLoading(false);
        }
    }, [companyType, role, playAudio]);

    // Microphone Recording Logic (STT Simulation)
    const startRecording = async () => {
        if (isPlaying) {
            audioPlayerRef.current.pause();
            setIsPlaying(false);
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                // eslint-disable-next-line no-unused-vars
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // In a real app, upload this blob to a STT API.
                simulateSpeechToText();
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
            };

            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access error:", error);
            // Non-alert UI message for permission error
            setChatHistory(prev => [...prev, { role: 'system', text: 'Microphone access denied. Please grant permission to record your answer.' }]);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setLoading(true); // Set loading while we process STT
        }
    };

    const simulateSpeechToText = () => {
        setLoading(false);
        // Prompt for manual input to simulate the STT result
        const recordedText = window.prompt("Recording complete. Please type your spoken answer:");

        if (recordedText && recordedText.trim()) {
            sendMessage(recordedText.trim());
        } else {
            // If the user cancels the prompt or types nothing, treat it as a silent submission
            // We set loading back to false and do nothing, allowing the user to try again.
        }
    };

    // Handles sending a user message (triggered after simulated STT)
    const sendMessage = (textToSend) => {
        const newUserMessage = { role: 'user', text: textToSend };
        const newHistory = [...chatHistory, newUserMessage];
        
        setChatHistory(newHistory);
        
        // Send the updated history to the server to get the next AI question
        askServerForNextQuestion(newHistory);
    };

    // Starts the interview and triggers the first AI response
    const startInterview = () => {
        if (companyType && role) {
            setStage('interview');
            // Initial user prompt to kick off the conversation
            const initialPrompt = `Start the interview now. The candidate has selected the role of ${role} at a ${companyType} company.`;
            const initialHistory = [{ role: 'user', text: initialPrompt }];
            setChatHistory(initialHistory);
            askServerForNextQuestion(initialHistory);
        }
    };
    
    // Replay button handler
    const handleReplay = (audioData) => {
        if (audioData) {
            // Stop current playback if any
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.currentTime = 0;
            }
            playAudio(audioData);
        }
    };

    // --- UI Components ---

    // Generic Dropdown component styled to match the image
    const SelectionButton = ({ label, value, options, onSelect, disabled = false, placeholder, className = '' }) => {
        const [isOpen, setIsOpen] = useState(false);
        const ref = useRef();
        
        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (ref.current && !ref.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [ref]);

        const displayValue = value || placeholder;

        return (
            <div className={`relative w-96 max-w-full ${className}`} ref={ref}>
                <button
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(!isOpen);
                        } else {
                            setRoleWarning(true);
                            setTimeout(() => setRoleWarning(false), 3000);
                        }
                    }}
                    className={`
                        w-full p-3 text-center border-2 shadow-md transition-all duration-200
                        ${disabled 
                            ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-50'
                        }
                    `}
                    disabled={disabled}
                >
                    <span className={`${!value && 'text-gray-500'}`}>{displayValue}</span>
                </button>
                
                {/* Dropdown Menu */}
                {isOpen && options.length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 shadow-xl max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <div
                                key={option}
                                onClick={() => {
                                    onSelect(option);
                                    setIsOpen(false);
                                }}
                                className={`
                                    p-3 text-gray-800 cursor-pointer hover:bg-indigo-50 flex items-center justify-between
                                    ${value === option ? 'bg-indigo-100 font-semibold' : ''}
                                `}
                            >
                                {option}
                                {value === option && <Check className="w-4 h-4 text-indigo-600" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const SetupScreen = () => {
        const availableRoles = companyType ? ROLE_MAPPING[companyType] : [];
        const isReadyToStart = companyType && role;

        const handleCompanyTypeSelect = (type) => {
            setCompanyType(type);
            // Reset role if company type changes
            if (role && availableRoles.includes(role)) {
                // In a real application, you might try to keep the role if it exists in the new list, 
                // but resetting ensures the user makes a deliberate choice.
                setRole(null);
            } else if (role) {
                 setRole(null);
            }
        };

        const handleRoleSelect = (selectedRole) => {
            if (companyType) {
                setRole(selectedRole);
                setRoleWarning(false);
            }
        };

        return (
            <div className="p-8 space-y-8 max-w-xl mx-auto flex flex-col items-center bg-white shadow-none rounded-xl font-serif">
                <h2 className="text-xl text-gray-800 font-light tracking-widest">
                    Check Your Ability
                </h2>
                <p className="text-gray-600 text-center text-lg mt-0 mb-8 font-light">
                    Select preferred company type & Role below
                </p>
                
                <div className="space-y-4">
                    {/* Company Type Selection */}
                    <SelectionButton
                        placeholder="Select Your Company Type"
                        value={companyType}
                        options={COMPANY_TYPES}
                        onSelect={handleCompanyTypeSelect}
                        className="mb-4"
                    />

                    {/* Role Selection */}
                    <SelectionButton
                        placeholder="Select Your Role"
                        value={role}
                        options={availableRoles}
                        onSelect={handleRoleSelect}
                        disabled={!companyType}
                        className="mt-4"
                    />

                    {/* Warning Message for Role Selection */}
                    {roleWarning && (
                        <p className="text-red-500 text-sm text-center font-sans mt-2 transition-opacity duration-300">
                            Please select a Company Type first.
                        </p>
                    )}
                </div>

                {/* Start Button */}
                <button
                    onClick={startInterview}
                    className={`
                        mt-12 py-3 px-8 text-lg font-normal rounded-full transition-all duration-300 border-2
                        ${isReadyToStart
                            ? 'bg-gray-100 text-gray-700 border-gray-700 shadow-md hover:bg-gray-200 hover:scale-[1.03]'
                            : 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'
                        }
                    `}
                    disabled={!isReadyToStart}
                >
                    Click To Start Your Interview
                </button>
            </div>
        );
    };

    const VideoPane = ({ name, isInterviewer, isPlaying }) => (
        <div 
            className={`w-36 h-28 sm:w-48 sm:h-36 rounded-lg overflow-hidden border-2 transition-all duration-300 relative shadow-xl ${
                isInterviewer 
                    ? 'border-indigo-400' 
                    : 'border-green-400'
            } bg-gray-900 flex items-center justify-center`}
        >
            {/* Video Placeholder */}
            <Volume2 className="w-1/3 h-1/3 text-gray-600 opacity-50" />
            
            {/* Active Speaker Indicator / Audio Status */}
            {isInterviewer && isPlaying && (
                 <div className="absolute top-2 left-2 p-1 bg-red-500 rounded-full animate-pulse">
                     <Volume2 className="w-3 h-3 text-white"/>
                 </div>
            )}

            {/* Name Tag (Bottom Left of Pane) */}
            <div className="absolute bottom-1 left-1 bg-black/50 px-2 py-0.5 rounded text-white text-[10px] sm:text-xs font-semibold">
                {name}
            </div>
        </div>
    );

    const InterviewScreen = () => (
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden relative">
            
            {/* Header / Meeting Title */}
            <div className="p-3 bg-gray-900 text-white flex justify-between items-center shadow-lg z-10">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                    {/* Displaying selected Company and Role */}
                    Interview: {role} @ {companyType.split('(')[0].trim()}
                </h2>
                <button
                    onClick={() => setStage('setup')}
                    className="text-sm border border-white/30 px-3 py-1 rounded-full text-red-400 hover:bg-white/10 transition"
                >
                    End Call
                </button>
            </div>

            {/* Main Video/Content Area (Dark Background) */}
            <div className="flex-grow relative p-4 bg-gray-800">
                
                {/* Interviewer Video Pane (Bottom Right) */}
                <div className="absolute bottom-4 right-4 z-20">
                    <VideoPane 
                        name="Interviewer (Gemini)" 
                        isInterviewer={true} 
                        isPlaying={isPlaying} 
                    />
                </div>

                {/* Candidate Video Pane (Bottom Left) */}
                <div className="absolute bottom-4 left-4 z-20">
                    <VideoPane 
                        name="Candidate (You)" 
                        isInterviewer={false} 
                        isPlaying={isRecording}
                    />
                </div>

                {/* Chat History Overlay */}
                <div className="absolute top-4 left-4 right-4 bottom-24 sm:right-auto sm:w-96 p-4 rounded-xl bg-black/70 shadow-2xl transition duration-300">
                    <h3 className="text-white font-bold text-sm mb-2 border-b border-gray-600 pb-2">
                        Interview Chat Log
                    </h3>
                    <div className="h-full overflow-y-auto custom-scrollbar space-y-3 pb-8">
                        {chatHistory
                            .filter(msg => msg.role !== 'user' || msg.text.startsWith('Start the interview') === false)
                            .map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs p-2 rounded-lg shadow-md text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-200'
                                    }`}
                                >
                                    <div className="font-semibold mb-0.5 text-[10px] flex items-center justify-between">
                                        {msg.role === 'user' ? 'You' : 'Interviewer'}
                                        {msg.role === 'ai' && msg.audioData && (
                                            <button 
                                                onClick={() => handleReplay(msg.audioData)}
                                                className="text-gray-400 hover:text-white disabled:opacity-50 transition"
                                                title="Replay Audio"
                                                disabled={isPlaying}
                                            >
                                                <Volume2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="prose text-xs text-inherit" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }} />
                                </div>
                            </div>
                        ))}
                        
                        {(loading || isPlaying) && (
                            <div className="flex justify-start">
                                <div className="p-2 rounded-lg bg-gray-700 text-gray-300 shadow-md flex items-center space-x-1">
                                    {isPlaying ? <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" /> : <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                                    <span className="text-xs">{isPlaying ? 'Interviewer speaking...' : 'AI thinking...'}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Controls Area (Fixed at Bottom) */}
            <div className="p-3 bg-gray-900 border-t border-gray-700 flex items-center justify-center space-x-4">
                
                {isRecording ? (
                    <button
                        onClick={stopRecording}
                        className="py-2 px-6 bg-red-600 text-white font-bold rounded-full shadow-xl transition duration-150 flex items-center justify-center space-x-2 hover:bg-red-700 animate-pulse"
                        disabled={loading || isPlaying}
                    >
                        <StopCircle className="w-6 h-6" />
                        <span>Recording...</span>
                    </button>
                ) : (
                    <button
                        onClick={startRecording}
                        className="py-2 px-6 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 shadow-xl transition duration-150 flex items-center justify-center space-x-2 disabled:bg-gray-500"
                        disabled={loading || isPlaying || isPlaying}
                    >
                        <Mic className="w-6 h-6" />
                        <span>{loading ? "Waiting for question..." : "Record Answer"}</span>
                    </button>
                )}
                
                <p className="text-xs text-gray-400 hidden sm:block">
                    Simulated STT: Browser prompt for typing answer.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center bg-gray-100 font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>{`
                /* Using a serif font for the setup screen, relying on system fonts now */
                .font-serif { font-family: ui-serif, 'Georgia', 'Cambria', "Times New Roman", Times, serif; }
                .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
                
                /* Custom scrollbar for chat history */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
            `}</style>
            
            <div className="w-full h-[85vh]">
                {stage === 'setup' ? <SetupScreen /> : <InterviewScreen />}
            </div>
        </div>
    );
};

export default VirtualInterviewApp;
