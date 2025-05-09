// Variables principales
let temps1 = [], temps2 = [];
let years = [], cityName1 = "", cityName2 = "";
let ready = false, loading = false;
let mode = "bars", view = "single";
let yearRange = "1980-2023";

// Paleta de colores
const COLORS = {
  city1: {
    bar: "#4caf50",
    line: "#2e7d32",
    dot: "#43a047"
  },
  city2: {
    bar: "#2196f3",
    line: "#0d47a1",
    dot: "#1976d2"
  }
};

// Configuración inicial
function setup() {
  // Crear canvas dentro del contenedor
  const canvasContainer = document.querySelector('.chart-container');
  const canvas = createCanvas(canvasContainer.offsetWidth, 400);
  canvas.parent(canvasContainer);
  
  // Configurar estilos de texto
  textAlign(CENTER, CENTER);
  
  // Configurar eventos
  document.getElementById("chartMode").addEventListener("change", (e) => {
    mode = e.target.value;
    if (ready) redraw();
  });
  
  document.getElementById("viewMode").addEventListener("change", (e) => {
    view = e.target.value;
    const city2Container = document.getElementById("city2Container");
    city2Container.style.display = view === "compare" ? "block" : "none";
    if (ready) redraw();
  });
  
  document.getElementById("yearRange").addEventListener("change", (e) => {
    yearRange = e.target.value;
    if (ready) loadData();
  });
  
  // Responsive
  window.addEventListener('resize', () => {
    resizeCanvas(canvasContainer.offsetWidth, 400);
    if (ready) redraw();
  });
  
  // Solo dibujar cuando sea necesario
  noLoop();
  
  // Exponer funciones globalmente
  window.loadData = loadData;
  window.redraw = redraw;
}

