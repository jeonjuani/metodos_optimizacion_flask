// ===== ESTADO GLOBAL =====
let datosIteraciones = [];
let metodoActual = 'biseccion';

function parsearVariablesYRangos(input) {
    const texto = (input || '').trim();
    if (!texto) throw new Error('Ingresa al menos una variable con su rango.');

    const tokens = texto.split(/\s+/);
    const variables = [];
    const rangos = [];
    const tokenRegex = /^([a-zA-Z]\w*)\[\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*,\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*\]$/i;

    for (const token of tokens) {
        const match = token.match(tokenRegex);
        if (!match) {
            throw new Error(`Formato inválido en "${token}". Usa variable[min,max], ej: x[-2,2]`);
        }

        const variable = match[1];
        const min = Number(match[2]);
        const max = Number(match[3]);

        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            throw new Error(`Rango inválido en "${token}".`);
        }
        if (min >= max) {
            throw new Error(`En "${token}" debe cumplirse min < max.`);
        }
        if (variables.includes(variable)) {
            throw new Error(`Variable repetida: "${variable}".`);
        }

        variables.push(variable);
        rangos.push([min, max]);
    }

    return { variables, rangos };
}

// ===== CONFIGURACIÓN POR MÉTODO =====
const METODOS = {
    biseccion: {
        nombre: 'Bisección',
        desc: 'Búsqueda incremental por corte binario. Divide el intervalo a la mitad en cada iteración hasta localizar la raíz.',
        endpoint: '/calcular/biseccion',
        pasos: [
            'Elegir x<sub>l</sub> y x<sub>u</sub> tal que f(x<sub>l</sub>)·f(x<sub>u</sub>) &lt; 0',
            'Calcular x<sub>r</sub> = (x<sub>l</sub> + x<sub>u</sub>) / 2',
            'Si f(x<sub>l</sub>)·f(x<sub>r</sub>) &lt; 0 → x<sub>u</sub> = x<sub>r</sub>, si no → x<sub>l</sub> = x<sub>r</sub>',
            'Repetir hasta que el error relativo &lt; tolerancia',
        ]
    },
    regla_falsa: {
        nombre: 'Falsa Posición',
        desc: 'Une f(x<sub>l</sub>) y f(x<sub>u</sub>) con una línea recta. La intersección con el eje x es la aproximación de la raíz (interpolación lineal).',
        endpoint: '/calcular/regla_falsa',
        pasos: [
            'Elegir x<sub>l</sub> y x<sub>u</sub> tal que f(x<sub>l</sub>)·f(x<sub>u</sub>) &lt; 0',
            'Calcular x<sub>r</sub> = x<sub>u</sub> − f(x<sub>u</sub>)·(x<sub>l</sub> − x<sub>u</sub>) / (f(x<sub>l</sub>) − f(x<sub>u</sub>))',
            'Si f(x<sub>l</sub>)·f(x<sub>r</sub>) &lt; 0 → x<sub>u</sub> = x<sub>r</sub>, si no → x<sub>l</sub> = x<sub>r</sub>',
            'Repetir hasta que el error relativo &lt; tolerancia',
        ]
    },
    newton_raphson: {
        nombre: 'Newton-Raphson',
        desc: 'Método iterativo para encontrar raíces usando derivada: x_{n+1} = x_n − f(x_n)/f\'(x_n).',
        endpoint: '/calcular/newton_raphson',
        pasos: [
            'Elegir x_0 como estimación inicial',
            'Calcular f(x_n) y su derivada f\'(x_n)',
            'Actualizar x_{n+1} = x_n − f(x_n)/f\'(x_n)',
            'Repetir hasta que el error relativo sea menor a la tolerancia',
        ]
    },
    newton_optimo: {
        nombre: 'Newton Óptimo',
        desc: "Busca extremos de f(x) usando derivadas primera y segunda: x_{n+1} = x_n − f'(x_n)/f''(x_n).",
        endpoint: '/calcular/newton_optimo',
        pasos: [
            'Elegir x_0 como estimación inicial',
            "Calcular f'(x_n) y f''(x_n)",
            "Actualizar x_{n+1} = x_n − f'(x_n)/f''(x_n)",
            "Verificar convergencia al mínimo/máximo según signo de f''(x)",
        ]
    },
    razon_dorada: {
        nombre: 'Razón Dorada',
        desc: 'Busca el mínimo o máximo de f(x) en [x_l,x_u] usando la proporción áurea.',
        endpoint: '/calcular/razon_dorada',
        pasos: [
            'Elegir x_l y x_u que contengan el óptimo',
            'Calcular x1 = x_u − 0.618*(x_u − x_l), x2 = x_l + 0.618*(x_u − x_l)',
            'Evaluar f(x1) y f(x2)',
            'Actualizar intervalo y repetir hasta converger',
        ]
    },
    interpolacion_cuadratica: {
        nombre: 'Interpolación Cuadrática',
        desc: 'Ajusta una parábola a tres puntos y evalúa el vértice para encontrar extremo local.',
        endpoint: '/calcular/interpolacion_cuadratica',
        pasos: [
            'Elegir x0 < x1 < x2',
            'Calcular x3 = vértice de parábola por interpolación cuadrática',
            'Evaluar f(x3), guardar x3 y reducir el intervalo',
            'Repetir hasta tolerancia',
        ]
    },
    busqueda_aleatoria: {
        nombre: 'Búsqueda Aleatoria',
        desc: 'Método multidimensional que evalúa la función en puntos generados aleatoriamente, almacenando el óptimo encontrado.',
        endpoint: '/calcular/busqueda_aleatoria',
        pasos: [
            'Definir variables y rangos de búsqueda',
            'Generar punto aleatorio en el espacio de búsqueda',
            'Evaluar función en ese punto',
            'Comparar con óptimo anterior y actualizar si es mejor',
            'Repetir hasta máximo de iteraciones',
        ]
    }
};

