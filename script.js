let chartRosca, chartBarras, chartEvolucao;

const coresEvolucao = ['#2ca02c', '#40c057', '#1f77b4', '#f6ad55', '#d62728'];

// --- FUNÇÃO DE TROCA DE TEMA (Ajustada para o Checkbox) ---
function toggleTheme() {
    const body = document.body;
    const isDark = document.getElementById('theme-checkbox').checked;
    
    if (isDark) {
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
    
    atualizarCoresGraficos();
}

function atualizarCoresGraficos() {
    const isDark = document.body.classList.contains('dark-theme');
    const corTexto = isDark ? '#cbd5e0' : '#4a5568';
    const corGrid = isDark ? '#4a5568' : '#edf2f7';

    if (chartBarras) {
        chartBarras.options.scales.x.ticks.color = corTexto;
        chartBarras.options.scales.y.ticks.color = corTexto;
        chartBarras.options.scales.y.grid.color = corGrid;
        chartBarras.update();
    }

    if (chartEvolucao) {
        chartEvolucao.options.scales.x.ticks.color = corTexto;
        chartEvolucao.options.scales.y.ticks.color = corTexto;
        chartEvolucao.options.scales.y.grid.color = corGrid;
        chartEvolucao.update();
    }
}

// Plugin: Valores em cima das barras
const valoresEmCimaPlugin = {
    id: 'valoresEmCima',
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        const isDark = document.body.classList.contains('dark-theme');
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = isDark ? '#f7fafc' : '#333';
        ctx.textAlign = 'center';
        chart.getDatasetMeta(0).data.forEach((bar, index) => {
            const valor = data.datasets[0].data[index];
            ctx.fillText(valor.toFixed(2), bar.x, bar.y - 8);
        });
        ctx.restore();
    }
};

// Plugin: Valores no fim das linhas do gráfico de evolução
const valoresFimDaLinhaPlugin = {
    id: 'valoresFimDaLinha',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                const lastPoint = meta.data[meta.data.length - 1];
                ctx.fillStyle = dataset.borderColor;
                ctx.fillText(dataset.data[dataset.data.length - 1].toFixed(1).replace('.', ','), lastPoint.x + 10, lastPoint.y + 4);
            }
        });
        ctx.restore();
    }
};

function calcularMediaGlobal() {
    const todasAsNotas = [...dadosSemestre1, ...dadosSemestre2];
    const soma = todasAsNotas.reduce((acc, item) => acc + item.media, 0);
    return (soma / todasAsNotas.length).toFixed(2);
}

// --- FUNÇÃO: Atualiza o texto de destaque dinamicamente ---
function atualizarTextoDestaque(dados) {
    const melhorDisciplina = dados.reduce((prev, current) => (prev.media > current.media) ? prev : current);
    const pioresDisciplinas = dados.filter(d => d.media < 7.0);
    
    const destaqueP = document.getElementById('destaque-texto');
    const alertaP = document.getElementById('alerta-texto');
    
    destaqueP.innerHTML = `Melhores resultados em <strong>${melhorDisciplina.disciplina}</strong>.`;
    
    if (pioresDisciplinas.length > 0) {
        const nomesPiores = pioresDisciplinas.map(d => d.disciplina).join(' e ');
        alertaP.innerHTML = `Atenção às disciplinas de <strong>${nomesPiores}</strong>.`;
        alertaP.style.display = 'block';
    } else {
        alertaP.style.display = 'none';
    }
}

