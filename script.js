/* ============================================
   WEATHER DASHBOARD - ADVANCED JAVASCRIPT
   ============================================ */

const apiKey = "4ae642197e3594010ce00db1b7ff8402";
let currentWeatherData = null;
let sunriseTime = null;
let sunsetTime = null;

/* ============================================
   INITIALIZATION
   ============================================ */

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeBackground();
    updateBackgroundLoop();
    getLocationWeather();
});

// Initialize theme from localStorage
function initializeTheme() {
    const darkModePreference = localStorage.getItem("darkMode");
    if (darkModePreference === "true") {
        document.body.classList.add("dark", "night-mode");
    } else {
        applyAdaptiveTheme();
    }
}

/* ============================================
   WEATHER FETCHING FUNCTIONS
   ============================================ */

// Get weather by city name
function getWeather() {
    const city = document.getElementById("city").value.trim();
    if (!city) {
        showError("Please enter a city name");
        return;
    }
    showLoader(true);
    clearError();

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then(res => {
            if (!res.ok) throw new Error("City not found");
            return res.json();
        })
        .then(data => {
            currentWeatherData = data;
            updateUI(data);
            setWeatherIcon(data.weather[0].main);
            getForecast(data.coord.lat, data.coord.lon);
            getSunriseSunset(data.coord.lat, data.coord.lon);
            updateDynamicBackground();
            document.getElementById("current-weather").classList.remove("hidden");
        })
        .catch(err => {
            showError(err.message);
            document.getElementById("current-weather").classList.add("hidden");
            document.getElementById("forecast-section").classList.add("hidden");
        })
        .finally(() => showLoader(false));
}