// ===== CAMBIAR MÉTODO =====
function cambiarMetodo(metodo, event = null) {
    if (!METODOS[metodo]) return;
    metodoActual = metodo;

    // Actualizar nav
    const navItems = document.querySelectorAll('.nav-item:not(.soon)');
    navItems.forEach(el => el.classList.remove('active'));

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const idx = metodo === 'biseccion' ? 0 : metodo === 'regla_falsa' ? 1 : metodo === 'newton_raphson' ? 2 : metodo === 'newton_optimo' ? 3 : metodo === 'razon_dorada' ? 4 : -1;
        if (idx >= 0 && idx < navItems.length) navItems[idx].classList.add('active');
    }

    // Actualizar thead de tabla según método
    const thead = document.querySelector('#tabla-iteraciones thead');
    if (metodo === 'biseccion' || metodo === 'regla_falsa') {
        thead.innerHTML = `
            <tr>
                <th>Iter.</th>
                <th>x<sub>l</sub></th>
                <th>x<sub>u</sub></th>
                <th>x<sub>r</sub></th>
                <th>f(x<sub>l</sub>)</th>
                <th>f(x<sub>r</sub>)</th>
                <th>Error (%)</th>
            </tr>
        `;
    } else if (metodo === 'newton_raphson') {
        thead.innerHTML = `
            <tr>
                <th>Iter.</th>
                <th>x</th>
                <th>f(x)</th>
                <th>f'(x)</th>
                <th>x<sub>next</sub></th>
                <th>Error (%)</th>
            </tr>
        `;
    } else if (metodo === 'newton_optimo') {
        thead.innerHTML = `
            <tr>
                <th>Iter.</th>
                <th>x</th>
                <th>f'(x)</th>
                <th>f''(x)</th>
                <th>x<sub>next</sub></th>
                <th>Error (%)</th>
            </tr>
        `;
    } else if (metodo === 'razon_dorada') {
        thead.innerHTML = `
            <tr>
                <th>Iter.</th>
                <th>x<sub>l</sub></th>
                <th>x<sub>u</sub></th>
                <th>x<sub>1</sub></th>
                <th>x<sub>2</sub></th>
                <th>f(x<sub>1</sub>)</th>
                <th>f(x<sub>2</sub>)</th>
                <th>Error</th>
            </tr>
        `;
    } else if (metodo === 'interpolacion_cuadratica') {
        thead.innerHTML = `
            <tr>
                <th>Iter.</th>
                <th>x0</th>
                <th>x1</th>
                <th>x2</th>
                <th>x3</th>
                <th>f(x0)</th>
                <th>f(x1)</th>
                <th>f(x2)</th>
                <th>f(x3)</th>
                <th>Error</th>
            </tr>
        `;
    } else if (metodo === 'busqueda_aleatoria') {
        thead.innerHTML = `
            <tr>
                <th>Iter.</th>
                <th>Punto Actual</th>
                <th>f(punto)</th>
            </tr>
        `;
    }

    // Actualizar sidebar
    const cfg = METODOS[metodo];
    document.getElementById('method-name').textContent = cfg.nombre;
    document.getElementById('method-desc').innerHTML = cfg.desc;

    const btn = document.querySelector('.btn-calcular');
    if (metodo === 'newton_optimo' || metodo === 'razon_dorada' || metodo === 'interpolacion_cuadratica' || metodo === 'busqueda_aleatoria') {
        btn.innerHTML = '<span class="btn-icon">▶</span> Calcular Óptimo';
    } else {
        btn.innerHTML = '<span class="btn-icon">▶</span> Calcular Raíz';
    }

    // Ajustar formularios según método
    const rowInterval = document.getElementById('row-interval');
    const rowX0 = document.getElementById('row-x0');
    const rowX012 = document.getElementById('row-x012');
    const rowMultivariable = document.getElementById('row-multivariable');
    const rowObjetivo = document.getElementById('row-objetivo');

    if (metodo === 'biseccion' || metodo === 'regla_falsa' || metodo === 'razon_dorada') {
        rowInterval.style.display = 'flex';
        rowX0.style.display = 'none';
        rowX012.style.display = 'none';
        rowMultivariable.style.display = 'none';
    } else if (metodo === 'newton_raphson' || metodo === 'newton_optimo') {
        rowInterval.style.display = 'none';
        rowX0.style.display = 'flex';
        rowX012.style.display = 'none';
        rowMultivariable.style.display = 'none';
    } else if (metodo === 'interpolacion_cuadratica') {
        rowInterval.style.display = 'none';
        rowX0.style.display = 'none';
        rowX012.style.display = 'flex';
        rowMultivariable.style.display = 'none';
    } else if (metodo === 'busqueda_aleatoria') {
        rowInterval.style.display = 'none';
        rowX0.style.display = 'none';
        rowX012.style.display = 'none';
        rowMultivariable.style.display = 'flex';
    } else {
        rowInterval.style.display = 'none';
        rowX0.style.display = 'none';
        rowX012.style.display = 'none';
        rowMultivariable.style.display = 'none';
    }

    if (metodo === 'razon_dorada' || metodo === 'interpolacion_cuadratica' || metodo === 'busqueda_aleatoria') {
        rowObjetivo.style.display = 'flex';
    } else {
        rowObjetivo.style.display = 'none';
    }

    // Actualizar pasos del algoritmo
    const stepsEl = document.getElementById('algo-steps');
    stepsEl.innerHTML = cfg.pasos.map((p, i) => `
        <div class="algo-step">
            <span class="step-num">${i + 1}</span>
            <span>${p}</span>
        </div>
    `).join('');

    // Limpiar resultados anteriores
    limpiarResultados();
}

