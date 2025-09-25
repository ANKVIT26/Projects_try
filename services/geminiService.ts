import { GoogleGenAI, Content } from "@google/genai";
import type { WeatherData } from '../types';

const getApiKey = (): string => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return apiKey;
};

// This function now handles any conversational turn.
export const getAiResponse = async (
    conversationHistory: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
    if (!conversationHistory || conversationHistory.length === 0) {
        return "I need some context to start.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        // The system instruction defines the AI's persona and strict limitations.
        const systemInstruction = `You are a helpful and friendly AI weather assistant. Your knowledge is strictly limited to interpreting the provided weather data (given in the first user message) to help users plan their day. You can suggest clothing, recommend activities, and discuss surfing feasibility if applicable. If the user asks a question that is not related to weather, planning the day, or activities based on the weather, you must respond with the exact phrase: 'Sorry, I am just a weather Assistant powered by Google' and nothing else.`;

        const contents: Content[] = conversationHistory.map(message => ({
            role: message.role,
            parts: [{ text: message.text }]
        }));
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating advice from Gemini API:", error);
        return "I'm sorry, I'm having trouble providing advice right now. Please try again later.";
    }
};

// Helper function to create the initial prompt.
export const createInitialPrompt = (weatherData: WeatherData): string => {
    return `
        Based on the following weather data for ${weatherData.city}, provide a concise and actionable plan for the day. The advice should be easy to read, using short paragraphs or bullet points.

        Weather Data:
        - Temperature: ${weatherData.temperature}°C
        - Feels Like: ${weatherData.feelsLike}°C
        - Condition: ${weatherData.condition}
        - Humidity: ${weatherData.humidity}%
        - Wind Speed: ${weatherData.windSpeed} km/h
        - Pressure: ${weatherData.pressure} hPa
        - Visibility: ${weatherData.visibility} km
        - Sunrise: ${weatherData.sunrise}
        - Sunset: ${weatherData.sunset}
        - UV Index: ${weatherData.uvIndex}

        Your response should:
        1. Give a general summary of the day's weather.
        2. Suggest appropriate clothing.
        3. Recommend a couple of suitable outdoor or indoor activities.
        4. If the city is known to be coastal (like Honolulu, Sydney, Miami, etc.) or the weather suggests a beach day, provide specific advice on the feasibility and safety of surfing today. Consider the wind speed and general weather conditions. For example, high winds (${">"}25 km/h) might be for experts only or unsafe. Calm, sunny weather might be good for beginners. If the city is landlocked (like Denver, Paris, etc.), ignore this point.
    `;
};
