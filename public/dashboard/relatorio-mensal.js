// Variáveis globais
let campanhasData = [];
let performanceChart = null;
let mesAtual = new Date();

// Função para formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função para formatar data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Função para obter campanhas
async function obterCampanhas() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/public/campaign', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao carregar campanhas');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao obter campanhas:', error);
        throw error;
    }
}

// Função para obter valores de uma campanha
async function obterValoresCampanha(campaignId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/public/campaign-value?campaignId=${campaignId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao carregar valores da campanha');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao obter valores da campanha:', error);
        return [];
    }
}

// Função para obter clientes
async function obterClientes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://45.172.160.51:4000/public/client', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao obter clientes:', error);
        return [];
    }
}

// Função para carregar dados do relatório
async function carregarRelatorio() {
    try {
        // Mostrar loading
        document.getElementById('campanhasTableBody').innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2 text-muted">Carregando campanhas...</p>
                </td>
            </tr>
        `;

        // Obter campanhas
        const campanhas = await obterCampanhas();
        
        // Filtrar campanhas por mês/ano
        const mesAno = document.getElementById('mesAno').value;
        const statusFiltro = document.getElementById('statusFiltro').value;
        const clienteFiltro = document.getElementById('clienteFiltro').value;
        
        let campanhasFiltradas = campanhas;
        
        // Filtrar por mês/ano
        if (mesAno) {
            const [ano, mes] = mesAno.split('-');
            campanhasFiltradas = campanhasFiltradas.filter(campanha => {
                const dataCampanha = new Date(campanha.created_at);
                return dataCampanha.getFullYear() == ano && (dataCampanha.getMonth() + 1) == mes;
            });
        }
        
        // Filtrar por status
        if (statusFiltro) {
            campanhasFiltradas = campanhasFiltradas.filter(campanha => campanha.status === statusFiltro);
        }
        
        // Filtrar por cliente
        if (clienteFiltro) {
            campanhasFiltradas = campanhasFiltradas.filter(campanha => campanha.client_id == clienteFiltro);
        }
        
        // Processar dados das campanhas
        const dadosProcessados = await processarDadosCampanhas(campanhasFiltradas);
        
        // Atualizar interface
        atualizarResumoGeral(dadosProcessados);
        atualizarTabelaCampanhas(dadosProcessados);
        atualizarGrafico(dadosProcessados);
        
        campanhasData = dadosProcessados;
        
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        document.getElementById('campanhasTableBody').innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="alert alert-danger" role="alert">
                        Erro ao carregar relatório: ${error.message}
                    </div>
                </td>
            </tr>
        `;
    }
}

// Função para processar dados das campanhas
async function processarDadosCampanhas(campanhas) {
    const dadosProcessados = [];
    
    for (const campanha of campanhas) {
        try {
            // Obter valores da campanha
            const valores = await obterValoresCampanha(campanha.id);
            
            // Calcular totais
            const valorCampanha = parseFloat(campanha.value) || 0;
            const entradas = valores.filter(v => v.type === 'ENTRADA').reduce((sum, v) => sum + parseFloat(v.value), 0);
            const saidas = valores.filter(v => v.type === 'SAIDA').reduce((sum, v) => sum + parseFloat(v.value), 0);
            const lucro = valorCampanha + entradas - saidas;
            const investimentoTotal = valorCampanha + saidas;
            const roi = investimentoTotal > 0 ? ((lucro / investimentoTotal) * 100) : 0;
            
            dadosProcessados.push({
                ...campanha,
                valorCampanha,
                entradas,
                saidas,
                lucro,
                roi,
                investimentoTotal
            });
            
        } catch (error) {
            console.error(`Erro ao processar campanha ${campanha.id}:`, error);
            // Adicionar campanha com valores zerados em caso de erro
            dadosProcessados.push({
                ...campanha,
                valorCampanha: parseFloat(campanha.value) || 0,
                entradas: 0,
                saidas: 0,
                lucro: parseFloat(campanha.value) || 0,
                roi: 0,
                investimentoTotal: parseFloat(campanha.value) || 0
            });
        }
    }
    
    return dadosProcessados;
}

// Função para atualizar resumo geral
function atualizarResumoGeral(dados) {
    const totalCampanhas = dados.length;
    const totalInvestimento = dados.reduce((sum, c) => sum + c.investimentoTotal, 0);
    const totalEntradas = dados.reduce((sum, c) => sum + c.entradas, 0);
    const lucroTotal = dados.reduce((sum, c) => sum + c.lucro, 0);
    
    document.getElementById('totalCampanhas').textContent = totalCampanhas;
    document.getElementById('totalInvestimento').textContent = formatarMoeda(totalInvestimento);
    document.getElementById('totalEntradas').textContent = formatarMoeda(totalEntradas);
    document.getElementById('lucroTotal').textContent = formatarMoeda(lucroTotal);
    document.getElementById('lucroTotal').className = lucroTotal >= 0 ? 'mt-2 text-success' : 'mt-2 text-danger';
}