function limpiarResultados() {
    ocultarResultado();
    ocultarError();
    const colspan = metodoActual === 'razon_dorada' ? '8' : metodoActual === 'interpolacion_cuadratica' ? '10' : metodoActual === 'busqueda_aleatoria' ? '3' : metodoActual.startsWith('newton') ? '6' : '7';
    document.getElementById('tabla-body').innerHTML =
        '<tr class="empty-row"><td colspan="' + colspan + '">Selecciona un método y presiona Calcular.</td></tr>';
    document.getElementById('iter-count').classList.add('hidden');
    document.getElementById('btn-export').classList.add('hidden');
    document.getElementById('chart-funcion').innerHTML =
        '<div class="chart-placeholder"><div class="placeholder-icon">𝑓</div><p>Presiona <strong>Calcular</strong></p></div>';
    document.getElementById('chart-error').innerHTML =
        '<div class="chart-placeholder"><div class="placeholder-icon">ε</div><p>El gráfico de error aparecerá aquí</p></div>';
    document.getElementById('funcion-display').textContent = 'f(x) = —';
    datosIteraciones = [];
}

// ===== CALCULAR =====
async function calcular() {
    // Normalizar separadores decimales
    ['xl', 'xu', 'tolerancia', 'max_iter'].forEach(id => {
        const el = document.getElementById(id);
        el.value = el.value.replace(',', '.');
    });

    const funcion = document.getElementById('funcion').value.trim();
    const xl = parseFloat(document.getElementById('xl').value);
    const xu = parseFloat(document.getElementById('xu').value);
    const x0 = parseFloat(document.getElementById('x0').value);
    const x0_iq = parseFloat(document.getElementById('x0_iq').value);
    const x1_iq = parseFloat(document.getElementById('x1_iq').value);
    const x2_iq = parseFloat(document.getElementById('x2_iq').value);
    const tolerancia = parseFloat(document.getElementById('tolerancia').value);
    const max_iter = parseInt(document.getElementById('max_iter').value);

    if (!funcion) return mostrarError('Por favor ingresa la función f(x).');

    if (metodoActual === 'biseccion' || metodoActual === 'regla_falsa' || metodoActual === 'razon_dorada') {
        if (isNaN(xl) || isNaN(xu)) return mostrarError('Ingresa valores válidos para x_l y x_u.');
        if (xl >= xu) return mostrarError('x_l debe ser menor que x_u.');
    }

    if (metodoActual === 'newton_raphson' || metodoActual === 'newton_optimo') {
        if (isNaN(x0)) return mostrarError('Ingresa un valor inicial x0 válido.');
    }

    if (metodoActual === 'interpolacion_cuadratica') {
        if (isNaN(x0_iq) || isNaN(x1_iq) || isNaN(x2_iq)) return mostrarError('Ingresa valores válidos para x0, x1 y x2.');
        if (!(x0_iq < x1_iq && x1_iq < x2_iq)) return mostrarError('Debe cumplirse x0 < x1 < x2.');
    }

    let multivariableData = null;
    if (metodoActual === 'busqueda_aleatoria') {
        try {
            const inputMultivariable = document.getElementById('multivariable-vars').value;
            multivariableData = parsearVariablesYRangos(inputMultivariable);
        } catch (err) {
            return mostrarError(err.message);
        }
    }

    ocultarResultado();
    ocultarError();

    const btn = document.querySelector('.btn-calcular');
    btn.innerHTML = '⏳ Calculando...';
    btn.disabled = true;

    try {
        const endpoint = METODOS[metodoActual].endpoint;
        const objetivo = document.getElementById('objetivo').value;
        
        // Construir parámetros según el método
        let params = {
            funcion,
            tolerancia,
            max_iter,
            objetivo
        };

        if (metodoActual === 'interpolacion_cuadratica') {
            params.x0 = x0_iq;
            params.x1 = x1_iq;
            params.x2 = x2_iq;
        } else if (metodoActual === 'biseccion' || metodoActual === 'regla_falsa' || metodoActual === 'razon_dorada') {
            params.xl = xl;
            params.xu = xu;
        } else if (metodoActual === 'busqueda_aleatoria') {
            params.variables = multivariableData.variables;
            params.rangos = multivariableData.rangos;
        } else {
            params.x0 = x0;
        }

        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const data = await resp.json();

        if (data.ok) {
            datosIteraciones = data.iteraciones;
            mostrarResultado(data.raiz, data.total_iteraciones, data.punto);
            llenarTabla(data.iteraciones);
            graficarFuncion(data.grafica_funcion, funcion, data.raiz);
            graficarError(data.grafica_error);
        } else {
            mostrarError(data.error);
        }
    } catch (e) {
        console.error('Error de conexión:', e);
        mostrarError('⚠ Error:\n' + e.message);
    }

    // Restaurar botón con el texto correcto según el método
    if (metodoActual === 'newton_optimo' || metodoActual === 'razon_dorada' || metodoActual === 'interpolacion_cuadratica' || metodoActual === 'busqueda_aleatoria') {
        btn.innerHTML = '<span class="btn-icon">▶</span> Calcular Óptimo';
    } else {
        btn.innerHTML = '<span class="btn-icon">▶</span> Calcular Raíz';
    }
    btn.disabled = false;
}

