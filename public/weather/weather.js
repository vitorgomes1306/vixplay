class WeatherApp {
    constructor() {
        this.apiKey = '7123b26ed3e262ded9c628acc48106d2';
        this.apiUrl = 'https://api.openweathermap.org/data/2.5';
        this.deviceKey = this.getDeviceKeyFromUrl();
        
        this.initializeElements();
        this.bindEvents();
        this.updateTime();
        
        if (this.deviceKey) {
            this.loadWeatherDataFromDevice(this.deviceKey);
        } else {
            this.loadWeatherData('Fortaleza,BR');
        }
        
        // Atualizar horário a cada minuto
        setInterval(() => this.updateTime(), 60000);
    }

    initializeElements() {
        this.elements = {
            currentTime: document.getElementById('currentTime'),
            weatherIcon: document.getElementById('weather-icon'),
            temperature: document.getElementById('temperature'),
            weatherDescription: document.getElementById('weatherDescription'),
            feelsLike: document.getElementById('feelsLike'),
            lastUpdate: document.getElementById('lastUpdate'),
            windSpeed: document.getElementById('windSpeed'),
            humidity: document.getElementById('humidity'),
            airQuality: document.getElementById('airQuality'),
            cityName: document.getElementById('cityName')
        };
    }

    bindEvents() {
        // Eventos removidos - página mostra apenas clima do dispositivo
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        this.elements.currentTime.textContent = timeString;
    }

    async loadWeatherData(city) {
        try {
            this.setLoadingState(true);
            
            // Buscar dados climáticos atuais
            const weatherResponse = await fetch(
                `${this.apiUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric&lang=pt_br`
            );
            
            if (!weatherResponse.ok) {
                throw new Error('Cidade não encontrada');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Buscar dados de qualidade do ar
            const airQualityResponse = await fetch(
                `${this.apiUrl}/air_pollution?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${this.apiKey}`
            );
            
            let airQualityData = null;
            if (airQualityResponse.ok) {
                airQualityData = await airQualityResponse.json();
            }
            
            this.updateWeatherDisplay(weatherData, airQualityData);
            this.setLoadingState(false);
            
        } catch (error) {
            console.error('Erro ao carregar dados do clima:', error);
            this.showError(error.message);
            this.setLoadingState(false);
        }
    }

    updateWeatherDisplay(weatherData, airQualityData, deviceName = null) {
        // Atualizar apenas a cidade
        this.elements.cityName.textContent = weatherData.name;
        
        // Atualizar temperatura
        this.elements.temperature.textContent = Math.round(weatherData.main.temp);
        
        // Atualizar descrição do clima
        this.elements.weatherDescription.textContent = this.capitalizeFirst(weatherData.weather[0].description);
        
        // Atualizar sensação térmica
        this.elements.feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
        
        // Atualizar ícone do clima
        this.updateWeatherIcon(weatherData.weather[0].main, weatherData.weather[0].icon);
        
        // Atualizar última atualização
        const lastUpdate = new Date();
        this.elements.lastUpdate.textContent = lastUpdate.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', ' ÀS');
        
        // Atualizar vento
        const windSpeedKmh = (weatherData.wind.speed * 3.6).toFixed(2);
        this.elements.windSpeed.textContent = `${windSpeedKmh}km/h`;
        
        // Atualizar umidade
        this.elements.humidity.textContent = `${weatherData.main.humidity}%`;
        
        // Atualizar qualidade do ar
        if (airQualityData && airQualityData.list && airQualityData.list[0]) {
            const aqi = airQualityData.list[0].main.aqi;
            this.elements.airQuality.textContent = this.getAirQualityText(aqi);
        } else {
            this.elements.airQuality.textContent = 'N/A';
        }
    }

    updateWeatherIcon(weatherMain, iconCode) {
        const iconMap = {
            'Clear': 'sun',
            'Clouds': 'cloud',
            'Rain': 'cloud-rain',
            'Drizzle': 'cloud-drizzle',
            'Thunderstorm': 'zap',
            'Snow': 'cloud-snow',
            'Mist': 'cloud',
            'Smoke': 'cloud',
            'Haze': 'cloud',
            'Dust': 'cloud',
            'Fog': 'cloud',
            'Sand': 'cloud',
            'Ash': 'cloud',
            'Squall': 'wind',
            'Tornado': 'wind'
        };
        
        const colorMap = {
            'Clear': '#FFD700',
            'Clouds': '#87CEEB',
            'Rain': '#4682B4',
            'Drizzle': '#6495ED',
            'Thunderstorm': '#9370DB',
            'Snow': '#F0F8FF',
            'Mist': '#B0C4DE',
            'Smoke': '#696969',
            'Haze': '#D3D3D3',
            'Dust': '#DEB887',
            'Fog': '#C0C0C0',
            'Sand': '#F4A460',
            'Ash': '#A9A9A9',
            'Squall': '#00CED1',
            'Tornado': '#8B0000'
        };
        
        const iconName = iconMap[weatherMain] || 'cloud';
        const iconColor = colorMap[weatherMain] || '#FFD700';
        
        this.elements.weatherIcon.setAttribute('data-feather', iconName);
        this.elements.weatherIcon.style.color = iconColor;
        this.elements.weatherIcon.style.stroke = iconColor;
        
        // Atualizar o ícone Feather
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    getAirQualityText(aqi) {
        const qualityMap = {
            1: 'Boa',
            2: 'Razoável',
            3: 'Moderada',
            4: 'Ruim',
            5: 'Muito Ruim'
        };
        return qualityMap[aqi] || 'N/A';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getDeviceKeyFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('deviceKey');
    }

    async loadWeatherDataFromDevice(deviceKey) {
        try {
            this.setLoadingState(true);
            
            // Buscar coordenadas do dispositivo
            const deviceResponse = await fetch(`/public/weather/${deviceKey}`);
            
            if (!deviceResponse.ok) {
                throw new Error('Dispositivo não encontrado ou sem coordenadas');
            }
            
            const deviceData = await deviceResponse.json();
            const { latitude, longitude } = deviceData.device.coordinates;
            
            // Buscar dados climáticos usando coordenadas
            const weatherResponse = await fetch(
                `${this.apiUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric&lang=pt_br`
            );
            
            if (!weatherResponse.ok) {
                throw new Error('Erro ao buscar dados climáticos');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Buscar dados de qualidade do ar
            const airQualityResponse = await fetch(
                `${this.apiUrl}/air_pollution?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}`
            );
            
            let airQualityData = null;
            if (airQualityResponse.ok) {
                airQualityData = await airQualityResponse.json();
            }
            
            this.updateWeatherDisplay(weatherData, airQualityData, deviceData.device.name);
            this.setLoadingState(false);
            
        } catch (error) {
            console.error('Erro ao carregar dados do clima do dispositivo:', error);
            this.showError(error.message);
            this.setLoadingState(false);
            // Fallback para cidade padrão
            this.loadWeatherData('Itaguaí,BR');
        }
    }



    setLoadingState(isLoading) {
        const weatherCard = document.querySelector('.weather-card');
        if (isLoading) {
            weatherCard.classList.add('loading');
        } else {
            weatherCard.classList.remove('loading');
        }
    }

    showError(message) {
        // Criar notificação de erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = `Erro: ${message}`;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remover após 3 segundos
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 3000);
    }
}

// Adicionar estilos para animações de erro
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});