// Función principal de dibujo
function draw() {
  // Detectar tema oscuro
  const isDarkMode = document.documentElement.classList.contains('dark-mode');
  const bgColor = isDarkMode ? "#1e1e1e" : "#ffffff";
  const textColor = isDarkMode ? "#f5f5f5" : "#212121";
  const gridColor = isDarkMode ? "#333333" : "#e0e0e0";
  
  // Limpiar fondo
  background(bgColor);
  
  // Estado de carga
  if (loading) {
    displayLoading(textColor);
    return;
  }
  
  // Mensaje inicial
  if (!ready) {
    fill(textColor);
    textSize(16);
    text("Ingresa ciudad(es) y presiona Visualizar", width/2, height/2);
    return;
  }

  // Preparar datos para visualización
  let allTemps = view === "compare" ? [...temps1, ...temps2] : temps1;
  let maxTemp = Math.ceil(max(allTemps));
  let minTemp = Math.floor(min(allTemps));
  
  // Asegurar rango visual adecuado
  if (maxTemp - minTemp < 5) {
    maxTemp += (5 - (maxTemp - minTemp)) / 2;
    minTemp -= (5 - (maxTemp - minTemp)) / 2;
  }
  
  // Dimensiones del gráfico
  const padding = 60;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  const chartBottom = height - padding;
  const chartTop = padding;
  const chartLeft = padding;
  const chartRight = width - padding;
  
  // Dibujar título
  fill(textColor);
  textSize(18);
  textStyle(BOLD);
  const title = view === "compare" ? 
    `Temperaturas máximas: ${cityName1} vs ${cityName2} (${yearRange})` : 
    `Temperaturas máximas anuales: ${cityName1} (${yearRange})`;
  text(title, width/2, padding/2);
  textStyle(NORMAL);
  
  // Dibujar ejes
  stroke(gridColor);
  strokeWeight(1);
  line(chartLeft, chartBottom, chartRight, chartBottom); // Eje X
  line(chartLeft, chartTop, chartLeft, chartBottom); // Eje Y
  
  // Grid y etiquetas Y
  const gridSteps = 5;
  const tempStep = (maxTemp - minTemp) / gridSteps;
  
  for (let i = 0; i <= gridSteps; i++) {
    const y = map(minTemp + (tempStep * i), minTemp, maxTemp, chartBottom, chartTop);
    
    // Línea horizontal
    stroke(gridColor);
    strokeWeight(0.5);
    line(chartLeft, y, chartRight, y);
    
    // Etiqueta temperatura
    noStroke();
    fill(textColor);
    textAlign(RIGHT, CENTER);
    textSize(11);
    text((minTemp + (tempStep * i)).toFixed(1) + "°C", chartLeft - 5, y);
  }
  
  textAlign(CENTER, CENTER);
  
  // Calcular ancho de barras
  const barWidth = chartWidth / temps1.length;
  
  // Actualizar leyenda
  updateLegend();
  
  // Dibujar datos
  for (let i = 0; i < temps1.length; i++) {
    // Posición X para este año
    const x = chartLeft + (i + 0.5) * barWidth;
    
    // Posición Y para temperatura ciudad 1
    const y1 = map(temps1[i], minTemp, maxTemp, chartBottom, chartTop);
    
    // Etiquetas años X (espaciadas)
    if (i % 5 === 0 || i === temps1.length - 1 || temps1.length < 12) {
      fill(textColor);
      textSize(11);
      text(years[i], x, chartBottom + 15);
    }
    
    // Opciones según modo de vista
    if (view === "compare") {
      // Obtener posición Y para ciudad 2
      const y2 = map(temps2[i], minTemp, maxTemp, chartBottom, chartTop);
      
      if (mode === "bars") {
        // Barras ciudad 1
        noStroke();
        fill(COLORS.city1.bar);
        rect(x - barWidth/3, y1, barWidth/4, chartBottom - y1, 2, 2, 0, 0);
        
        // Barras ciudad 2
        fill(COLORS.city2.bar);
        rect(x + barWidth/12, y2, barWidth/4, chartBottom - y2, 2, 2, 0, 0);
        
        // Etiquetas de temperatura (espaciadas)
        if (temps1.length < 12 || i % 4 === 0 || i === temps1.length - 1) {
          fill(textColor);
          textSize(10);
          text(temps1[i].toFixed(1) + "°", x - barWidth/4, y1 - 10);
          text(temps2[i].toFixed(1) + "°", x + barWidth/4, y2 - 10);
        }
      } else {
        // Líneas
        if (i < temps1.length - 1) {
          const nextX = chartLeft + (i + 1.5) * barWidth;
          const nextY1 = map(temps1[i + 1], minTemp, maxTemp, chartBottom, chartTop);
          const nextY2 = map(temps2[i + 1], minTemp, maxTemp, chartBottom, chartTop);
          
          // Línea ciudad 1
          stroke(COLORS.city1.line);
          strokeWeight(2);
          line(x, y1, nextX, nextY1);
          
          // Línea ciudad 2
          stroke(COLORS.city2.line);
          line(x, y2, nextX, nextY2);
        }
        
        // Puntos
        noStroke();
        fill(COLORS.city1.dot);
        ellipse(x, y1, 6, 6);
        
        fill(COLORS.city2.dot);
        ellipse(x, y2, 6, 6);
        
        // Etiquetas de temperatura
        if (temps1.length < 10 || i % 4 === 0 || i === temps1.length - 1) {
          fill(textColor);
          textSize(10);
          text(temps1[i].toFixed(1) + "°", x, y1 - 12);
          text(temps2[i].toFixed(1) + "°", x, y2 - 12);
        }
      }
    } else {
      // Modo de una sola ciudad
      if (mode === "bars") {
        // Barras
        noStroke();
        fill(COLORS.city1.bar);
        rect(x - barWidth/4, y1, barWidth/2, chartBottom - y1, 2, 2, 0, 0);
        
        // Etiquetas
        if (temps1.length < 12 || i % 3 === 0 || i === temps1.length - 1) {
          fill(textColor);
          textSize(11);
          text(temps1[i].toFixed(1) + "°C", x, y1 - 12);
        }
      } else {
        // Líneas
        if (i < temps1.length - 1) {
          const nextX = chartLeft + (i + 1.5) * barWidth;
          const nextY = map(temps1[i + 1], minTemp, maxTemp, chartBottom, chartTop);
          
          stroke(COLORS.city1.line);
          strokeWeight(2);
          line(x, y1, nextX, nextY);
        }
        
        // Puntos
        noStroke();
        fill(COLORS.city1.dot);
        ellipse(x, y1, 6, 6);
        
        // Etiquetas
        if (temps1.length < 12 || i % 3 === 0 || i === temps1.length - 1) {
          fill(textColor);
          textSize(11);
          text(temps1[i].toFixed(1) + "°C", x, y1 - 12);
        }
      }
    }
  }
}

