import type { WeatherData, HistoricalWeatherData } from '../types';

// This is a mock weather service. In a real application, this would
// make a call to a real weather API like OpenWeatherMap.
const generateMockWeather = async (city: string): Promise<WeatherData> => {
  console.log(`Generating mock weather for ${city}...`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create a pseudo-random but deterministic set of data based on city name
  const citySeed = city.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const mockData: WeatherData = {
    city: city.charAt(0).toUpperCase() + city.slice(1),
    temperature: (citySeed % 35) - 5, // Temp between -5 and 30
    feelsLike: (citySeed % 35) - 5 + (citySeed % 5) - 2,
    humidity: 40 + (citySeed % 50),
    windSpeed: 5 + (citySeed % 25),
    pressure: 990 + (citySeed % 40),
    visibility: 5 + (citySeed % 15),
    uvIndex: 1 + (citySeed % 10),
    condition: ["Clear", "Partly cloudy", "Cloudy", "Rainy", "Thunderstorm", "Snowy"][(citySeed % 6)],
    sunrise: `0${(5 + citySeed % 3)}:${(10 + citySeed % 49)} AM`,
    sunset: `0${(6 + citySeed % 3)}:${(10 + citySeed % 49)} PM`,
  };

  return mockData;
};


// Maps WMO weather codes from Open-Meteo to simplified condition strings for the UI
const mapWmoCodeToCondition = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code === 1 || code === 2) return 'Partly cloudy';
    if (code === 3) return 'Cloudy'; // Overcast
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rainy';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Snowy';
    if (code >= 45 && code <= 48) return 'Cloudy'; // Fog
    return 'Cloudy'; // Default
};


// Fetches live weather data from Open-Meteo, with mock data as a fallback.
export const fetchWeather = async (city: string): Promise<WeatherData> => {
  console.log(`Fetching real-time weather for ${city} using Open-Meteo...`);
  try {
    // 1. Geocode city to get latitude and longitude
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!geoResponse.ok) {
        throw new Error('Failed to geocode city.');
    }
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`City "${city}" not found.`);
    }
    const { latitude, longitude, name: cityName } = geoData.results[0];

    // 2. Fetch weather data
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,weather_code,wind_speed_10m,visibility&daily=sunrise,sunset,uv_index_max&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather data.');
    }
    const weatherData = await weatherResponse.json();

    const current = weatherData.current;
    const daily = weatherData.daily;

    // Correctly formats time from an ISO string (e.g., "2024-05-25T05:30")
    // to a 12-hour AM/PM format, avoiding timezone issues from new Date().
    const formatTime = (isoString: string): string => {
        if (!isoString || !isoString.includes('T')) return 'N/A';
        try {
            const timePart = isoString.split('T')[1]; // "05:30"
            if (!timePart) return 'N/A';

            const [hours, minutes] = timePart.split(':');
            let h = parseInt(hours, 10);
            const m = parseInt(minutes, 10);

            if (isNaN(h) || isNaN(m)) return 'N/A';

            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12; // Hour '0' should be '12'
            
            const minutesStr = m < 10 ? '0' + m : m.toString();
            return `${h}:${minutesStr} ${ampm}`;
        } catch (error) {
            console.error("Failed to format time:", isoString, error);
            return 'N/A';
        }
    }
    
    const data: WeatherData = {
        city: cityName,
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        pressure: Math.round(current.pressure_msl),
        visibility: Math.round(current.visibility / 1000), // meters to km
        uvIndex: Math.round(daily.uv_index_max[0]),
        condition: mapWmoCodeToCondition(current.weather_code),
        sunrise: formatTime(daily.sunrise[0]),
        sunset: formatTime(daily.sunset[0]),
    };
    return data;
  } catch (error) {
      console.error("Error fetching live weather data from Open-Meteo, falling back to mock data:", error);
      return generateMockWeather(city);
  }
};


export const fetchWeatherHistory = async (city: string): Promise<HistoricalWeatherData[]> => {
    console.log(`Fetching weather history for ${city} using Open-Meteo...`);
    
    try {
        // 1. Geocode city
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        if (!geoResponse.ok) throw new Error('Failed to geocode city for history.');
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) throw new Error(`City "${city}" not found for history.`);
        const { latitude, longitude } = geoData.results[0];

        // 2. Get dates for the last 14 days
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(today.getDate() - 13); // 13 days ago to get 14 days total
        const startDateStr = startDate.toISOString().split('T')[0];

        // 3. Fetch historical data
        const historyUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDateStr}&end_date=${endDate}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const historyResponse = await fetch(historyUrl);
        if (!historyResponse.ok) throw new Error('Failed to fetch historical weather data.');
        const historyData = await historyResponse.json();
        
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const history: HistoricalWeatherData[] = historyData.daily.time.map((date: string, index: number) => {
            const d = new Date(date + 'T00:00:00Z'); // Use Z for UTC to get correct day
            return {
                date: date,
                dayOfWeek: daysOfWeek[d.getUTCDay()],
                tempMax: Math.round(historyData.daily.temperature_2m_max[index]),
                tempMin: Math.round(historyData.daily.temperature_2m_min[index]),
                condition: mapWmoCodeToCondition(historyData.daily.weather_code[index]),
            }
        });

        return history.reverse(); // Show most recent day first

    } catch (error) {
        console.error("Error fetching historical weather from Open-Meteo, falling back to mock data:", error);
        // Fallback to mock data for history
        const citySeed = city.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const history: HistoricalWeatherData[] = [];
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const conditions = ["Clear", "Partly cloudy", "Cloudy", "Rainy", "Thunderstorm", "Snowy"];

        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const daySeed = citySeed + i;
            
            history.push({
                date: date.toLocaleDateString('en-CA'), // YYYY-MM-DD
                dayOfWeek: daysOfWeek[date.getDay()],
                tempMax: (citySeed % 15) + 10 + (daySeed % 5) - 2,
                tempMin: (citySeed % 10) + (daySeed % 5) - 2,
                condition: conditions[daySeed % 6],
            });
        }
        return history;
    }
};