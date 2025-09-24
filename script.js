const ctx = document.getElementById('grafico').getContext('2d');
let chart;

document.getElementById('btn-cargar').addEventListener('click', cargarDatos);

async function cargarDatos() {
  const caso = document.getElementById('caso').value;
  const url = `https://apidemo.geoeducacion.com.ar/api/testing/control/${caso}`;
  const alerta = document.getElementById('alerta');
  alerta.textContent = '';

  try {
    const res = await fetch(url);

 
    console.log('[API] URL:', url);
    console.log('[API] status:', res.status, res.statusText);
    console.log('[API] content-type:', res.headers.get('content-type'));

  
    const raw = await res.clone().text();
    console.log('[API] raw body:', raw);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('La respuesta no es JSON');
    }

    const data = await res.json();
    console.log('[API] JSON:', data);
    console.log('[API] JSON pretty:\n', JSON.stringify(data, null, 2));

    if (!data.success) throw new Error('Error en la API');

    const { media, lsc, lic, valores } = data.data[0];

    console.log('[API] media:', media, 'lsc:', lsc, 'lic:', lic);
    console.table(valores); 

    const labels = valores.map(v => v.x);
    const valoresY = valores.map(v => v.y);

    
    const sigma = ((lsc - media) + (media - lic)) / 6;
    console.log('[API] sigma estimada:', sigma);

   
    const line = v => Array(labels.length).fill(v);

   
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
    
          {
            label: 'Variable',
            data: valoresY,
            borderColor: 'blue',
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.1
          },
          
          {
            label: 'Media',
            data: line(media),
            borderColor: 'green',
            borderDash: [6, 6],
            fill: false,
            pointRadius: 0
          },
          // +1σ y -1σ
          {
            label: '+1σ',
            data: line(media + sigma),
            borderColor: '#f39c12',
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0
          },
          {
            label: '-1σ',
            data: line(media - sigma),
            borderColor: '#f39c12',
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0
          },
          // +2σ y -2σ
          {
            label: '+2σ',
            data: line(media + 2 * sigma),
            borderColor: '#8e44ad',
            borderDash: [8, 4],
            fill: false,
            pointRadius: 0
          },
          {
            label: '-2σ',
            data: line(media - 2 * sigma),
            borderColor: '#8e44ad',
            borderDash: [8, 4],
            fill: false,
            pointRadius: 0
          },
          // LSC / LIC (≈ ±3σ)
          {
            label: 'LSC (≈ +3σ)',
            data: line(lsc),
            borderColor: 'red',
            borderDash: [10, 6],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'LIC (≈ -3σ)',
            data: line(lic),
            borderColor: 'red',
            borderDash: [10, 6],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, 
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            title: { display: true, text: 'Muestra' }
          },
          y: {
            title: { display: true, text: 'Valor' }
          }
        }
      }
    });

    
    detectarAnomalia(valoresY, media, lsc, lic, caso, sigma);
  } catch (error) {
    console.error('[API] error:', error);
    alerta.textContent = 'Error al cargar datos.';
  }
}

function detectarAnomalia(valores, media, lsc, lic, caso, sigma) {
  const alerta = document.getElementById('alerta');
  alerta.textContent = '';

  if (caso === '1' && valores.some(v => v > lsc || v < lic)) {
    alerta.textContent = ' Caso fuera de control: valores fuera de los límites.';
  } else if (caso === '3') {
    alerta.textContent = ' Tendencia: 2 de 3 puntos fuera de 2σ (atención).';
  } else if (caso === '4') {
    alerta.textContent = ' Tendencia: 4 de 5 puntos fuera de σ (posible problema).';
  } else if (caso === '5') {
    alerta.textContent = ' Tendencia: 8 puntos consecutivos del mismo lado de la media.';
  }
}

