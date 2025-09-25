
import React, { useState, useCallback, useEffect } from 'react';
import type { WeatherData } from './types';
import { fetchWeather } from './services/weatherService';
import { WeatherCard } from './components/WeatherCard';
import { AiAssistant } from './components/AiAssistant';
import { HistoryPage } from './components/HistoryPage';

type AppState = 'landing' | 'login' | 'dashboard';
type DashboardTab = 'current' | 'history';

const LandingPage: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <div className="flex flex-col items-center justify-center text-center text-white p-8">
    <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fade-in-down">AI Weather Planner</h1>
    <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl animate-fade-in-up">
      Get hyper-personalized weather forecasts and AI-powered advice to perfectly plan your day.
    </p>
    <button
      onClick={onSignIn}
      className="bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transform hover:scale-105 transition-all duration-300 shadow-lg animate-fade-in-up"
    >
      Get Started
    </button>
  </div>
);

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="bg-black/20 backdrop-blur-lg rounded-xl p-10 shadow-2xl border border-white/10 text-center text-white animate-fade-in">
    <h2 className="text-3xl font-bold mb-6">Sign In</h2>
    <p className="text-white/80 mb-8">Sign in to access your weather dashboard.</p>
    <button
      onClick={onLogin}
      className="w-full bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors duration-300"
    >
      <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h13.04c-.58 2.77-2.28 5.12-4.64 6.7l7.68 5.95c4.5-4.14 7.13-10.04 7.13-16.61z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.68-5.95c-2.18 1.45-4.94 2.3-8.21 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
      </svg>
      Sign in with Google
    </button>
  </div>
);

const DashboardPage: React.FC = () => {
  const [inputCity, setInputCity] = useState<string>('Honolulu');
  const [searchedCity, setSearchedCity] = useState<string>('Honolulu');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('current');

  const handleSearch = useCallback(async (searchCity: string) => {
    if (!searchCity) return;
    setIsLoading(true);
    setError(null);
    if (activeTab === 'current') {
      setWeatherData(null);
    }
    try {
      const data = await fetchWeather(searchCity);
      setWeatherData(data);
      setSearchedCity(searchCity);
    } catch (err) {
      setError('Could not fetch weather data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    handleSearch(searchedCity);
  }, [searchedCity, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputCity);
  };

  const TabButton: React.FC<{tab: DashboardTab, children: React.ReactNode}> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      role="tab"
      aria-selected={activeTab === tab}
      className={`py-2 px-6 rounded-full text-sm font-bold transition-colors duration-300 ${activeTab === tab ? 'bg-yellow-400 text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
    >
        {children}
    </button>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          placeholder="Search for a city..."
          className="flex-grow w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label="City search input"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      <div role="tablist" aria-label="Weather views" className="flex justify-center mb-8 gap-2">
        <TabButton tab="current">Current Weather</TabButton>
        <TabButton tab="history">14-Day History</TabButton>
      </div>

      {error && <p className="text-center text-red-400">{error}</p>}
      
      {isLoading && activeTab === 'current' && (
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300"></div>
          <p className="mt-2">Fetching weather data...</p>
        </div>
      )}

      {activeTab === 'current' && weatherData && !isLoading && (
        <div className="space-y-8">
          <WeatherCard data={weatherData} />
          <AiAssistant weatherData={weatherData} />
        </div>
      )}

      {activeTab === 'history' && <HistoryPage city={searchedCity} />}
    </div>
  );
};

function App() {
  const [appState, setAppState] = useState<AppState>('landing');

  const renderContent = () => {
    switch (appState) {
      case 'landing':
        return <LandingPage onSignIn={() => setAppState('login')} />;
      case 'login':
        return <LoginPage onLogin={() => setAppState('dashboard')} />;
      case 'dashboard':
        return <DashboardPage />;
      default:
        return <LandingPage onSignIn={() => setAppState('login')} />;
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-900 bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900 flex items-center justify-center p-4 selection:bg-yellow-400 selection:text-gray-900">
      <style>{`
        @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.3s forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
      {renderContent()}
    </main>
  );
}

export default App;
