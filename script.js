const apiKey = "4ae642197e3594010ce00db1b7ff8402";
let currentWeatherData = null;
let sunriseTime = null;
let sunsetTime = null;

// Auto-detect location on page load
document.addEventListener("DOMContentLoaded", () => {
    showLoader(true);
    getLocationWeather();
    initializeBackground();
    updateBackgroundLoop();
});

/* 🌍 Get Weather by City */
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
        })
        .catch(err => {
            showError(err.message);
            document.getElementById("current-weather").classList.add("hidden");
            document.getElementById("forecast-section").classList.add("hidden");
        })
        .finally(() => showLoader(false));
}

/* 📍 Get Weather by Location */
function getLocationWeather() {
    if (!navigator.geolocation) {
        showError("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude, longitude } = pos.coords;
            showLoader(true);
            clearError();

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
                })
                .catch(err => showError("Unable to fetch weather"))
                .finally(() => showLoader(false));
        },
        error => {
            showError("Unable to access location. Please enable geolocation.");
            showLoader(false);
        }
    );
}

/* 🌅 Get Sunrise and Sunset Times */
function getSunriseSunset(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            sunriseTime = new Date(data.sys.sunrise * 1000);
            sunsetTime = new Date(data.sys.sunset * 1000);
        });
}

/* 🔄 Update Current Weather UI */
function updateUI(data) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    document.getElementById("location").textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("date-time").textContent = `${dateStr} • ${timeStr}`;
    document.getElementById("temp").textContent = Math.round(data.main.temp);
    document.getElementById("condition").textContent = data.weather[0].main;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("wind").textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;
    document.getElementById("visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById("feels-like").textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById("uv-index").textContent = "N/A";

    document.getElementById("current-weather").classList.remove("hidden");
}

/* 🎨 Set Weather Icon */
function setWeatherIcon(condition) {
    const icon = document.getElementById("weatherIcon");
    condition = condition.toLowerCase();

    if (condition.includes("clear") || condition.includes("sunny")) icon.className = "wi wi-day-sunny";
    else if (condition.includes("cloud")) icon.className = "wi wi-cloudy";
    else if (condition.includes("rain")) icon.className = "wi wi-rain";
    else if (condition.includes("snow")) icon.className = "wi wi-snow";
    else if (condition.includes("thunder") || condition.includes("storm")) icon.className = "wi wi-thunderstorm";
    else if (condition.includes("mist") || condition.includes("fog")) icon.className = "wi wi-fog";
    else icon.className = "wi wi-day-cloudy";
}

/* 📅 Get 5-Day Forecast */
function getForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            renderForecast(data.list);
        })
        .catch(err => console.error("Forecast error:", err));
}