// ===== TABLA =====
function llenarTabla(iteraciones) {
    const tbody = document.getElementById('tabla-body');
    tbody.innerHTML = '';

    iteraciones.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'anim-in';
        tr.style.animationDelay = `${Math.min(idx * 20, 300)}ms`;

        const errorCell = it.error === '---'
            ? `<td>—</td>`
            : `<td class="${claseError(it.error)}">${Number(it.error).toFixed(6)}%</td>`;

        if (metodoActual === 'biseccion' || metodoActual === 'regla_falsa') {
            tr.innerHTML = `
                <td>${it.iteracion}</td>
                <td>${Number(it.xl).toFixed(8)}</td>
                <td>${Number(it.xu).toFixed(8)}</td>
                <td>${Number(it.xr).toFixed(8)}</td>
                <td>${Number(it.f_xl).toFixed(8)}</td>
                <td>${Number(it.f_xr).toFixed(8)}</td>
                ${errorCell}
            `;
        } else if (metodoActual === 'newton_raphson') {
            tr.innerHTML = `
                <td>${it.iteracion}</td>
                <td>${Number(it.x).toFixed(8)}</td>
                <td>${Number(it.f_x).toFixed(8)}</td>
                <td>${Number(it["f_x'"]).toFixed(8)}</td>
                <td>${Number(it.x_next).toFixed(8)}</td>
                ${errorCell}
            `;
        } else if (metodoActual === 'newton_optimo') {
            tr.innerHTML = `
                <td>${it.iteracion}</td>
                <td>${Number(it.x).toFixed(8)}</td>
                <td>${Number(it["f_x'"]).toFixed(8)}</td>
                <td>${Number(it["f_x''"]).toFixed(8)}</td>
                <td>${Number(it.x_next).toFixed(8)}</td>
                ${errorCell}
            `;
        } else if (metodoActual === 'razon_dorada') {
            const errorValue = it.error === '---' ? '—' : Number(it.error).toFixed(8);
            tr.innerHTML = `
                <td>${it.iteracion}</td>
                <td>${Number(it.xl).toFixed(8)}</td>
                <td>${Number(it.xu).toFixed(8)}</td>
                <td>${Number(it.x1).toFixed(8)}</td>
                <td>${Number(it.x2).toFixed(8)}</td>
                <td>${Number(it.f_x1).toFixed(8)}</td>
                <td>${Number(it.f_x2).toFixed(8)}</td>
                <td>${errorValue}</td>
            `;
        } else if (metodoActual === 'interpolacion_cuadratica') {
            tr.innerHTML = `
                <td>${it.iteracion}</td>
                <td>${Number(it.x0).toFixed(8)}</td>
                <td>${Number(it.x1).toFixed(8)}</td>
                <td>${Number(it.x2).toFixed(8)}</td>
                <td>${Number(it.x3).toFixed(8)}</td>
                <td>${Number(it.f_x0).toFixed(8)}</td>
                <td>${Number(it.f_x1).toFixed(8)}</td>
                <td>${Number(it.f_x2).toFixed(8)}</td>
                <td>${Number(it.f_x3).toFixed(8)}</td>
                <td>${Number(it.error).toFixed(8)}</td>
            `;
        } else if (metodoActual === 'busqueda_aleatoria') {
            const puntoTexto = Object.entries(it.punto || {})
                .map(([k, v]) => `${k}=${Number(v).toFixed(6)}`)
                .join(', ');
            tr.innerHTML = `
                <td>${it.iteracion}</td>
                <td>${puntoTexto || '—'}</td>
                <td>${Number(it.valor_f).toFixed(8)}</td>
            `;
        }
        tbody.appendChild(tr);
    });

    const badge = document.getElementById('iter-count');
    badge.textContent = `${iteraciones.length} iteraciones`;
    badge.classList.remove('hidden');
    document.getElementById('btn-export').classList.remove('hidden');
}