// Get weather by geolocation
function getLocationWeather() {
    if (!navigator.geolocation) {
        showError("Geolocation not supported in your browser");
        return;
    }

    showLoader(true);
    clearError();

    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude, longitude } = pos.coords;

            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`)
                .then(res => res.json())
                .then(data => {
                    currentWeatherData = data;
                    updateUI(data);
                    setWeatherIcon(data.weather[0].main);
                    getForecast(latitude, longitude);
                    getSunriseSunset(latitude, longitude);
                    updateDynamicBackground();
                    document.getElementById("city").value = data.name;
                    document.getElementById("current-weather").classList.remove("hidden");
                })
                .catch(err => showError("Unable to fetch weather data"))
                .finally(() => showLoader(false));
        },
        error => {
            showError("Unable to access your location. Please enable geolocation.");
            showLoader(false);
        }
    );
}

// Get sunrise and sunset times
function getSunriseSunset(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            sunriseTime = new Date(data.sys.sunrise * 1000);
            sunsetTime = new Date(data.sys.sunset * 1000);
            
            // Update UI with sunrise/sunset times
            const sunriseStr = sunriseTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            const sunsetStr = sunsetTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            
            document.getElementById("sunrise").textContent = sunriseStr;
            document.getElementById("sunset").textContent = sunsetStr;
            
            // Update theme based on sunrise/sunset
            applyAdaptiveTheme();
        });
}

/* ============================================
   UI UPDATE FUNCTIONS
   ============================================ */

// Update weather UI with data
function updateUI(data) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    // Update location and date/time
    document.getElementById("location").textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("date-time").textContent = `${dateStr} • ${timeStr}`;
    
    // Update temperature with animation
    animateValue("temp", parseInt(document.getElementById("temp").textContent) || 0, Math.round(data.main.temp), 500);
    
    // Update weather condition
    document.getElementById("condition").textContent = data.weather[0].main;
    
    // Update weather details
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("wind").textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;
    document.getElementById("visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById("feels-like").textContent = `${Math.round(data.main.feels_like)}°C`;
    
    // Calculate and display dew point
    const dewPoint = calculateDewPoint(data.main.temp, data.main.humidity);
    document.getElementById("dew-point").textContent = `${dewPoint}°C`;
}

// Animate counter for temperature
function animateValue(id, startValue, endValue, duration) {
    const element = document.getElementById(id);
    const range = endValue - startValue;
    const increment = range / (duration / 16); // 60fps
    let currentValue = startValue;

    const timer = setInterval(() => {
        currentValue += increment;
        if ((increment > 0 && currentValue >= endValue) || (increment < 0 && currentValue <= endValue)) {
            currentValue = endValue;
            clearInterval(timer);
        }
        element.textContent = Math.round(currentValue);
    }, 16);
}

// Calculate dew point using Magnus formula
function calculateDewPoint(temp, humidity) {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    return Math.round(dewPoint);
}

/* ============================================
   WEATHER ICON & CONDITIONS
   ============================================ */

// Set weather icon based on condition
function setWeatherIcon(condition) {
    const icon = document.getElementById("weatherIcon");
    condition = condition.toLowerCase();

    const iconMap = {
        "clear": "wi wi-day-sunny",
        "sunny": "wi wi-day-sunny",
        "cloud": "wi wi-cloudy",
        "rain": "wi wi-rain",
        "drizzle": "wi wi-sprinkle",
        "snow": "wi wi-snow",
        "thunder": "wi wi-thunderstorm",
        "storm": "wi wi-thunderstorm",
        "mist": "wi wi-fog",
        "fog": "wi wi-fog",
        "smoke": "wi wi-smoke",
        "haze": "wi wi-day-haze",
        "wind": "wi wi-strong-wind"
    };

    let selectedIcon = "wi wi-day-cloudy";
    for (const [key, value] of Object.entries(iconMap)) {
        if (condition.includes(key)) {
            selectedIcon = value;
            break;
        }
    }

    icon.className = selectedIcon;
}

// Get icon class for forecast
function getWeatherIconClass(condition) {
    return setWeatherIcon(condition) || "wi-day-cloudy";
}

/* ============================================
   FORECAST FUNCTIONS
   ============================================ */

// Get 5-day forecast
function getForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            renderForecast(data.list);
        })
        .catch(err => console.error("Forecast error:", err));
}

// Render forecast cards
function renderForecast(forecastList) {
    const dailyForecasts = {};

    // Group forecast data by day
    forecastList.forEach(item => {
        const date = new Date(item.dt_txt).toLocaleDateString("en-US");
        const hour = new Date(item.dt_txt).getHours();

        // Use 12:00 forecast for each day, or first available
        if (hour === 12 || !dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });

    let html = "";
    const days = Object.values(dailyForecasts).slice(0, 5);

    days.forEach((day, index) => {
        const date = new Date(day.dt_txt);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
        const tempMax = Math.round(day.main.temp_max);
        const tempMin = Math.round(day.main.temp_min);
        const condition = day.weather[0].main;
        const iconClass = getWeatherIconClass(condition);

        html += `
            <article class="forecast-card" style="animation-delay: ${index * 0.1}s;">
                <div class="forecast-date">${dayStr}, ${dateStr}</div>
                <i class="wi ${iconClass}" aria-hidden="true"></i>
                <div class="forecast-temps">
                    <span class="temp-max">${tempMax}°</span>
                    <span class="temp-min">${tempMin}°</span>
                </div>
                <div class="forecast-condition">${condition}</div>
            </article>
        `;
    });

    document.getElementById("forecast").innerHTML = html;
    document.getElementById("forecast-section").classList.remove("hidden");
}

/* ============================================
   DYNAMIC BACKGROUND SYSTEM
   ============================================ */

// Initialize canvas
function initializeBackground() {
    const canvas = document.getElementById("skyCanvas");
    if (canvas && !canvas.resized) {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        canvas.resized = true;
    }
}

// Resize canvas to fill window
function resizeCanvas() {
    const canvas = document.getElementById("skyCanvas");
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

/* ============================================
   MOON PHASE CALCULATIONS
   ============================================ */

// Calculate moon phase
function getMoonPhase(date = new Date()) {
    const knownNewMoon = new Date(2000, 0, 6);
    const lunarCycle = 29.53;
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
    return phase;
}

// Check if it's night time
function isNight(now = new Date()) {
    if (!sunriseTime || !sunsetTime) {
        return now.getHours() < 6 || now.getHours() >= 18;
    }
    return now < sunriseTime || now > sunsetTime;
}

/* ============================================
   CANVAS DRAWING FUNCTIONS
   ============================================ */

// Draw dynamic background based on weather
function drawDynamicBackground() {
    const canvas = document.getElementById("skyCanvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const now = new Date();
    const night = isNight(now);
    const weatherCondition = currentWeatherData?.weather[0].main.toLowerCase() || "clear";
    
    // Clear canvas with base color
    ctx.fillStyle = night ? "#0a1428" : "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (night) {
        drawNightSky(ctx, canvas);
    } else {
        drawDaySky(ctx, canvas);
    }
    
    // Draw weather-specific effects
    if (weatherCondition.includes("cloud")) {
        drawClouds(ctx, canvas, night);
    }
    if (weatherCondition.includes("rain")) {
        drawRain(ctx, canvas);
    }
    if (weatherCondition.includes("snow")) {
        drawSnow(ctx, canvas);
    }
}

// Draw day sky with gradient
function drawDaySky(ctx, canvas) {
    const now = new Date();
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate and draw sun
    const sunX = canvas.width * 0.5;
    const sunY = canvas.height * 0.8 - (Math.sin((now.getHours() - 6) / 12 * Math.PI) * canvas.height * 0.4);
    
    ctx.fillStyle = "rgba(255, 200, 0, 0.9)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun glow effect
    ctx.fillStyle = "rgba(255, 200, 0, 0.1)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
    ctx.fill();
}

// Draw night sky with stars and moon
function drawNightSky(ctx, canvas) {
    const now = new Date();
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    gradient.addColorStop(0, "#001a4d");
    gradient.addColorStop(1, "#0a1428");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars(ctx, canvas);
    
    // Draw moon with phase
    const moonPhase = getMoonPhase(now);
    const moonX = canvas.width * 0.85;
    const moonY = canvas.height * 0.2;
    drawMoon(ctx, moonX, moonY, moonPhase);
}

// Draw stars with twinkling effect
function drawStars(ctx, canvas) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    
    // Static stars
    for (let i = 0; i < 200; i++) {
        const seed = i * 12321 + 12345;
        const x = (seed * 73856093 ^ (seed >> 16)) % canvas.width;
        const y = (seed * 19349663 ^ (seed >> 16)) % (canvas.height * 0.7);
        const size = ((seed * 83492791) % 3) * 0.5 + 0.5;
        
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Twinkling stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 50; i++) {
        const seed = i * 54321 + 98765;
        const x = (seed * 73856093) % canvas.width;
        const y = (seed * 19349663) % (canvas.height * 0.7);
        const twinkle = (Math.sin(Date.now() * 0.003 + i) + 1) / 2 * 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw moon with phase variations
function drawMoon(ctx, x, y, phase) {
    const radius = 50;
    
    // Full moon circle
    ctx.fillStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon shadow for phase display
    if (phase > 0.25 && phase < 0.75) {
        const shadowX = phase < 0.5 ? x + (0.5 - phase) * 4 * radius : x - (phase - 0.5) * 4 * radius;
        ctx.fillStyle = "#001a4d";
        ctx.beginPath();
        ctx.arc(shadowX, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Moon glow
    ctx.strokeStyle = "rgba(240, 240, 240, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw animated clouds
function drawClouds(ctx, canvas, night) {
    ctx.fillStyle = night ? "rgba(100, 100, 120, 0.6)" : "rgba(255, 255, 255, 0.7)";
    
    for (let i = 0; i < 5; i++) {
        const x = (i * 300 + Date.now() * 0.01) % (canvas.width + 200) - 100;
        const y = 100 + i * 80;
        drawCloud(ctx, x, y, 60);
    }
}

// Draw cloud shape
function drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.9, 0, Math.PI * 2);
    ctx.arc(x + size * 1.6, y, size, 0, Math.PI * 2);
    ctx.fill();
}

// Draw rain drops
function drawRain(ctx, canvas) {
    ctx.strokeStyle = "rgba(200, 210, 220, 0.6)";
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 100; i++) {
        const seed = i * 11111;
        const x = (seed + Date.now() * 0.2) % canvas.width;
        const y = ((seed * 2 + Date.now() * 0.3) % canvas.height);
        const length = 15;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + length);
        ctx.stroke();
    }
}

// Draw snow flakes
function drawSnow(ctx, canvas) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    
    for (let i = 0; i < 100; i++) {
        const seed = i * 22222;
        const x = (seed + Date.now() * 0.05) % canvas.width;
        const y = ((seed * 3 + Date.now() * 0.08) % canvas.height);
        const size = ((seed % 30) / 10 + 1);
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/* ============================================
   THEME SYSTEM
   ============================================ */

// Update dynamic background and theme
function updateDynamicBackground() {
    drawDynamicBackground();
    applyAdaptiveTheme();
}

// Calculate brightness based on weather
function calculateBrightness() {
    const now = new Date();
    const weatherCondition = currentWeatherData?.weather[0].main.toLowerCase() || "clear";
    const isDay = !isNight(now);
    
    let brightness = isDay ? 0.8 : 0.2;
    
    if (weatherCondition.includes("clear") || weatherCondition.includes("sunny")) {
        brightness += isDay ? 0.15 : 0.05;
    } else if (weatherCondition.includes("cloud")) {
        brightness += isDay ? 0.05 : 0;
        brightness -= 0.1;
    } else if (weatherCondition.includes("rain") || weatherCondition.includes("storm")) {
        brightness -= 0.15;
    } else if (weatherCondition.includes("snow") || weatherCondition.includes("fog")) {
        brightness += isDay ? 0.1 : 0;
    }
    
    return Math.max(0.1, Math.min(0.95, brightness));
}

// Determine if it's day mode
function isDayMode() {
    const now = new Date();
    const brightness = calculateBrightness();
    
    if (sunriseTime && sunsetTime) {
        const isDay = now >= sunriseTime && now < sunsetTime;
        return isDay && brightness > 0.5;
    }
    
    const hour = now.getHours();
    return (hour >= 6 && hour < 18) && brightness > 0.5;
}

// Apply adaptive theme based on time and weather
function applyAdaptiveTheme() {
    const body = document.body;
    const isDayTheme = isDayMode();
    
    // Remove theme classes
    body.classList.remove("day-mode", "night-mode", "dark");
    
    // Check for manual dark mode
    const hasManualDarkMode = localStorage.getItem("darkMode") === "true";
    
    if (hasManualDarkMode) {
        body.classList.add("dark", "night-mode");
    } else if (isDayTheme) {
        body.classList.add("day-mode");
    } else {
        body.classList.add("night-mode");
    }
}

// Toggle dark mode manually
function toggleDark() {
    const isDark = document.body.classList.contains("dark");
    const body = document.body;
    
    body.classList.remove("day-mode", "night-mode", "dark");
    
    if (!isDark) {
        // Enable dark mode
        body.classList.add("dark", "night-mode");
        localStorage.setItem("darkMode", "true");
    } else {
        // Disable dark mode and use automatic
        localStorage.setItem("darkMode", "false");
        applyAdaptiveTheme();
    }
}

// Animation loop for background
function updateBackgroundLoop() {
    updateDynamicBackground();
    requestAnimationFrame(updateBackgroundLoop);
}

/* ============================================
   UI HELPER FUNCTIONS
   ============================================ */

// Show/hide loader
function showLoader(show) {
    const loader = document.getElementById("loader");
    if (show) {
        loader.classList.remove("hidden");
    } else {
        loader.classList.add("hidden");
    }
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById("error");
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
}

// Clear error message
function clearError() {
    document.getElementById("error").classList.add("hidden");
}

/* ============================================
   EVENT LISTENERS
   ============================================ */

// Allow Enter key to search
document.getElementById("city").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        getWeather();
    }
});
