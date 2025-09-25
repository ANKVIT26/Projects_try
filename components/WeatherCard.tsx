
import React, { ReactNode } from 'react';
import type { WeatherData } from '../types';
import {
  SunriseIcon,
  SunsetIcon,
  ThermometerIcon,
  WindIcon,
  DropletsIcon,
  GaugeIcon,
  EyeIcon,
  SunIcon,
  CloudIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudLightningIcon,
} from '../constants';

const DataPoint: React.FC<{ icon: ReactNode; label: string; value: string | number; unit?: string }> = ({ icon, label, value, unit }) => (
  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300">
    <div className="text-yellow-300 mb-2">{icon}</div>
    <span className="text-xs text-white/80 font-light">{label}</span>
    <span className="text-lg font-bold text-white">
      {value}
      {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
    </span>
  </div>
);

export const WeatherIcon: React.FC<{ condition: string; className?: string }> = ({ condition, className }) => {
  const lowerCaseCondition = condition.toLowerCase();
  if (lowerCaseCondition.includes('clear') || lowerCaseCondition.includes('sunny')) return <SunIcon className={className} />;
  if (lowerCaseCondition.includes('partly cloudy')) return <CloudIcon className={className} />;
  if (lowerCaseCondition.includes('cloud')) return <CloudIcon className={className} />;
  if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('shower')) return <CloudRainIcon className={className} />;
  if (lowerCaseCondition.includes('snow') || lowerCaseCondition.includes('blizzard')) return <CloudSnowIcon className={className} />;
  if (lowerCaseCondition.includes('thunder') || lowerCaseCondition.includes('storm')) return <CloudLightningIcon className={className} />;
  return <CloudIcon className={className} />;
};

export const WeatherCard: React.FC<{ data: WeatherData }> = ({ data }) => {
  return (
    <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/10 w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h2 className="text-4xl font-bold text-white">{data.city}</h2>
          <p className="text-white/80 text-lg">{data.condition}</p>
        </div>
        <div className="flex items-center text-white">
          <WeatherIcon condition={data.condition} className="w-20 h-20 text-yellow-300" />
          <span className="text-7xl font-bold ml-4">{data.temperature}°</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <DataPoint icon={<ThermometerIcon />} label="Feels Like" value={data.feelsLike} unit="°C" />
        <DataPoint icon={<DropletsIcon />} label="Humidity" value={data.humidity} unit="%" />
        <DataPoint icon={<WindIcon />} label="Wind Speed" value={data.windSpeed} unit="km/h" />
        <DataPoint icon={<SunriseIcon />} label="Sunrise" value={data.sunrise} />
        <DataPoint icon={<SunsetIcon />} label="Sunset" value={data.sunset} />
        <DataPoint icon={<GaugeIcon />} label="Pressure" value={data.pressure} unit="hPa" />
        <DataPoint icon={<EyeIcon />} label="Visibility" value={data.visibility} unit="km" />
        <DataPoint icon={<SunIcon />} label="UV Index" value={data.uvIndex} />
      </div>
    </div>
  );
};
