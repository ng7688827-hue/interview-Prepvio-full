import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, Send, CornerDownLeft, Briefcase, Code, UserCheck } from 'lucide-react';

// --- Configuration ---
const SERVER_ENDPOINT = '/api/interview/ask';

const COMPANY_TYPES = ['Product (High-Scale)', 'Service (Client-Focused)', 'Startup (Fast-Paced)'];
const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Engineer', 'DevOps Engineer', 'Data Scientist'];

const VirtualInterviewApp = () => {
    const [stage, setStage] = useState('setup'); 
    const [companyType, setCompanyType] = useState(COMPANY_TYPES[0]);
    const [role, setRole] = useState(ROLES[0]);
    const [chatHistory, setChatHistory] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const askServerForNextQuestion = useCallback(async (history) => {
        setLoading(true);

        const payload = {
            chatHistory: history,
            companyType,
            role,
        };

        try {
            const response = await fetch(SERVER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error('Server Error Response:', errorBody);
                throw new Error(errorBody.message || `Server call failed with status: ${response.status}`);
            }

            const { text } = await response.json();
            setChatHistory(prev => [...prev, { role: 'ai', text }]);

        } catch (error) {
            console.error("Interview Server Error:", error);
            setChatHistory(prev => [...prev, { role: 'ai', text: `An error occurred: ${error.message}. Please check your backend server.` }]);
        } finally {
            setLoading(false);
        }
    }, [companyType, role]);

    const startInterview = () => {
        setStage('interview');
        const initialPrompt = `Start the interview now. The candidate has selected the role of ${role} at a ${companyType} company.`;
        const initialHistory = [{ role: 'user', text: initialPrompt }];
        setChatHistory(initialHistory);
        askServerForNextQuestion(initialHistory);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!userInput.trim() || loading) return;

        const newUserMessage = { role: 'user', text: userInput };
        const newHistory = [...chatHistory, newUserMessage];

        setChatHistory(newHistory);
        setUserInput('');

        askServerForNextQuestion(newHistory);
    };

    const SetupScreen = () => (
        <div className="p-8 space-y-8 max-w-lg mx-auto bg-white shadow-xl rounded-xl">
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
                <UserCheck className="w-8 h-8 mr-3 text-indigo-600" />
                Virtual Interview Setup
            </h1>
            <p className="text-gray-600">Select the environment and role to tailor your mock interview experience.</p>

            <div className="space-y-3">
                <label className="text-lg font-semibold text-gray-700 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-indigo-500" />
                    Company Type
                </label>
                <div className="grid grid-cols-1 gap-3">
                    {COMPANY_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setCompanyType(type)}
                            className={`p-4 rounded-lg text-sm transition duration-200 border-2 ${
                                companyType === type
                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-md'
                                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-lg font-semibold text-gray-700 flex items-center">
                    <Code className="w-5 h-5 mr-2 text-indigo-500" />
                    Target Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {ROLES.map(r => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`p-3 rounded-lg text-sm transition duration-200 border-2 ${
                                role === r
                                    ? 'bg-purple-600 border-purple-700 text-white shadow-md'
                                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={startInterview}
                className="w-full py-4 text-white font-bold bg-green-500 hover:bg-green-600 rounded-lg shadow-lg transition duration-300 transform hover:scale-[1.01]"
            >
                Start Interview
            </button>

            <p className="text-xs text-center text-gray-400 mt-6">
                *Interview will be powered securely by your Express backend.
            </p>
        </div>
    );

    const InterviewScreen = () => (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-lg">
                <h2 className="text-xl font-semibold">
                    Mock Interview: {role} @ {companyType.split('(')[0].trim()}
                </h2>
                <button
                    onClick={() => setStage('setup')}
                    className="text-sm border border-white/50 px-3 py-1 rounded-full hover:bg-white/10 transition"
                >
                    End Interview
                </button>
            </div>

            <div className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar bg-gray-50">
                {chatHistory
                    .filter(msg => msg.role !== 'user' || msg.text.startsWith('Start the interview') === false)
                    .map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-3/4 p-3 rounded-xl shadow-md ${
                                msg.role === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
                            }`}
                        >
                            <div className="font-semibold mb-1 text-xs">
                                {msg.role === 'user' ? 'You' : 'Interviewer'}
                            </div>
                            <div
                                className="prose text-sm"
                                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }}
                            />
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="p-3 rounded-xl bg-gray-200 text-gray-800 rounded-tl-none shadow-md">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t bg-white">
                <div className="flex items-center space-x-3">
                    <input
                        autoFocus
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={loading ? "Waiting for response..." : "Type your answer..."}
                        className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 disabled:bg-gray-100"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!userInput.trim() || loading}
                        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300 shadow-md"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center justify-end">
                    Press <CornerDownLeft className="w-3 h-3 mx-1" /> to send
                </p>
            </form>
        </div>
    );

    return (
        <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center bg-gray-100 font-sans">
            <div className="w-full h-[85vh]">
                {stage === 'setup' ? <SetupScreen /> : <InterviewScreen />}
            </div>
        </div>
    );
};

export default VirtualInterviewApp;