// Mostrar estado de carga
function displayLoading(textColor) {
  fill(textColor);
  textSize(16);
  text("Cargando datos...", width/2, height/2 - 30);
  
  const time = millis() / 1000;
  const x = width / 2;
  const y = height / 2 + 20;
  
  noFill();
  stroke(COLORS.city1.bar);
  strokeWeight(3);
  arc(x, y, 40, 40, 0, map(sin(time * 2), -1, 1, 0, TWO_PI));
  
  fill(textColor);
  textSize(12);
  text("Obteniendo datos de Open-Meteo...", width/2, height/2 + 60);
}

// Actualizar leyenda del gráfico
function updateLegend() {
  const legendDiv = document.getElementById("chartLegend");
  legendDiv.innerHTML = "";
  
  if (view === "compare") {
    // Leyenda para dos ciudades
    legendDiv.innerHTML = `
      <div class="legend-item">
        <div class="legend-color" style="background: ${COLORS.city1.bar}"></div>
        <span>${cityName1}</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: ${COLORS.city2.bar}"></div>
        <span>${cityName2}</span>
      </div>
    `;
  } else {
    // Leyenda para una ciudad
    legendDiv.innerHTML = `
      <div class="legend-item">
        <div class="legend-color" style="background: ${COLORS.city1.bar}"></div>
        <span>Temperatura máxima anual</span>
      </div>
    `;
  }
}

// Generar resumen estadístico
function generateSummary() {
  let summary = "";
  
  if (view === "single") {
    // Resumen para una sola ciudad
    const startTemp = temps1[0];
    const endTemp = temps1[temps1.length - 1];
    const change = endTemp - startTemp;
    const changeDir = change > 0 ? "aumentado" : "disminuido";
    const maxY = max(temps1);
    const minY = min(temps1);
    const maxIndex = temps1.indexOf(maxY);
    const minIndex = temps1.indexOf(minY);
    const avgTemp = (temps1.reduce((a, b) => a + b, 0) / temps1.length).toFixed(1);
    
    summary = `<strong>${cityName1}</strong> ha ${changeDir} <strong>${Math.abs(change).toFixed(2)}°C</strong> 
              desde ${years[0]} hasta ${years[years.length-1]}. 
              El año más caluroso fue <strong>${years[maxIndex]}</strong> (${maxY.toFixed(1)}°C) y 
              el más frío <strong>${years[minIndex]}</strong> (${minY.toFixed(1)}°C). 
              Temperatura máxima media: <strong>${avgTemp}°C</strong>.`;
  } else {
    // Resumen comparativo para dos ciudades
    const avg1 = temps1.reduce((a, b) => a + b, 0) / temps1.length;
    const avg2 = temps2.reduce((a, b) => a + b, 0) / temps2.length;
    const diff = Math.abs(avg1 - avg2).toFixed(2);
    const hotterCity = avg1 > avg2 ? cityName1 : cityName2;
    const coolerCity = avg1 > avg2 ? cityName2 : cityName1;
    
    const change1 = temps1[temps1.length - 1] - temps1[0];
    const change2 = temps2[temps2.length - 1] - temps2[0];
    
    summary = `<strong>${cityName1}</strong> muestra un cambio de ${change1.toFixed(2)}°C con temperatura media de <strong>${avg1.toFixed(1)}°C</strong>. 
              <strong>${cityName2}</strong> muestra un cambio de ${change2.toFixed(2)}°C con temperatura media de <strong>${avg2.toFixed(1)}°C</strong>. 
              En promedio, <strong>${hotterCity}</strong> ha sido ${diff}°C más cálido que <strong>${coolerCity}</strong>.`;
  }
  
  document.getElementById("summary").innerHTML = summary;
}

