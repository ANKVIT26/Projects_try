import React, { useState, useEffect, useRef } from 'react';
import type { WeatherData } from '../types';
import { getAiResponse, createInitialPrompt } from '../services/geminiService';

interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

// Renders a single message in the chat
const ChatMessage: React.FC<{ message: ConversationMessage }> = ({ message }) => {
  const isModel = message.role === 'model';

  const renderContent = () => {
    // A simple markdown-to-html renderer
    return message.text.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      let formattedParagraph = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>') // Bold for model, but works for user too
        .replace(/^\s*[\d-]\.\s(.*)/, '<li class="ml-4">$1</li>'); // Numbered/dashed lists

      if (formattedParagraph.startsWith('<li')) {
        return <ul key={index} className="list-disc list-inside" dangerouslySetInnerHTML={{ __html: formattedParagraph }} />;
      }
      return <p key={index} dangerouslySetInnerHTML={{ __html: formattedParagraph }} />;
    });
  };

  return (
    <div className={`flex gap-3 my-4 animate-fade-in ${isModel ? '' : 'justify-end'}`}>
      {isModel && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300"><path d="M12 8V4H8"/><rect x="4" y="12" width="8" height="8" rx="2"/><path d="M8 12v-2a2 2 0 1 1 4 0v2"/></svg>
        </div>
      )}
      <div className={`p-3 rounded-xl max-w-lg shadow-md ${isModel ? 'bg-black/20 text-white/90' : 'bg-yellow-400 text-gray-900'}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export const AiAssistant: React.FC<{ weatherData: WeatherData | null }> = ({ weatherData }) => {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isAnswering]);

  useEffect(() => {
    if (weatherData) {
      const fetchInitialAdvice = async () => {
        setIsLoading(true);
        setConversation([]);
        const initialPrompt = createInitialPrompt(weatherData);
        const initialConversation: ConversationMessage[] = [{ role: 'user', text: initialPrompt }];
        const responseText = await getAiResponse(initialConversation);
        setConversation([...initialConversation, { role: 'model', text: responseText }]);
        setIsLoading(false);
      };
      fetchInitialAdvice();
    }
  }, [weatherData]);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim() || isAnswering || !weatherData) return;

    setIsAnswering(true);
    const newQuestion: ConversationMessage = { role: 'user', text: userQuestion };
    const updatedConversation = [...conversation, newQuestion];
    setConversation(updatedConversation);
    setUserQuestion('');

    const responseText = await getAiResponse(updatedConversation);
    setConversation([...updatedConversation, { role: 'model', text: responseText }]);
    setIsAnswering(false);
  };
  
  if (!weatherData) return null;

  return (
    <div className="bg-black/20 backdrop-blur-lg rounded-xl shadow-2xl border border-white/10 w-full max-w-4xl mx-auto mt-8 flex flex-col" style={{height: '70vh'}}>
      <h3 className="text-xl font-bold text-white p-4 border-b border-white/10 flex items-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-yellow-300"><path d="M12 8V4H8"/><rect x="4" y="12" width="8" height="8" rx="2"/><path d="M8 12v-2a2 2 0 1 1 4 0v2"/></svg>
        AI Daily Planner
      </h3>
      
      <div className="flex-grow p-4 overflow-y-auto">
        {isLoading && (
          <div className="space-y-3 animate-pulse p-4">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        )}

        {/* We slice(1) to hide the initial system prompt from the user UI */}
        {conversation.slice(1).map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        
        {isAnswering && (
           <div className="flex gap-3 my-4 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300"><path d="M12 8V4H8"/><rect x="4" y="12" width="8" height="8" rx="2"/><path d="M8 12v-2a2 2 0 1 1 4 0v2"/></svg>
              </div>
              <div className="p-4 rounded-xl max-w-lg bg-black/20 flex items-center">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse [animation-delay:-0.15s] mx-1"></div>
                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleQuestionSubmit} className="p-4 border-t border-white/10 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="Ask a follow-up question..."
          className="flex-grow w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          aria-label="Ask the AI a question"
          disabled={isAnswering || isLoading}
        />
        <button
          type="submit"
          disabled={isAnswering || isLoading || !userQuestion.trim()}
          className="bg-yellow-400 text-gray-900 font-bold p-2.5 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          aria-label="Send question"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  );
};