// Função para atualizar tabela de campanhas
function atualizarTabelaCampanhas(dados) {
    const tbody = document.getElementById('campanhasTableBody');
    const contador = document.getElementById('contadorCampanhas');
    
    contador.textContent = `${dados.length} campanhas`;
    
    if (dados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-inbox fs-1"></i>
                        <p class="mt-2">Nenhuma campanha encontrada para os filtros selecionados.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const html = dados.map(campanha => {
        const statusClass = getStatusClass(campanha.status);
        const roiClass = campanha.roi >= 0 ? 'text-success' : 'text-danger';
        const lucroClass = campanha.lucro >= 0 ? 'text-success' : 'text-danger';
        
        return `
            <tr>
                <td>
                    <div>
                        <strong>${campanha.name}</strong>
                        <br>
                        <small class="text-muted">${formatarData(campanha.created_at)}</small>
                    </div>
                </td>
                <td>${campanha.client_name || 'N/A'}</td>
                <td><span class="badge ${statusClass}">${campanha.status}</span></td>
                <td>${formatarMoeda(campanha.valorCampanha)}</td>
                <td class="text-success">${formatarMoeda(campanha.entradas)}</td>
                <td class="text-danger">${formatarMoeda(campanha.saidas)}</td>
                <td class="${lucroClass} fw-bold">${formatarMoeda(campanha.lucro)}</td>
                <td class="${roiClass} fw-bold">${campanha.roi.toFixed(2)}%</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetalhesCampanha(${campanha.id})" title="Ver Detalhes">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = html;
}

// Função para obter classe CSS do status
function getStatusClass(status) {
    switch(status) {
        case 'ATIVO': return 'bg-success';
        case 'PAUSADO': return 'bg-warning';
        case 'FINALIZADO': return 'bg-secondary';
        default: return 'bg-primary';
    }
}

// Função para atualizar gráfico
function atualizarGrafico(dados) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Agrupar dados por status
    const statusData = dados.reduce((acc, campanha) => {
        if (!acc[campanha.status]) {
            acc[campanha.status] = { count: 0, lucro: 0 };
        }
        acc[campanha.status].count++;
        acc[campanha.status].lucro += campanha.lucro;
        return acc;
    }, {});
    
    const labels = Object.keys(statusData);
    const lucros = Object.values(statusData).map(data => data.lucro);
    const counts = Object.values(statusData).map(data => data.count);
    
    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Lucro Total (R$)',
                data: lucros,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                yAxisID: 'y'
            }, {
                label: 'Quantidade de Campanhas',
                data: counts,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Lucro (R$)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Quantidade'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Performance por Status de Campanha'
                }
            }
        }
    });
}

// Função para carregar clientes no filtro
async function carregarClientesFiltro() {
    try {
        const clientes = await obterClientes();
        const select = document.getElementById('clienteFiltro');
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função para ver detalhes da campanha
function verDetalhesCampanha(campaignId) {
    window.open(`campaigns.html?id=${campaignId}`, '_blank');
}

// Função para exportar relatório
function exportarRelatorio() {
    try {
        const mesAno = document.getElementById('mesAno').value || 'Todos os períodos';
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        // Calcular totais
        const totalCampanhas = campanhasData.length;
        const totalInvestimento = campanhasData.reduce((sum, c) => sum + c.investimentoTotal, 0);
        const totalEntradas = campanhasData.reduce((sum, c) => sum + c.entradas, 0);
        const lucroTotal = campanhasData.reduce((sum, c) => sum + c.lucro, 0);
        
        // Criar conteúdo do relatório
        let conteudo = `
RELATÓRIO MENSAL DE CAMPANHAS
Período: ${mesAno}
Data de Geração: ${dataAtual}

=== RESUMO GERAL ===
Total de Campanhas: ${totalCampanhas}
Total Investido: ${formatarMoeda(totalInvestimento)}
Total de Entradas: ${formatarMoeda(totalEntradas)}
Lucro Total: ${formatarMoeda(lucroTotal)}
ROI Médio: ${totalInvestimento > 0 ? ((lucroTotal / totalInvestimento) * 100).toFixed(2) : 0}%

=== DETALHAMENTO POR CAMPANHA ===
`;
        
        // Adicionar detalhes de cada campanha
        campanhasData.forEach(campanha => {
            conteudo += `
${campanha.name}
`;
            conteudo += `Cliente: ${campanha.client_name || 'N/A'}
`;
            conteudo += `Status: ${campanha.status}
`;
            conteudo += `Valor Inicial: ${formatarMoeda(campanha.valorCampanha)}
`;
            conteudo += `Entradas: ${formatarMoeda(campanha.entradas)}
`;
            conteudo += `Saídas: ${formatarMoeda(campanha.saidas)}
`;
            conteudo += `Lucro: ${formatarMoeda(campanha.lucro)}
`;
            conteudo += `ROI: ${campanha.roi.toFixed(2)}%
`;
            conteudo += `Data de Criação: ${formatarData(campanha.created_at)}
`;
            conteudo += `${'='.repeat(50)}
`;
        });
        
        // Criar e baixar arquivo
        const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_mensal_${mesAno.replace('-', '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        mostrarAlerta('Erro ao exportar relatório: ' + error.message, 'danger');
    }
}

// Função para mostrar alertas
function mostrarAlerta(mensagem, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Função para navegar entre meses
function navegarMes(direcao) {
    mesAtual.setMonth(mesAtual.getMonth() + direcao);
    const mesAnoFormatado = mesAtual.toISOString().slice(0, 7);
    document.getElementById('mesAno').value = mesAnoFormatado;
    carregarRelatorio();
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Definir mês atual como padrão
    const agora = new Date();
    const mesAnoAtual = agora.toISOString().slice(0, 7);
    document.getElementById('mesAno').value = mesAnoAtual;
    
    // Event listeners
    document.getElementById('btnFiltrar').addEventListener('click', carregarRelatorio);
    document.getElementById('btnExportarRelatorio').addEventListener('click', exportarRelatorio);
    document.getElementById('btnMesAnterior').addEventListener('click', () => navegarMes(-1));
    document.getElementById('btnProximoMes').addEventListener('click', () => navegarMes(1));
    
    // Carregar dados iniciais
    carregarClientesFiltro();
    carregarRelatorio();
});