function claseError(error) {
    if (error < 0.01) return 'error-low';
    if (error < 1)    return 'error-med';
    return 'error-high';
}

// ===== GRÁFICA FUNCIÓN =====
function graficarFuncion(datos, expr, raiz) {
    if (datos && datos.tipo === 'surface3d') {
        const vars = Array.isArray(datos.variables) ? datos.variables : ['x', 'y'];
        const puntoOptimo = (datosIteraciones.length && datosIteraciones[datosIteraciones.length - 1].punto)
            ? datosIteraciones[datosIteraciones.length - 1].punto
            : null;

        const xOpt = puntoOptimo ? puntoOptimo[vars[0]] : null;
        const yOpt = puntoOptimo ? puntoOptimo[vars[1]] : null;

        const traces = [
            {
                type: 'surface',
                x: datos.x,
                y: datos.y,
                z: datos.z,
                colorscale: 'Viridis',
                opacity: 0.9,
                name: `f(${vars[0]},${vars[1]})`
            }
        ];

        if (xOpt !== null && yOpt !== null && Number.isFinite(raiz)) {
            traces.push({
                type: 'scatter3d',
                mode: 'markers',
                x: [xOpt],
                y: [yOpt],
                z: [raiz],
                marker: { color: '#4fffb0', size: 5 },
                name: 'Óptimo encontrado'
            });
        }

        const layout = {
            paper_bgcolor: 'transparent',
            margin: { t: 20, b: 10, l: 10, r: 10 },
            scene: {
                xaxis: { title: vars[0], gridcolor: '#1a1e28' },
                yaxis: { title: vars[1], gridcolor: '#1a1e28' },
                zaxis: { title: 'f', gridcolor: '#1a1e28' },
                bgcolor: 'rgba(0,0,0,0)'
            },
            legend: { font: { color: '#8b90a8', size: 11 }, bgcolor: 'transparent' }
        };

        document.getElementById('chart-funcion').innerHTML = '';
        document.getElementById('funcion-display').textContent = `f(${vars[0]}, ${vars[1]}) = ${expr}`;
        const chartLabel = document.querySelector('#chart-funcion').closest('.chart-card').querySelector('.chart-label');
        const optimoIndicator = document.getElementById('optimo-indicator');
        chartLabel.textContent = 'SUPERFICIE 3D DE LA FUNCIÓN';
        optimoIndicator.textContent = 'Visualización 3D (2 variables)';
        Plotly.newPlot('chart-funcion', traces, layout, plotConfig());
        return;
    }

    if (!datos || !Array.isArray(datos.x) || !Array.isArray(datos.y)) {
        document.getElementById('chart-funcion').innerHTML =
            '<div class="chart-placeholder"><div class="placeholder-icon">𝑓</div><p>No hay gráfica 2D para este método multidimensional.</p></div>';
        document.getElementById('funcion-display').textContent = `f(x) = ${expr}`;
        const chartLabel = document.querySelector('#chart-funcion').closest('.chart-card').querySelector('.chart-label');
        const optimoIndicator = document.getElementById('optimo-indicator');
        chartLabel.textContent = 'GRÁFICA DE LA FUNCIÓN';
        optimoIndicator.textContent = '';
        return;
    }

    const layout = layoutBase();
    layout.shapes = [
        { type: 'line', x0: raiz, x1: raiz, y0: 0, y1: 1, yref: 'paper',
          line: { color: '#4fffb0', width: 1.5, dash: 'dash' } },
        { type: 'line', x0: datos.x[0], x1: datos.x[datos.x.length - 1], y0: 0, y1: 0,
          line: { color: '#2d3247', width: 1 } }
    ];

    // Para Newton Óptimo y Razón Dorada, encontrar valor Y del punto óptimo
    let puntoY = 0;
    if (metodoActual === 'newton_optimo' || metodoActual === 'razon_dorada' || metodoActual === 'interpolacion_cuadratica') {
        let minDist = Infinity;
        let closestIndex = 0;
        for (let i = 0; i < datos.x.length; i++) {
            const dist = Math.abs(datos.x[i] - raiz);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        }
        puntoY = datos.y[closestIndex];
    }

    const traces = [
        { x: datos.x, y: datos.y, type: 'scatter', mode: 'lines',
          name: `f(x) = ${expr}`,
          line: { color: '#7c6af5', width: 2.5 }, connectgaps: false },
        { x: [raiz], y: [puntoY], type: 'scatter', mode: 'markers',
          name: (metodoActual === 'newton_optimo' || metodoActual === 'razon_dorada' || metodoActual === 'interpolacion_cuadratica')
              ? `Punto óptimo ≈ ${Number(raiz).toFixed(6)}`
              : `Raíz ≈ ${Number(raiz).toFixed(6)}`,
          marker: { color: '#4fffb0', size: 10, symbol: 'circle',
                    line: { color: '#0d0f14', width: 2 } } }
    ];

    document.getElementById('chart-funcion').innerHTML = '';
    document.getElementById('funcion-display').textContent = `f(x) = ${expr}`;
    const chartLabel = document.querySelector('#chart-funcion').closest('.chart-card').querySelector('.chart-label');
    const optimoIndicator = document.getElementById('optimo-indicator');

    if (metodoActual === 'newton_optimo') {
        chartLabel.textContent = 'GRÁFICA DE LA FUNCIÓN - PUNTO ÓPTIMO';
        optimoIndicator.textContent = 'Óptimo detectado: punto crítico (f\'\' señal).';
    } else if (metodoActual === 'razon_dorada') {
        chartLabel.textContent = 'GRÁFICA DE LA FUNCIÓN - PUNTO ÓPTIMO';
        const objetivo = document.getElementById('objetivo').value;
        optimoIndicator.textContent = `Óptimo ${objetivo === 'max' ? 'máximo' : 'mínimo'} en intervalo ${objetivo === 'max' ? 'mayor' : 'menor'}`;
    } else if (metodoActual === 'interpolacion_cuadratica') {
        chartLabel.textContent = 'GRÁFICA DE LA FUNCIÓN - PUNTO ÓPTIMO';
        const objetivo = document.getElementById('objetivo').value;
        optimoIndicator.textContent = `Óptimo ${objetivo === 'max' ? 'máximo' : 'mínimo'} por parábola interpolada`;
    } else {
        chartLabel.textContent = 'GRÁFICA DE LA FUNCIÓN';
        optimoIndicator.textContent = '';
    }

    Plotly.newPlot('chart-funcion', traces, layout, plotConfig());
}

