async function obtenerClima() {
  const ciudad = document.getElementById('ciudad').value.trim();
  const resultado = document.getElementById('resultado');
  
  if (!ciudad) {
    resultado.innerHTML = '<div class="mensaje-error">—</div>';
    return;
  }

  resultado.innerHTML = '<div class="cargando"><div class="spinner"></div></div>';
  document.getElementById('nombre-ciudad').textContent = '';

  const apiKey = "f0d4ba5c5d5321d22e79f69ddfd63d90"; 
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Datos actuales:", data); 
    
    if (data.cod === 200) {
      mostrarClima(data);

      const pronosticoResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${ciudad}&appid=${apiKey}&units=metric&lang=es&cnt=40`);
      
      if (!pronosticoResponse.ok) {
        console.warn("Error en pronóstico extendido");
      } else {
        const pronosticoData = await pronosticoResponse.json();
        console.log("Datos pronóstico:", pronosticoData); 
        mostrarPronosticoExtendido(pronosticoData);
        mostrarGraficoTemperatura(pronosticoData);
      }
      
      if (data.coord && data.coord.lat && data.coord.lon) {
        try {
          const indices = await obtenerIndices(data.coord.lat, data.coord.lon);
          mostrarIndices(indices);
        } catch (error) {
          console.error("Error en índices climáticos:", error);
        }
      }
    } else {
      resultado.innerHTML = `<div class="mensaje-error">${data.message || "Ciudad no encontrada"}</div>`;
    }
  } catch (error) {
    resultado.innerHTML = '<div class="mensaje-error">✖ Error al cargar</div>';
    console.error("Error completo:", error);
  }
}

function mostrarClima(data) {
  const resultado = document.getElementById('resultado');
  const body = document.body;
  
  body.className = '';
  

  const temp = Math.round(data.main?.temp ?? 0);
  const desc = data.weather?.[0]?.description?.toUpperCase() ?? "DESCONOCIDO";
  const iconCode = data.weather?.[0]?.icon || "01d";
  const mainWeather = data.weather?.[0]?.main?.toLowerCase() || "clear";
  const isNight = iconCode.includes('n');
  
  if (isNight) {
    body.classList.add('body-noche');
  } else if (mainWeather.includes('clear')) {
    body.classList.add('body-soleado');
  } else if (mainWeather.includes('cloud')) {
    body.classList.add('body-nublado');
  } else if (mainWeather.includes('rain') || mainWeather.includes('drizzle')) {
    body.classList.add('body-lluvia');
  } else if (mainWeather.includes('thunderstorm')) {
    body.classList.add('body-tormenta');
  } else if (mainWeather.includes('snow')) {
    body.classList.add('body-nieve');
  } else if (temp > 30) {
    body.classList.add('body-calor');
  } else if (temp < 5) {
    body.classList.add('body-frio');
  }
  
  resultado.innerHTML = `
    <div class="temperatura">${temp}°</div>
    <div class="icono-clima">
      <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${desc}">
    </div>
    <div class="descripcion">${desc}</div>
    
    <div class="detalles-adicionales">
      <div class="detalle">
        <span class="etiqueta">Humedad</span>
        <span class="valor">${data.main?.humidity ?? "--"}%</span>
      </div>
      <div class="detalle">
        <span class="etiqueta">Viento</span>
        <span class="valor">${Math.round((data.wind?.speed ?? 0) * 3.6)} km/h</span>
      </div>
      <div class="detalle">
        <span class="etiqueta">Presión</span>
        <span class="valor">${data.main?.pressure ?? "--"} hPa</span>
      </div>
      <div class="detalle">
        <span class="etiqueta">Sensación</span>
        <span class="valor">${Math.round(data.main?.feels_like ?? temp)}°</span>
      </div>
    </div>
  `;
  
  document.getElementById('nombre-ciudad').textContent = data.name?.toUpperCase() || ciudad.toUpperCase();
  document.documentElement.style.setProperty(
    '--color-accento', 
    temp > 25 ? '#FF3366' : temp < 10 ? '#3366FF' : '#33CC33'
  );
}

function mostrarPronosticoExtendido(data) {
  if (!data?.list || !Array.isArray(data.list)) {
    console.error("Datos de pronóstico inválidos:", data);
    return;
  }

  const contenedor = document.createElement('div');
  contenedor.className = 'pronostico-extendido';
  const pronosticoPorDia = {};
  
  data.list.forEach(item => {
    if (!item?.dt_txt || !item.weather?.[0]) return;
    
    const fecha = item.dt_txt.split(' ')[0];
    pronosticoPorDia[fecha] = pronosticoPorDia[fecha] || [];
    pronosticoPorDia[fecha].push(item);
  });
  
  const dias = Object.keys(pronosticoPorDia).slice(0, 5);
  
  dias.forEach(dia => {
    const itemsDia = pronosticoPorDia[dia];
    if (!itemsDia?.length) return;
    
    const diaDiv = document.createElement('div');
    diaDiv.className = 'dia-pronostico';
    
    const fecha = new Date(dia);
    const nombreDia = fecha.toLocaleDateString('es', { weekday: 'long' });
    const temps = itemsDia.map(i => i.main?.temp).filter(Boolean);
    const icono = itemsDia[4]?.weather[0]?.icon || '01d';
    
    diaDiv.innerHTML = `
      <div class="nombre-dia">${nombreDia}</div>
      <div class="icono-pequeno"><img src="https://openweathermap.org/img/wn/${icono}.png"></div>
      <div class="temp-extendida">
        ${temps.length ? Math.round(Math.min(...temps)) : '--'}° / ${temps.length ? Math.round(Math.max(...temps)) : '--'}°
      </div>
    `;
    
    contenedor.appendChild(diaDiv);
  });
  
  document.getElementById('resultado').appendChild(contenedor);
}

function mostrarGraficoTemperatura(dataPronostico) {
  if (!dataPronostico?.list) return;
  
  const canvas = document.createElement('canvas');
  canvas.id = 'grafico-temperatura';
  document.getElementById('resultado').appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const horas = dataPronostico.list.slice(0, 8).map(item => 
    new Date(item.dt * 1000).getHours() + 'h'
  );
  const temperaturas = dataPronostico.list.slice(0, 8).map(item => item.main?.temp || 0);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: horas,
      datasets: [{
        label: 'Temperatura (°C)',
        data: temperaturas,
        borderColor: 'var(--color-accento)',
        backgroundColor: 'rgba(0,0,0,0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.1)' } },
        x: { grid: { color: 'rgba(0,0,0,0.1)' } }
      }
    }
  });
}

async function obtenerIndices(lat, lon) {
  const apiKey = "f0d4ba5c5d5321d22e79f69ddfd63d90";
  try {
    const [uvResponse, airResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    ]);
    
    const uvData = await uvResponse.json();
    const airData = await airResponse.json();
    
    return {
      uv: uvData.value ?? 0,
      calidadAire: airData.list?.[0]?.main?.aqi ?? 1
    };
  } catch (error) {
    console.error("Error obteniendo índices:", error);
    return { uv: 0, calidadAire: 1 }; 
  }
}

function mostrarIndices(indices) {
  const divIndices = document.createElement('div');
  divIndices.className = 'indices-climaticos';
  
  const calidadAireText = [
    'Buena', 'Moderada', 'Poco saludable', 'No saludable', 'Muy poco saludable'
  ];
  
  divIndices.innerHTML = `
    <div class="indice">
      <span class="etiqueta">Índice UV</span>
      <span class="valor uv-${Math.min(11, Math.round(indices.uv))}">${indices.uv.toFixed(1)}</span>
    </div>
    <div class="indice">
      <span class="etiqueta">Calidad del aire</span>
      <span class="valor aqi-${indices.calidadAire}">${calidadAireText[indices.calidadAire - 1] || 'Desconocida'}</span>
    </div>
  `;
  
  document.getElementById('resultado').appendChild(divIndices);
}

async function obtenerUbicacion() {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización");
    return;
  }

  const resultado = document.getElementById('resultado');
  resultado.innerHTML = '<div class="cargando"><div class="spinner"></div></div>';
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const apiKey = "f0d4ba5c5d5321d22e79f69ddfd63d90";
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${apiKey}&units=metric&lang=es`;
        
        const response = await fetch(weatherUrl);
        const data = await response.json();
        
        document.getElementById('ciudad').value = data.name;
        await obtenerClima(); 
        
      } catch (error) {
        resultado.innerHTML = '<div class="mensaje-error">Error al cargar</div>';
        console.error("Error:", error);
      }
    },
    (error) => {
      resultado.innerHTML = '<div class="mensaje-error">Permiso denegado</div>';
      console.error("Error de geolocalización:", error);
    }
  );
}

document.getElementById('ciudad').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') obtenerClima();
});