function renderizarDashboard(dadosAcademicos, semestreTexto, btnClicado) {
    document.getElementById('media-global-topo').innerText = calcularMediaGlobal();

    const mediaGeral = (dadosAcademicos.reduce((acc, item) => acc + item.media, 0) / dadosAcademicos.length).toFixed(2);
    const acima = dadosAcademicos.filter(d => d.media >= 7.0).length;
    const atencao = dadosAcademicos.filter(d => d.media >= 5.0 && d.media < 7.0).length;
    const abaixo = dadosAcademicos.filter(d => d.media < 7.0).length; 
    const total = dadosAcademicos.length;

    document.getElementById('media-geral-topo').innerText = mediaGeral;
    document.getElementById('acima-topo').innerText = acima;
    document.getElementById('abaixo-topo').innerText = abaixo;
    document.querySelector('#texto-semestre').innerText = semestreTexto;
    
    // Atualiza o título do gráfico de barras com a média
    const semestreAbreviado = semestreTexto.includes('1') ? '1º SEM' : '2º SEM';
    document.getElementById('titulo-media-barras').innerText = `| MÉDIA DO ${semestreAbreviado}: ${mediaGeral}`;

    document.getElementById('total-disciplinas').innerText = total;
    document.getElementById('legenda-acima').innerText = `${acima} disciplinas (${Math.round((acima/total)*100)}%)`;
    document.getElementById('legenda-atencao').innerText = `${atencao} disciplinas (${Math.round((atencao/total)*100)}%)`;
    document.getElementById('legenda-abaixo').innerText = `${abaixo} disciplinas (${Math.round((abaixo/total)*100)}%)`;

    atualizarTextoDestaque(dadosAcademicos);

    if (btnClicado) {
        document.querySelectorAll('.btn-semestre').forEach(btn => btn.classList.remove('ativo'));
        btnClicado.classList.add('ativo');
    }

    // Tabela
    const tbody = document.querySelector('#tabela-notas tbody');
    tbody.innerHTML = ''; 
    dadosAcademicos.forEach(item => {
        const tr = document.createElement('tr');
        const statusClass = item.media >= 7.0 ? 'status-acima' : 'status-abaixo';
        const statusTexto = item.media >= 7.0 ? 'Acima da Média' : 'Abaixo da Média';
        tr.innerHTML = `
            <td>${item.disciplina}</td>
            <td style="text-align: center; font-weight: bold;">${item.media.toFixed(2)}</td>
            <td class="${statusClass}">${statusTexto}</td>
        `;
        tbody.appendChild(tr);
    });

    const isDark = document.body.classList.contains('dark-theme');
    const corTexto = isDark ? '#cbd5e0' : '#4a5568';
    const corGrid = isDark ? '#4a5568' : '#edf2f7';

    // Rosca
    if (chartRosca) chartRosca.destroy(); 
    const ctxRosca = document.getElementById('graficoRosca').getContext('2d');
    chartRosca = new Chart(ctxRosca, {
        type: 'doughnut',
        data: {
            labels: ['Acima', 'Atenção', 'Abaixo'],
            datasets: [{ data: [acima, atencao, abaixo], backgroundColor: ['#2ca02c', '#f6ad55', '#d62728'], borderWidth: 0 }]
        },
        options: { cutout: '75%', plugins: { legend: { display: false } } }
    });

    // Barras
    if (chartBarras) chartBarras.destroy();
    const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
    
    const linhaMediaPlugin = {
        id: 'linhaMedia',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            const yAxis = chart.scales.y;
            const yPos = yAxis.getPixelForValue(mediaGeral);
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(chart.chartArea.left, yPos);
            ctx.lineTo(chart.chartArea.right, yPos);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = corTexto;
            ctx.stroke();
            ctx.restore();
        }
    };

    chartBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
            labels: dadosAcademicos.map(d => d.disciplina),
            datasets: [{
                data: dadosAcademicos.map(d => d.media),
                backgroundColor: dadosAcademicos.map(d => d.media >= 7.0 ? '#2ca02c' : '#d62728'),
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        plugins: [linhaMediaPlugin, valoresEmCimaPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 20 } },
            scales: {
                y: { beginAtZero: true, max: 10, grid: { color: corGrid }, ticks: { color: corTexto } },
                x: { grid: { display: false }, ticks: { color: corTexto } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Evolução
    if (chartEvolucao) chartEvolucao.destroy();
    const ctxEvolucao = document.getElementById('graficoEvolucao').getContext('2d');
    
    const datasetsEvolucao = dadosAcademicos.map((d, index) => {
        return {
            label: d.disciplina,
            data: [d.u1u2, d.u3, d.geral],
            borderColor: coresEvolucao[index % coresEvolucao.length],
            backgroundColor: coresEvolucao[index % coresEvolucao.length],
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.1
        };
    });

    chartEvolucao = new Chart(ctxEvolucao, {
        type: 'line',
        data: {
            labels: ['U1 e U2', 'U3', 'GERAL'],
            datasets: datasetsEvolucao
        },
        plugins: [valoresFimDaLinhaPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { right: 30, top: 10 } },
            scales: {
                y: { beginAtZero: true, max: 10, grid: { color: corGrid }, ticks: { color: corTexto } },
                x: { grid: { display: false }, ticks: { color: corTexto } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Legenda Evolução
    const legendaContainer = document.getElementById('legenda-evolucao');
    legendaContainer.innerHTML = '';
    dadosAcademicos.forEach((d, index) => {
        const cor = coresEvolucao[index % coresEvolucao.length];
        legendaContainer.innerHTML += `
            <div class="legenda-linha">
                <span class="linha-cor" style="background-color: ${cor};"></span>
                <span>${d.disciplina}</span>
            </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se o tema escuro já estava salvo antes de renderizar
    if (localStorage.getItem('theme') === 'dark') {
        document.getElementById('theme-checkbox').checked = true;
        document.body.classList.add('dark-theme');
    }

    renderizarDashboard(dadosSemestre2, "SEMESTRE 2 - 2026/2");
});