// ===== GRÁFICA ERROR =====
function graficarError(datos) {
    if (!datos || !Array.isArray(datos.iteraciones) || !datos.iteraciones.length) {
        document.getElementById('chart-error').innerHTML =
            '<div class="chart-placeholder"><div class="placeholder-icon">ε</div><p>No hay curva de error para este método.</p></div>';
        return;
    }
    const trace = {
        x: datos.iteraciones, y: datos.errores,
        type: 'scatter', mode: 'lines+markers',
        name: 'Error relativo (%)',
        line: { color: '#ff6b6b', width: 2 },
        marker: { color: '#ff6b6b', size: 6 },
        fill: 'tozeroy', fillcolor: 'rgba(255,107,107,0.06)'
    };
    const layout = layoutBase();
    layout.yaxis.type = 'log';
    layout.yaxis.title = { text: 'Error (%) — log', font: { size: 10 } };

    document.getElementById('chart-error').innerHTML = '';
    Plotly.newPlot('chart-error', [trace], layout, plotConfig());
}

// ===== PLOTLY HELPERS =====
function layoutBase() {
    return {
        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
        margin: { t: 20, b: 50, l: 60, r: 20 },
        font: { family: 'JetBrains Mono, monospace', color: '#8b90a8', size: 11 },
        xaxis: { gridcolor: '#1a1e28', zerolinecolor: '#2d3247',
                 tickfont: { color: '#5a6080' }, linecolor: '#232736' },
        yaxis: { gridcolor: '#1a1e28', zerolinecolor: '#2d3247',
                 tickfont: { color: '#5a6080' }, linecolor: '#232736' },
        legend: { font: { color: '#8b90a8', size: 11 }, bgcolor: 'transparent' },
        hoverlabel: { bgcolor: '#13161e', bordercolor: '#2d3247',
                      font: { family: 'JetBrains Mono, monospace', size: 12 } }
    };
}
function plotConfig() {
    return { displayModeBar: false, responsive: true };
}