/* 🎨 Render 5-Day Forecast */
function renderForecast(forecastList) {
    const dailyForecasts = {};

    forecastList.forEach(item => {
        const date = new Date(item.dt_txt).toLocaleDateString("en-US");
        const hour = new Date(item.dt_txt).getHours();

        if (hour === 12 || !dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });

    let html = "";
    const days = Object.values(dailyForecasts).slice(0, 5);

    days.forEach(day => {
        const date = new Date(day.dt_txt);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
        const tempMax = Math.round(day.main.temp_max);
        const tempMin = Math.round(day.main.temp_min);
        const condition = day.weather[0].main;
        const iconClass = getWeatherIconClass(condition);

        html += `
            <div class="forecast-card">
                <div class="forecast-date">${dayStr}, ${dateStr}</div>
                <i class="wi ${iconClass}" style="font-size: 40px;"></i>
                <div class="forecast-temps">
                    <span class="temp-max">${tempMax}°</span>
                    <span class="temp-min">${tempMin}°</span>
                </div>
                <div class="forecast-condition">${condition}</div>
            </div>
        `;
    });

    document.getElementById("forecast").innerHTML = html;
    document.getElementById("forecast-section").classList.remove("hidden");
}

/* 🎨 Get Weather Icon Class */
function getWeatherIconClass(condition) {
    condition = condition.toLowerCase();
    if (condition.includes("clear") || condition.includes("sunny")) return "wi-day-sunny";
    if (condition.includes("cloud")) return "wi-cloudy";
    if (condition.includes("rain")) return "wi-rain";
    if (condition.includes("snow")) return "wi-snow";
    if (condition.includes("thunder")) return "wi-thunderstorm";
    if (condition.includes("mist") || condition.includes("fog")) return "wi-fog";
    return "wi-day-cloudy";
}

/* =============== DYNAMIC BACKGROUND SYSTEM =============== */

function initializeBackground() {
    const canvas = document.getElementById("skyCanvas");
    if (canvas && !canvas.resized) {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        canvas.resized = true;
    }
}

function resizeCanvas() {
    const canvas = document.getElementById("skyCanvas");
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

/* 🌙 Calculate Moon Phase */
function getMoonPhase(date = new Date()) {
    const knownNewMoon = new Date(2000, 0, 6);
    const lunarCycle = 29.53;
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
    return phase;
}

/* 🕐 Check if it's Night */
function isNight(now = new Date()) {
    if (!sunriseTime || !sunsetTime) return now.getHours() < 6 || now.getHours() >= 18;
    return now < sunriseTime || now > sunsetTime;
}

/* 🎨 Draw Dynamic Background */
function drawDynamicBackground() {
    const canvas = document.getElementById("skyCanvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const now = new Date();
    const night = isNight(now);
    
    // Get weather condition
    const weatherCondition = currentWeatherData?.weather[0].main.toLowerCase() || "clear";
    
    // Clear canvas
    ctx.fillStyle = night ? "#0a1428" : "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (night) {
        drawNightSky(ctx, canvas);
    } else {
        drawDaySky(ctx, canvas);
    }
    
    // Draw weather effects
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

/* ☀️ Draw Day Sky */
function drawDaySky(ctx, canvas) {
    const now = new Date();
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate sun position based on time
    const sunX = canvas.width * 0.5;
    const sunY = canvas.height * 0.8 - (Math.sin((now.getHours() - 6) / 12 * Math.PI) * canvas.height * 0.4);
    
    // Draw sun
    ctx.fillStyle = "rgba(255, 200, 0, 0.9)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun glow
    ctx.fillStyle = "rgba(255, 200, 0, 0.1)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
    ctx.fill();
}

/* 🌙 Draw Night Sky */
function drawNightSky(ctx, canvas) {
    const now = new Date();
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    gradient.addColorStop(0, "#001a4d");
    gradient.addColorStop(1, "#0a1428");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars(ctx, canvas);
    
    // Draw moon
    const moonPhase = getMoonPhase(now);
    const moonX = canvas.width * 0.85;
    const moonY = canvas.height * 0.2;
    drawMoon(ctx, moonX, moonY, moonPhase);
}

/* ⭐ Draw Stars */
function drawStars(ctx, canvas) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    
    // Use a seed-based random for consistent star positions
    for (let i = 0; i < 200; i++) {
        const seed = i * 12321 + 12345;
        const x = (seed * 73856093 ^ (seed >> 16)) % canvas.width;
        const y = (seed * 19349663 ^ (seed >> 16)) % (canvas.height * 0.7);
        const size = ((seed * 83492791) % 3) * 0.5 + 0.5;
        
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add twinkling effect
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

/* 🌕 Draw Moon with Phases */
function drawMoon(ctx, x, y, phase) {
    const radius = 50;
    
    // Full moon circle
    ctx.fillStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon shadow for phases
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

/* ☁️ Draw Clouds */
function drawClouds(ctx, canvas, night) {
    ctx.fillStyle = night ? "rgba(100, 100, 120, 0.6)" : "rgba(255, 255, 255, 0.7)";
    
    for (let i = 0; i < 5; i++) {
        const x = (i * 300 + Date.now() * 0.01) % (canvas.width + 200) - 100;
        const y = 100 + i * 80;
        drawCloud(ctx, x, y, 60);
    }
}

function drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.9, 0, Math.PI * 2);
    ctx.arc(x + size * 1.6, y, size, 0, Math.PI * 2);
    ctx.fill();
}

/* 🌧️ Draw Rain */
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

/* ❄️ Draw Snow */
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

/* 🌓 Update Dynamic Background */
function updateDynamicBackground() {
    drawDynamicBackground();
    applyThemeBasedOnTime();
}

/* 🌓 Apply Theme Based on Time */
function applyThemeBasedOnTime() {
    const night = isNight();
    if (night && !document.body.classList.contains("dark")) {
        document.body.classList.add("dark");
    } else if (!night && document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
    }
}

/* 🔄 Update Background Loop */
function updateBackgroundLoop() {
    updateDynamicBackground();
    requestAnimationFrame(updateBackgroundLoop);
}

/* 🌓 Toggle Dark Mode */
function toggleDark() {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

// Load dark mode preference
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
}

/* 🔄 Loader */
function showLoader(show) {
    document.getElementById("loader").classList.toggle("hidden", !show);
}

/* ❌ Error Message */
function showError(message) {
    const errorEl = document.getElementById("error");
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
}

function clearError() {
    document.getElementById("error").classList.add("hidden");
}

/* ⌨️ Enter Key on Search */
document.getElementById("city").addEventListener("keypress", (e) => {
    if (e.key === "Enter") getWeather();
});
