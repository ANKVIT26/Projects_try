
export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: string;
  sunrise: string;
  sunset: string;
}

export interface HistoricalWeatherData {
  date: string;
  dayOfWeek: string;
  tempMax: number;
  tempMin: number;
  condition: string;
}