// ===== UI HELPERS =====
function mostrarResultado(raiz, iters, punto = null) {
    const esMetodoOptimizacion = metodoActual === 'newton_optimo' || metodoActual === 'razon_dorada' || metodoActual === 'interpolacion_cuadratica' || metodoActual === 'busqueda_aleatoria';
    const label = esMetodoOptimizacion ? 'Punto óptimo' : 'Raíz aproximada';
    document.getElementById('resultado-label').textContent = label;
    document.getElementById('resultado-valor').textContent = Number(raiz).toFixed(10);
    if (metodoActual === 'busqueda_aleatoria' && punto && typeof punto === 'object') {
        const puntoTexto = Object.entries(punto)
            .map(([k, v]) => `${k}=${Number(v).toFixed(6)}`)
            .join(', ');
        document.getElementById('resultado-iters').textContent = `${iters} iteración${iters !== 1 ? 'es' : ''} · (${puntoTexto})`;
    } else {
        document.getElementById('resultado-iters').textContent = `${iters} iteración${iters !== 1 ? 'es' : ''}`;
    }
    document.getElementById('resultado-box').classList.remove('hidden');
}
function ocultarResultado() { document.getElementById('resultado-box').classList.add('hidden'); }
function mostrarError(msg) {
    document.getElementById('error-msg').textContent = msg;
    document.getElementById('error-box').classList.remove('hidden');
}
function ocultarError() { document.getElementById('error-box').classList.add('hidden'); }

// ===== EXPORTAR CSV =====
function exportarCSV() {
    if (!datosIteraciones.length) return;
    const headers = ['Iteracion', 'xl', 'xu', 'xr', 'f(xl)', 'f(xr)', 'Error(%)'];
    const filas = datosIteraciones.map(it =>
        [it.iteracion, it.xl, it.xu, it.xr, it.f_xl, it.f_xr,
         it.error === '---' ? '' : it.error].join(',')
    );
    const csv = [headers.join(','), ...filas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${metodoActual}_iteraciones.csv`;
    a.click();
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', () => {
    cambiarMetodo('biseccion');
    // Activar nav item de biseccion sin evento de click real
    document.querySelectorAll('.nav-item:not(.soon)')[0].classList.add('active');
});

document.addEventListener('keydown', e => {
    if (e.key === 'Enter') calcular();
});
