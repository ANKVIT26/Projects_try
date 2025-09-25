
import React, { useState, useEffect } from 'react';
import { fetchWeatherHistory } from '../services/weatherService';
import type { HistoricalWeatherData } from '../types';
import { WeatherIcon } from './WeatherCard';

const HistoryDayCard: React.FC<{ data: HistoricalWeatherData }> = ({ data }) => (
    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg flex items-center justify-between transform hover:scale-105 transition-transform duration-300">
        <div>
            <p className="font-bold text-lg text-white">{data.dayOfWeek}</p>
            <p className="text-sm text-white/80">{data.date}</p>
        </div>
        <div className="flex items-center gap-4">
            <WeatherIcon condition={data.condition} className="w-10 h-10 text-yellow-300" />
            <div className="text-right">
                <p className="text-lg font-bold text-white" aria-label={`Maximum temperature: ${data.tempMax} degrees Celsius`}>{data.tempMax}°</p>
                <p className="text-sm text-white/80" aria-label={`Minimum temperature: ${data.tempMin} degrees Celsius`}>{data.tempMin}°</p>
            </div>
        </div>
    </div>
);

export const HistoryPage: React.FC<{ city: string }> = ({ city }) => {
    const [history, setHistory] = useState<HistoricalWeatherData[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            if (!city) return;
            setIsLoading(true);
            setError(null);
            setHistory(null);
            try {
                const data = await fetchWeatherHistory(city);
                setHistory(data);
            } catch (err) {
                setError('Could not fetch weather history.');
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, [city]);

    if (isLoading) {
        return (
            <div className="text-center text-white py-10">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300"></div>
                <p className="mt-2">Loading 14-day history...</p>
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-400">{error}</p>;
    }

    if (!history) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in" aria-labelledby="history-heading">
             <h3 id="history-heading" className="text-2xl font-bold text-white mb-4 text-center">14-Day History for {city}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map(day => (
                    <HistoryDayCard key={day.date} data={day} />
                ))}
            </div>
        </div>
    );
};
