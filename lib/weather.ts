// OpenWeatherMap API 클라이언트
// 무료 티어: 1000 calls/day
// API Key 발급: https://openweathermap.org/api

const API_KEY = "65f2ac4c5beace080ce66756dfe257e9";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// 한국 주요 도시 좌표 (구장 위치 매핑용)
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  서울: { lat: 37.5665, lon: 126.978 },
  강남: { lat: 37.4979, lon: 127.0276 },
  잠실: { lat: 37.5133, lon: 127.1001 },
  마포: { lat: 37.5572, lon: 126.9236 },
  송파: { lat: 37.5048, lon: 127.1144 },
  영등포: { lat: 37.5264, lon: 126.8964 },
  인천: { lat: 37.4563, lon: 126.7052 },
  수원: { lat: 37.2636, lon: 127.0286 },
  성남: { lat: 37.4207, lon: 127.1265 },
  부산: { lat: 35.1796, lon: 129.0756 },
  대구: { lat: 35.8714, lon: 128.6014 },
  대전: { lat: 36.3504, lon: 127.3845 },
  광주: { lat: 35.1595, lon: 126.8526 },
};

// 날씨 아이콘 매핑
const WEATHER_ICONS: Record<string, string> = {
  "01d": "☀️", "01n": "🌙",
  "02d": "⛅", "02n": "☁️",
  "03d": "☁️", "03n": "☁️",
  "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️",
  "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️",
  "13d": "🌨️", "13n": "🌨️",
  "50d": "🌫️", "50n": "🌫️",
};

export interface WeatherForecast {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  emoji: string;
  pop: number; // 강수확률 0~1
  isRainy: boolean;
  humidity: number;
  windSpeed: number;
}

/** location 텍스트에서 좌표 추출 */
function getCoords(location: string): { lat: number; lon: number } | null {
  for (const [keyword, coords] of Object.entries(CITY_COORDS)) {
    if (location.includes(keyword)) return coords;
  }
  // 기본값: 서울
  return CITY_COORDS["서울"];
}

/** 특정 날짜+시간의 날씨 예보 조회 */
export async function getWeatherForSchedule(
  location: string,
  date: string,
  time: string,
): Promise<WeatherForecast | null> {
  if (!API_KEY) return null;

  const coords = getCoords(location);
  if (!coords) return null;

  try {
    const res = await fetch(
      `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=kr`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const targetTime = new Date(`${date}T${time}:00`).getTime();

    // 가장 가까운 예보 시간 찾기
    let closest = data.list?.[0];
    let minDiff = Infinity;
    for (const item of data.list || []) {
      const diff = Math.abs(new Date(item.dt_txt).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }

    if (!closest) return null;

    const iconCode = closest.weather?.[0]?.icon || "01d";
    const mainWeather = closest.weather?.[0]?.main || "";
    const isRainy = ["Rain", "Drizzle", "Thunderstorm"].includes(mainWeather);

    return {
      temp: Math.round(closest.main?.temp || 0),
      feelsLike: Math.round(closest.main?.feels_like || 0),
      description: closest.weather?.[0]?.description || "",
      icon: iconCode,
      emoji: WEATHER_ICONS[iconCode] || "🌤️",
      pop: closest.pop || 0,
      isRainy,
      humidity: closest.main?.humidity || 0,
      windSpeed: Math.round((closest.wind?.speed || 0) * 10) / 10,
    };
  } catch (e) {
    console.error("Weather API error:", e);
    return null;
  }
}

/** 지도 앱 URL 생성 */
export function getMapUrl(location: string): string {
  const encoded = encodeURIComponent(location);
  // 카카오맵 검색 URL (모바일에서 앱이 있으면 앱으로, 없으면 웹으로)
  return `https://map.kakao.com/?q=${encoded}`;
}

/** 네이버 지도 네비게이션 URL */
export function getNaverMapUrl(location: string): string {
  const encoded = encodeURIComponent(location);
  return `nmap://search?query=${encoded}&appname=com.yrnoh.futsalapp`;
}

/** 구글 지도 URL */
export function getGoogleMapUrl(location: string): string {
  const encoded = encodeURIComponent(location);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}