// Cargar datos desde la API
async function loadData() {
  // Mostrar estado de carga
  loading = true;
  ready = false;
  temps1 = [];
  temps2 = [];
  years = [];
  
  // Limpiar resumen
  document.getElementById("summary").innerHTML = "";
  
  // Redibujar para mostrar carga
  redraw();

  // Obtener valores de los campos
  const c1 = document.getElementById("city1").value.trim();
  const c2 = document.getElementById("city2").value.trim();
  view = document.getElementById("viewMode").value;
  mode = document.getElementById("chartMode").value;
  yearRange = document.getElementById("yearRange").value;

  // Validar entrada
  if (!c1 || (view === "compare" && !c2)) {
    loading = false;
    alert("Ingresa el nombre de la(s) ciudad(es)");
    redraw();
    return;
  }

  try {
    // Cargar datos para la primera ciudad
    let result1 = await fetchCityData(c1, yearRange);
    
    if (result1.temps.length === 0) {
      throw new Error("No se pudieron obtener datos para " + c1);
    }
    
    temps1 = result1.temps;
    years = result1.years;
    cityName1 = result1.name;

    // Si es modo comparativo, cargar datos para la segunda ciudad
    if (view === "compare") {
      let result2 = await fetchCityData(c2, yearRange);
      
      if (result2.temps.length === 0) {
        throw new Error("No se pudieron obtener datos para " + c2);
      }
      
      temps2 = result2.temps;
      cityName2 = result2.name;
    }

    // Datos cargados exitosamente
    ready = true;
    window.ready = true;
    
    // Generar resumen estadístico
    generateSummary();
    
  } catch (error) {
    console.error("Error al cargar datos:", error);
    alert(error.message || "Error al cargar datos. Inténtalo de nuevo.");
  }
  
  // Finalizar estado de carga
  loading = false;
  redraw();
}

// Obtener datos de la ciudad desde la API
async function fetchCityData(city, yearRange) {
  const [startYear, endYear] = yearRange.split('-');
  
  try {
    // 1. Obtener coordenadas geográficas
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Ciudad no encontrada: ${city}`);
    }
    
    const location = geoData.results[0];
    const lat = location.latitude;
    const lon = location.longitude;
    const name = location.name;
    
    // 2. Obtener datos históricos de temperatura máxima
    const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startYear}-01-01&end_date=${endYear}-12-31&daily=temperature_2m_max&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`Error al obtener datos climáticos: ${weatherResponse.statusText}`);
    }
    
    const weatherData = await weatherResponse.json();
    
    if (!weatherData.daily || !weatherData.daily.time || weatherData.daily.time.length === 0) {
      throw new Error(`No hay datos disponibles para ${name} en el periodo ${startYear}-${endYear}`);
    }
    
    // 3. Procesar datos anuales
    const dailyMaxTemps = weatherData.daily.temperature_2m_max;
    const dailyDates = weatherData.daily.time;
    
    let yearMap = {};
    
    for (let i = 0; i < dailyDates.length; i++) {
      if (dailyMaxTemps[i] === null) continue;
      
      const date = new Date(dailyDates[i]);
      const year = date.getFullYear();
      
      if (!yearMap[year]) yearMap[year] = [];
      yearMap[year].push(dailyMaxTemps[i]);
    }
    
    // Calcular máximos anuales
    let temps = [], years = [];
    for (let yr in yearMap) {
      if (yearMap[yr].length >= 300) {
        let maxTemp = Math.max(...yearMap[yr]);
        years.push(yr);
        temps.push(maxTemp);
      }
    }
    
    // Ordenar por año
    const sortedIndices = years.map((_, i) => i).sort((a, b) => years[a] - years[b]);
    years = sortedIndices.map(i => years[i]);
    temps = sortedIndices.map(i => temps[i]);
    
    return {
      years,
      temps,
      name
    };
  } catch (error) {
    console.error("Error al obtener datos de la ciudad:", error);
    throw error;
  }
}
