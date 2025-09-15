// ===== VARIÁVEIS GLOBAIS =====
console.log('=== CARREGANDO CAMPAIGNS.JS ===');
const token = localStorage.getItem('token');
const userName = localStorage.getItem('usuarioName');
let campaignsContainer;
let valuesContainer;
let alertContainer;
let clients = [];

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
console.log('Token encontrado:', !!token);
if (!token) {
    console.log('Redirecionando para login - token não encontrado');
    window.location.href = "/";
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticação
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar elementos DOM
    campaignsContainer = document.getElementById('campaignsContainer');
    valuesContainer = document.getElementById('valuesContainer');
    alertContainer = document.getElementById('alertContainer');
    
    console.log('Elementos DOM inicializados:', {
        campaignsContainer: !!campaignsContainer,
        valuesContainer: !!valuesContainer,
        alertContainer: !!alertContainer
    });

    // Carregar nome do usuário
    console.log('userName do localStorage:', userName);
    const userNameElement = document.getElementById('userName');
    console.log('Elemento userName encontrado:', userNameElement);
    if (userName && userNameElement) {
        userNameElement.textContent = userName;
        console.log('Nome do usuário definido:', userName);
    } else {
        console.log('userName não encontrado no localStorage ou elemento não existe');
    }

    // Definir link ativo na sidebar
    setActiveSidebarLink();

    // Anexar evento de logout
    document.getElementById('logoutBtnSidebar').addEventListener('click', handleLogout);

    // Inicializar tema escuro se necessário
    initDarkMode();
    
    // Inicializar totalPaidValues para evitar NaN
    const totalPaidElement = document.getElementById('totalPaidValues');
    if (totalPaidElement) {
        totalPaidElement.textContent = 'R$ 0,00';
        console.log('totalPaidValues inicializado no DOM: R$ 0,00');
    }
    
    // A inicialização da sidebar agora é feita pelo modern-dashboard.js

    // Carregar dados com delay para garantir que DOM esteja pronto
    setTimeout(async () => {
        console.log('Iniciando carregamento sequencial dos dados...');
        await carregarClientes();
        console.log('Clientes carregados, agora carregando campanhas...');
        await carregarCampanhas();
        console.log('Campanhas carregadas, agora carregando estatísticas...');
        await carregarEstatisticas();
        console.log('Todos os dados carregados!');
    }, 100);

    // Configurar eventos dos botões
    configurarEventosBotoes();
    
    // Configurar filtros
    configurarFiltros();
});

// ===== FUNÇÕES DE INICIALIZAÇÃO =====

// Função para inicializar o tema escuro
function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    
    // Verificar preferência salva
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
    
    // Adicionar evento de alteração
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });
}

// Função initMobileSidebar removida - agora é gerenciada pelo modern-dashboard.js

// Função para definir o link ativo na sidebar
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Função para lidar com o logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioName');
    window.location.href = 'login.html';
}

// ===== FUNÇÕES DE CARREGAMENTO DE DADOS =====

// Função para carregar clientes
async function carregarClientes() {
    try {
        console.log('Fazendo requisição para:', 'http://45.172.160.51:4000/public/client');
        
        const response = await fetch('http://45.172.160.51:4000/public/client', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            
            // Se for erro de autenticação (401) ou token inválido
            if (response.status === 401 || errorText.includes('invalid signature') || errorText.includes('Token inválido')) {
                console.log('Token inválido detectado, redirecionando para login');
                localStorage.removeItem('token');
                localStorage.removeItem('usuarioName');
                mostrarAlerta('Sessão expirada. Redirecionando para login...', 'warning');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                return;
            }
            
            throw new Error(`Erro ao carregar clientes: ${response.status} - ${errorText}`);
        }

        const clientes = await response.json();
        console.log('Dados recebidos da API:', clientes);
        console.log('Tipo dos dados:', typeof clientes, 'É array:', Array.isArray(clientes));

        // Verificar se há clientes
        if (!Array.isArray(clientes) || clientes.length === 0) {
            console.log('Nenhum cliente encontrado');
            clients = [];
        } else {
            clients = clientes;
            console.log('Clientes carregados:', clients.length);
            if (clients.length > 0) {
                console.log('Primeiro cliente:', clients[0]);
                console.log('Propriedades do primeiro cliente:', Object.keys(clients[0]));
            }
        }
        
        // Preencher selects de clientes
        preencherSelectClientes();
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = 'Erro desconhecido';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Erro de conexão com o servidor. Verifique se o servidor está rodando.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        mostrarAlerta('Erro ao carregar clientes: ' + errorMessage, 'danger');
        clients = [];
    }
}

// Função para preencher selects de clientes
function preencherSelectClientes() {
    console.log('Preenchendo selects de clientes...');
    console.log('Número de clientes disponíveis:', clients.length);
    
    const selectCampaign = document.getElementById('campaignClient');
    const selectEdit = document.getElementById('editCampaignClient');
    
    console.log('Select campaignClient encontrado:', !!selectCampaign);
    console.log('Select editCampaignClient encontrado:', !!selectEdit);
    
    if (selectCampaign) {
        selectCampaign.innerHTML = '<option value="">Selecione um cliente</option>';
        
        if (clients && clients.length > 0) {
            clients.forEach((client, index) => {
                console.log(`Cliente ${index}:`, client);
                const clientName = client.name || client.nome || client.razao_social || client.email || `Cliente ${client.id}`;
                const clientId = client.id || client.cliente_id;
                const option = `<option value="${clientId}">${clientName}</option>`;
                console.log(`Adicionando opção: ${option}`);
                selectCampaign.innerHTML += option;
            });
            console.log('Select campaignClient preenchido com sucesso');
        } else {
            console.log('Nenhum cliente disponível para preencher o select');
        }
    }
    
    if (selectEdit) {
        selectEdit.innerHTML = '<option value="">Selecione um cliente</option>';
        
        if (clients && clients.length > 0) {
            clients.forEach(client => {
                const clientName = client.name || client.nome || client.razao_social || client.email || `Cliente ${client.id}`;
                const clientId = client.id || client.cliente_id;
                selectEdit.innerHTML += `<option value="${clientId}">${clientName}</option>`;
            });
        }
    }
}

// Função para formatar moeda
function formatarMoeda(valor) {
    console.log('formatarMoeda chamada com valor:', valor, 'tipo:', typeof valor);
    
    // Validar se o valor é um número válido
    if (valor === null || valor === undefined || isNaN(valor)) {
        console.log('Valor inválido detectado, usando 0');
        valor = 0;
    }
    
    // Converter para número se for string
    if (typeof valor === 'string') {
        valor = parseFloat(valor) || 0;
        console.log('Valor convertido de string:', valor);
    }
    
    // Garantia final contra NaN
    if (isNaN(valor)) {
        console.warn('Valor ainda é NaN após validações, forçando para 0');
        valor = 0;
    }
    
    const resultado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
    
    console.log('Resultado formatado:', resultado);
    return resultado;
}

// Função para carregar estatísticas
async function carregarEstatisticas() {
    try {
        // Forçar valor inicial para evitar NaN
        const totalPaidElement = document.getElementById('totalPaidValues');
        if (totalPaidElement) {
            totalPaidElement.textContent = 'R$ 0,00';
            console.log('Valor inicial forçado para totalPaidValues: R$ 0,00');
        }
        
        // Carregar todas as campanhas para calcular estatísticas
        const campanhas = await obterTodasCampanhas();
        
        // Total de campanhas
        document.getElementById('totalCampaigns').textContent = campanhas.length || 0;
        
        // Campanhas ativas
        const agora = new Date();
        const campanhasAtivas = campanhas.filter(campanha => {
            const inicio = new Date(campanha.startDate);
            const fim = new Date(campanha.endDate);
            return campanha.active && inicio <= agora && agora <= fim;
        });
        document.getElementById('activeCampaigns').textContent = campanhasAtivas.length || 0;
        
        // Campanhas agendadas (futuras)
        const campanhasAgendadas = campanhas.filter(campanha => {
            const inicio = new Date(campanha.startDate);
            return campanha.active && inicio > agora;
        });
        document.getElementById('scheduledCampaigns').textContent = campanhasAgendadas.length || 0;
        
        // Calcular valores pagos (campanhas com status PAGO)
        let valoresPagos = 0;
        console.log('=== DEBUG VALORES PAGOS ===');
        console.log('Total de campanhas:', campanhas.length);
        
        for (const campanha of campanhas) {
            console.log('Verificando campanha:', campanha.id, 'Status pagamento:', campanha.paymentStatus, 'Valor:', campanha.value);
            if (campanha.paymentStatus === 'PAGO' && campanha.value) {
                const valorCampanha = parseFloat(campanha.value);
                console.log('Valor parseado:', valorCampanha, 'É NaN?', isNaN(valorCampanha));
                if (!isNaN(valorCampanha)) {
                    valoresPagos += valorCampanha;
                    console.log('Valor adicionado. Total atual:', valoresPagos);
                } else {
                    console.warn('Valor inválido na campanha:', campanha.id, 'valor:', campanha.value);
                }
            }
        }
        
        console.log('Valores pagos antes da verificação:', valoresPagos);
        // Garantir que valoresPagos seja sempre um número válido
        if (isNaN(valoresPagos) || valoresPagos === null || valoresPagos === undefined) {
            console.warn('valoresPagos era inválido, definindo como 0');
            valoresPagos = 0;
        }
        
        console.log('Valores pagos final:', valoresPagos);
        const valorFormatado = formatarMoeda(valoresPagos);
        console.log('Valor formatado:', valorFormatado);
        
        // Verificação final contra NaN no valor formatado
        if (valorFormatado && !valorFormatado.includes('NaN')) {
            document.getElementById('totalPaidValues').textContent = valorFormatado;
            console.log('Valor definido com sucesso:', valorFormatado);
        } else {
            document.getElementById('totalPaidValues').textContent = 'R$ 0,00';
            console.warn('Valor formatado continha NaN, usando R$ 0,00');
        }
        console.log('=== FIM DEBUG VALORES PAGOS ===');
        
    } catch (error) {
        console.error('=== ERRO NA FUNÇÃO carregarEstatisticas ===');
        console.error('Erro ao carregar estatísticas:', error);
        console.error('Stack trace:', error.stack);
        // Definir valores padrão em caso de erro
        document.getElementById('totalCampaigns').textContent = '0';
        document.getElementById('activeCampaigns').textContent = '0';
        document.getElementById('scheduledCampaigns').textContent = '0';
        
        // Garantir que totalPaidValues nunca seja NaN, mesmo em erro
        const totalPaidElement = document.getElementById('totalPaidValues');
        if (totalPaidElement) {
            totalPaidElement.textContent = 'R$ 0,00';
            console.log('totalPaidValues forçado para R$ 0,00 no catch');
        }
        console.log('Valores padrão definidos devido ao erro');
    }
}

// Função auxiliar para obter todas as campanhas
async function obterTodasCampanhas() {
    console.log('=== FUNÇÃO obterTodasCampanhas CHAMADA ===');
    console.log('Número de clientes disponíveis:', clients.length);
    console.log('Clientes:', clients);
    
    const campanhas = [];
    
    if (clients.length === 0) {
        console.warn('Nenhum cliente disponível para buscar campanhas!');
        return campanhas;
    }
    
    for (const client of clients) {
        try {
            const response = await fetch(`/public/campaign/client/${client.id}`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (response.ok) {
                const clientCampaigns = await response.json();
                campanhas.push(...clientCampaigns);
            }
        } catch (error) {
            console.error('Erro ao carregar campanhas do cliente', client.id, error);
        }
    }
    
    return campanhas;
}

// Função para carregar campanhas
async function carregarCampanhas() {
    console.log('=== FUNÇÃO carregarCampanhas CHAMADA ===');
    console.log('Token disponível:', !!token);
    console.log('campaignsContainer disponível:', !!campaignsContainer);
    try {
        console.log('Iniciando carregamento de campanhas...');
        // Exibir loading
        campaignsContainer.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2 text-muted">Carregando campanhas...</p>
                </td>
            </tr>
        `;

        const campanhas = await obterTodasCampanhas();
        console.log('Campanhas carregadas:', campanhas);

        // Verificar se há campanhas
        if (!Array.isArray(campanhas) || campanhas.length === 0) {
            campaignsContainer.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <p class="text-muted">Nenhuma campanha encontrada.</p>
                </td>
            </tr>
        `;
            return;
        }

        // Renderizar campanhas
        const campanhasHtml = await Promise.all(campanhas.map(async (campanha) => {
            const cliente = clients.find(c => c.id === campanha.clientId);
            const status = obterStatusCampanha(campanha);
            
            // Calcular receita da campanha usando a nova fórmula: Valor da campanha + entradas - saídas
            let receita = 0;
            try {
                const valores = await obterValoresCampanha(campanha.id);
                const entradas = valores.filter(v => v.type === 'ENTRADA').reduce((sum, v) => sum + parseFloat(v.value), 0);
                const saidas = valores.filter(v => v.type === 'SAIDA').reduce((sum, v) => sum + parseFloat(v.value), 0);
                const valorCampanha = parseFloat(campanha.value) || 0;
                receita = valorCampanha + entradas - saidas;
            } catch (error) {
                console.error('Erro ao calcular receita:', error);
            }
            
            // Função para obter classe CSS do status de pagamento
            const getPaymentStatusClass = (status) => {
                switch(status) {
                    case 'PAGO': return 'text-success';
                    case 'VENCIDO': return 'text-danger';
                    case 'ABERTO': return 'text-warning';
                    default: return 'text-muted';
                }
            };
            
            // Função para obter texto do status de pagamento
            const getPaymentStatusText = (status) => {
                switch(status) {
                    case 'PAGO': return 'Pago';
                    case 'VENCIDO': return 'Vencido';
                    case 'ABERTO': return 'Aberto';
                    default: return 'N/A';
                }
            };
            
            return `
                <tr data-campaign-id="${campanha.id}" data-status="${status.class}">
                    <td>${campanha.name}</td>
                    <td>${cliente ? cliente.name : 'Cliente não encontrado'}</td>
                    <td>
                        <small class="text-muted">
                            ${formatarData(campanha.startDate)} - ${formatarData(campanha.endDate)}
                        </small>
                    </td>
                    <td>
                        <span class="campaign-status ${status.class}">${status.text}</span>
                    </td>
                    <td><strong>${formatarMoeda(campanha.value || 0)}</strong></td>
                    <td>
                        <span class="badge bg-secondary">${campanha.paymentMethod || 'N/A'}</span>
                    </td>
                    <td>
                        <small class="text-muted">
                            ${campanha.dueDate ? formatarData(campanha.dueDate) : 'N/A'}
                        </small>
                    </td>
                    <td>
                        <span class="badge ${getPaymentStatusClass(campanha.paymentStatus)}">
                            ${getPaymentStatusText(campanha.paymentStatus)}
                        </span>
                    </td>
                    <td>${formatarMoeda(receita)}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-success" onclick="abrirModalValores(${campanha.id}, '${campanha.name}')" title="Gerenciar Valores">
                                <i class="bi bi-currency-dollar"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary" onclick="abrirModalEdicaoCampanha(${campanha.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="abrirModalExclusaoCampanha(${campanha.id}, '${campanha.name}')" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }));
        
        campaignsContainer.innerHTML = campanhasHtml.join('');

    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = 'Erro desconhecido';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Erro de conexão com o servidor. Verifique se o servidor está rodando.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        mostrarAlerta('Erro ao carregar campanhas: ' + errorMessage, 'danger');
        campaignsContainer.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle"></i>
                        ${errorMessage}
                        <br><small class="text-muted">Verifique o console para mais detalhes</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

// ===== FUNÇÕES UTILITÁRIAS =====

// Função para obter status da campanha
function obterStatusCampanha(campanha) {
    const agora = new Date();
    const inicio = new Date(campanha.startDate);
    const fim = new Date(campanha.endDate);
    
    if (!campanha.active) {
        return { class: 'inactive', text: 'Inativa' };
    }
    
    if (inicio > agora) {
        return { class: 'scheduled', text: 'Agendada' };
    }
    
    if (inicio <= agora && agora <= fim) {
        return { class: 'active', text: 'Ativa' };
    }
    
    return { class: 'inactive', text: 'Expirada' };
}

// Função para formatar data
function formatarData(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Função para mostrar alertas
function mostrarAlerta(mensagem, tipo = 'success') {
    const alertClass = tipo === 'success' ? 'alert-success' : 
                      tipo === 'warning' ? 'alert-warning' : 'alert-danger';
    const icon = tipo === 'success' ? 'bi-check-circle' : 
                tipo === 'warning' ? 'bi-exclamation-triangle' : 'bi-exclamation-triangle';

    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="bi ${icon} me-2"></i>
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    alertContainer.innerHTML = alertHtml;

    // Auto-remover após 5 segundos
    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// ===== FUNÇÕES DE CONFIGURAÇÃO =====

// Função para configurar eventos dos botões
function configurarEventosBotoes() {
    console.log('=== CONFIGURANDO EVENTOS DOS BOTÕES ===');
    
    // Verificar se os elementos existem
    const saveCampaignBtn = document.getElementById('saveCampaignBtn');
    console.log('Botão saveCampaignBtn encontrado:', saveCampaignBtn ? 'SIM' : 'NÃO');
    
    // Botão Nova Campanha
    const newCampaignBtn = document.getElementById('newCampaignBtn');
    if (newCampaignBtn) {
        newCampaignBtn.addEventListener('click', function() {
            limparFormularioCampanha();
            const modal = new bootstrap.Modal(document.getElementById('addCampaignModal'));
            modal.show();
        });
    }

    // Botão Salvar Campanha - usando onclick no HTML
    console.log('Botão salvar configurado via onclick no HTML');

    // Botão Atualizar Campanha - usando onclick no HTML
    console.log('Botão atualizar configurado via onclick no HTML');

    // Botão Confirmar Exclusão - usando onclick no HTML
    console.log('Botão excluir configurado via onclick no HTML');

    // Botão Adicionar Valor
    document.getElementById('addValueBtn').addEventListener('click', function() {
        limparFormularioValor();
        document.getElementById('addValueForm').style.display = 'block';
    });

    // Botão Salvar Valor
    document.getElementById('btnSalvarValor').addEventListener('click', salvarValor);

    // Botão Cancelar Valor
    document.getElementById('btnCancelarValor').addEventListener('click', function() {
        document.getElementById('addValueForm').style.display = 'none';
        limparFormularioValor();
    });
}

// Função para configurar filtros
function configurarFiltros() {
    // Filtro de pesquisa
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filtrarCampanhas(searchTerm);
        });
    }

    // Filtro de status (comentado pois o elemento não existe)
    // const statusFilter = document.getElementById('statusFilter');
    // if (statusFilter) {
    //     statusFilter.addEventListener('change', function() {
    //         const statusFilter = this.value;
    //         filtrarCampanhasPorStatus(statusFilter);
    //     });
    // }
}

// ===== FUNÇÕES DE FILTRO =====

// Função para filtrar campanhas por texto
function filtrarCampanhas(searchTerm) {
    const rows = campaignsContainer.querySelectorAll('tr');
    
    rows.forEach(row => {
        const campaignName = row.cells[0]?.textContent.toLowerCase() || '';
        const clientName = row.cells[1]?.textContent.toLowerCase() || '';
        
        if (campaignName.includes(searchTerm) || clientName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Função para filtrar campanhas por status
function filtrarCampanhasPorStatus(statusFilter) {
    const rows = campaignsContainer.querySelectorAll('tr');
    
    rows.forEach(row => {
        const status = row.getAttribute('data-status');
        
        if (!statusFilter || status === statusFilter) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ===== FUNÇÕES DE CAMPANHA =====

// Função para limpar formulário de campanha
function limparFormularioCampanha() {
    document.getElementById('campaignName').value = '';
    document.getElementById('campaignClient').value = '';
    document.getElementById('campaignDescription').value = '';
    document.getElementById('campaignStartDate').value = '';
    document.getElementById('campaignEndDate').value = '';
    document.getElementById('campaignActive').checked = true;
    document.getElementById('campaignValue').value = '';
    document.getElementById('campaignPaymentMethod').value = '';
    document.getElementById('campaignDueDate').value = '';
    document.getElementById('campaignPaymentStatus').value = 'ABERTO';
}

// Função para salvar campanha
async function salvarCampanha() {
    console.log('=== INICIANDO SALVAMENTO DE CAMPANHA ===');
    try {
        const name = document.getElementById('campaignName').value.trim();
        const clientId = document.getElementById('campaignClient').value;
        const description = document.getElementById('campaignDescription').value.trim();
        const startDate = document.getElementById('campaignStartDate').value;
        const endDate = document.getElementById('campaignEndDate').value;
        const active = document.getElementById('campaignActive').checked;
        const value = parseFloat(document.getElementById('campaignValue').value);
        const paymentMethod = document.getElementById('campaignPaymentMethod').value;
        const dueDate = document.getElementById('campaignDueDate').value;
        const paymentStatus = document.getElementById('campaignPaymentStatus').value;
        
        console.log('Valores coletados do formulário:', {
            name, clientId, description, startDate, endDate, active, value, paymentMethod, dueDate, paymentStatus
        });

        // Validações
        console.log('Iniciando validações...');
        if (!name) {
            console.log('Erro: Nome da campanha é obrigatório');
            mostrarAlerta('Nome da campanha é obrigatório', 'danger');
            return;
        }

        if (!clientId) {
            console.log('Erro: Cliente é obrigatório');
            mostrarAlerta('Cliente é obrigatório', 'danger');
            return;
        }

        if (!startDate || !endDate) {
            console.log('Erro: Datas de início e fim são obrigatórias');
            mostrarAlerta('Datas de início e fim são obrigatórias', 'danger');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            console.log('Erro: Data de início deve ser anterior à data de fim');
            mostrarAlerta('Data de início deve ser anterior à data de fim', 'danger');
            return;
        }

        if (!value || value <= 0) {
            console.log('Erro: Valor da campanha é obrigatório e deve ser maior que zero');
            mostrarAlerta('Valor da campanha é obrigatório e deve ser maior que zero', 'danger');
            return;
        }

        if (!paymentMethod) {
            console.log('Erro: Forma de pagamento é obrigatória');
            mostrarAlerta('Forma de pagamento é obrigatória', 'danger');
            return;
        }

        if (!dueDate) {
            console.log('Erro: Data de vencimento é obrigatória');
            mostrarAlerta('Data de vencimento é obrigatória', 'danger');
            return;
        }

        if (!paymentStatus) {
            console.log('Erro: Status do pagamento é obrigatório');
            mostrarAlerta('Status do pagamento é obrigatório', 'danger');
            return;
        }
        
        console.log('Todas as validações passaram!');

        const campaignData = {
            name,
            clientId: parseInt(clientId),
            description,
            startDate,
            endDate,
            active,
            value,
            paymentMethod,
            dueDate,
            paymentStatus
        };

        console.log('Enviando dados da campanha:', campaignData);
        console.log('Token usado:', token ? 'Token presente' : 'Token ausente');

        console.log('Fazendo requisição para API...');
        const response = await fetch('http://45.172.160.51:4000/public/campaign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(campaignData)
        });

        console.log('Resposta recebida:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json();
            console.log('Erro na resposta:', errorData);
            throw new Error(errorData.message || 'Erro ao salvar campanha');
        }

        const result = await response.json();
        console.log('Campanha salva com sucesso:', result);

        // Fechar modal de forma robusta
        const modalElement = document.getElementById('addCampaignModal');
        let modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
            modal = new bootstrap.Modal(modalElement);
        }
        modal.hide();
        
        // Remover backdrop manualmente se ainda estiver presente
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 300);

        // Recarregar dados
        await carregarCampanhas();
        await carregarEstatisticas();

        mostrarAlerta('Campanha criada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar campanha:', error);
        mostrarAlerta('Erro ao salvar campanha: ' + error.message, 'danger');
    }
}

// Função para abrir modal de edição
async function abrirModalEdicaoCampanha(campaignId) {
    console.log('Função abrirModalEdicaoCampanha chamada com ID:', campaignId);
    try {
        const response = await fetch(`http://45.172.160.51:4000/public/campaign/${campaignId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados da campanha');
        }

        const campanha = await response.json();
        console.log('Dados da campanha recebidos:', campanha);

        // Preencher formulário
        document.getElementById('editCampaignId').value = campanha.id;
        document.getElementById('editCampaignName').value = campanha.name;
        document.getElementById('editCampaignClient').value = campanha.clientId;
        document.getElementById('editCampaignDescription').value = campanha.description || '';
        
        // Processar datas com logs para datetime-local
        const startDate = campanha.startDate ? campanha.startDate.substring(0, 16) : '';
        const endDate = campanha.endDate ? campanha.endDate.substring(0, 16) : '';
        console.log('Data início processada:', startDate);
        console.log('Data fim processada:', endDate);
        
        document.getElementById('editCampaignStartDate').value = startDate;
        document.getElementById('editCampaignEndDate').value = endDate;
        document.getElementById('editCampaignActive').checked = campanha.active;
        
        // Preencher novos campos de valor e pagamento
        document.getElementById('editCampaignValue').value = campanha.value || 0;
        document.getElementById('editCampaignPaymentMethod').value = campanha.paymentMethod || '';
        
        // Processar data de vencimento
        const dueDate = campanha.dueDate ? campanha.dueDate.substring(0, 10) : '';
        console.log('Data vencimento processada:', dueDate);
        document.getElementById('editCampaignDueDate').value = dueDate;
        
        document.getElementById('editCampaignPaymentStatus').value = campanha.paymentStatus || 'ABERTO';
        
        console.log('Novos campos preenchidos:', {
            value: campanha.value,
            paymentMethod: campanha.paymentMethod,
            dueDate: dueDate,
            paymentStatus: campanha.paymentStatus
        });

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('editCampaignModal'));
        modal.show();

    } catch (error) {
        console.error('Erro ao carregar campanha:', error);
        mostrarAlerta('Erro ao carregar dados da campanha: ' + error.message, 'danger');
    }
}

// Função para atualizar campanha
async function atualizarCampanha() {
    console.log('Função atualizarCampanha chamada');
    try {
        const id = document.getElementById('editCampaignId').value;
        const name = document.getElementById('editCampaignName').value.trim();
        const clientId = document.getElementById('editCampaignClient').value;
        const description = document.getElementById('editCampaignDescription').value.trim();
        const startDate = document.getElementById('editCampaignStartDate').value;
        const endDate = document.getElementById('editCampaignEndDate').value;
        const active = document.getElementById('editCampaignActive').checked;
        const value = parseFloat(document.getElementById('editCampaignValue').value);
        const paymentMethod = document.getElementById('editCampaignPaymentMethod').value;
        const dueDate = document.getElementById('editCampaignDueDate').value;
        const paymentStatus = document.getElementById('editCampaignPaymentStatus').value;

        // Validações
        if (!name) {
            mostrarAlerta('Nome da campanha é obrigatório', 'danger');
            return;
        }

        if (!clientId) {
            mostrarAlerta('Cliente é obrigatório', 'danger');
            return;
        }

        if (!startDate || !endDate) {
            mostrarAlerta('Datas de início e fim são obrigatórias', 'danger');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            mostrarAlerta('Data de início deve ser anterior à data de fim', 'danger');
            return;
        }

        if (!value || value <= 0) {
            mostrarAlerta('Valor da campanha é obrigatório e deve ser maior que zero', 'danger');
            return;
        }

        if (!paymentMethod) {
            mostrarAlerta('Forma de pagamento é obrigatória', 'danger');
            return;
        }

        if (!dueDate) {
            mostrarAlerta('Data de vencimento é obrigatória', 'danger');
            return;
        }

        if (!paymentStatus) {
            mostrarAlerta('Status do pagamento é obrigatório', 'danger');
            return;
        }

        const campaignData = {
            name,
            clientId: parseInt(clientId),
            description,
            startDate,
            endDate,
            active,
            value,
            paymentMethod,
            dueDate,
            paymentStatus
        };

        const response = await fetch(`http://45.172.160.51:4000/public/campaign/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(campaignData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao atualizar campanha');
        }

        // Fechar modal de forma robusta
        const modalElement = document.getElementById('editCampaignModal');
        let modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
            modal = new bootstrap.Modal(modalElement);
        }
        modal.hide();
        
        // Remover backdrop manualmente se ainda estiver presente
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 300);

        // Recarregar dados
        await carregarCampanhas();
        await carregarEstatisticas();

        mostrarAlerta('Campanha atualizada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao atualizar campanha:', error);
        mostrarAlerta('Erro ao atualizar campanha: ' + error.message, 'danger');
    }
}

// Função para abrir modal de exclusão
function abrirModalExclusaoCampanha(campaignId, campaignName) {
    console.log('Função abrirModalExclusaoCampanha chamada com ID:', campaignId, 'Nome:', campaignName);
    document.getElementById('deleteCampaignId').value = campaignId;
    document.getElementById('deleteCampaignName').textContent = campaignName;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteCampaignModal'));
    modal.show();
}

// Função para excluir campanha
async function excluirCampanha() {
    console.log('Função excluirCampanha chamada');
    try {
        const id = document.getElementById('deleteCampaignId').value;
        console.log('ID da campanha a ser excluída:', id);
        
        if (!id) {
            throw new Error('ID da campanha não encontrado');
        }

        const response = await fetch(`http://45.172.160.51:4000/public/campaign/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        console.log('Resposta da API de exclusão:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na API de exclusão:', errorData);
            throw new Error(errorData.message || 'Erro ao excluir campanha');
        }
        
        console.log('Campanha excluída com sucesso na API');

        // Fechar modal de forma robusta
        const modalElement = document.getElementById('deleteCampaignModal');
        let modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
            modal = new bootstrap.Modal(modalElement);
        }
        modal.hide();
        
        // Remover backdrop manualmente se ainda estiver presente
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 300);

        // Recarregar dados
        await carregarCampanhas();
        await carregarEstatisticas();

        mostrarAlerta('Campanha excluída com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir campanha:', error);
        mostrarAlerta('Erro ao excluir campanha: ' + error.message, 'danger');
    }
}

// ===== FUNÇÕES DE VALORES DE CAMPANHA =====

// Função para obter valores de uma campanha
async function obterValoresCampanha(campaignId) {
    try {
        const response = await fetch(`http://45.172.160.51:4000/public/campaign-value/campaign/${campaignId}`, {
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

// Função para abrir modal de valores
async function abrirModalValores(campaignId, campaignName) {
    try {
        // Obter dados completos da campanha
        const response = await fetch(`http://45.172.160.51:4000/public/campaign/${campaignId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao carregar dados da campanha');
        }
        const campanha = await response.json();
        console.log('=== DADOS DA CAMPANHA OBTIDOS ===');
        console.log('Campanha completa:', campanha);
        console.log('Valor da campanha (raw):', campanha.value);
        
        // Definir dados da campanha no modal
        document.getElementById('currentCampaignId').value = campaignId;
        document.getElementById('campaignNameInModal').textContent = campaignName;
        
        // Armazenar valor da campanha para uso no cálculo
        const valorCampanhaRaw = campanha.value;
        window.currentCampaignValue = parseFloat(valorCampanhaRaw) || 0;
        
        // Validar se o valor é um número válido
        if (isNaN(window.currentCampaignValue)) {
            console.warn('Valor da campanha inválido:', valorCampanhaRaw, 'definindo como 0');
            window.currentCampaignValue = 0;
        }
        
        console.log('Valor da campanha armazenado:', window.currentCampaignValue);
        
        // Carregar valores
        await carregarValoresCampanha(campaignId);
        
        // Esconder formulário de adicionar valor
        document.getElementById('addValueForm').style.display = 'none';
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('manageValuesModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao abrir modal de valores:', error);
        mostrarAlerta('Erro ao carregar valores da campanha: ' + error.message, 'danger');
    }
}

// Função para carregar valores da campanha
async function carregarValoresCampanha(campaignId) {
    try {
        console.log('=== CARREGANDO VALORES DA CAMPANHA ===');
        console.log('Campaign ID:', campaignId);
        
        const valores = await obterValoresCampanha(campaignId);
        console.log('Valores obtidos:', valores);
        console.log('Número de valores:', valores.length);
        
        // Calcular totais
        let totalEntradas = 0;
        let totalSaidas = 0;
        
        // Renderizar valores
        const valoresHtml = valores.map(valor => {
            // Validar e converter valor
            let valorNumerico = parseFloat(valor.value);
            if (isNaN(valorNumerico)) {
                console.warn('Valor inválido encontrado:', valor.value, 'para valor ID:', valor.id);
                valorNumerico = 0;
            }
            
            if (valor.type === 'ENTRADA') {
                totalEntradas += valorNumerico;
            } else {
                totalSaidas += valorNumerico;
            }
            
            return `
                <tr>
                    <td>${valor.description}</td>
                    <td>
                        <span class="value-type ${valor.type.toLowerCase()}">
                            ${valor.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                        </span>
                    </td>
                    <td class="${valor.type === 'ENTRADA' ? 'text-success' : 'text-danger'}">
                        ${valor.type === 'ENTRADA' ? '+' : '-'} ${formatarMoeda(valorNumerico)}
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="editarValor(${valor.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="excluirValor(${valor.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Atualizar container de valores
        valuesContainer.innerHTML = valoresHtml || `
            <tr>
                <td colspan="4" class="text-center py-3 text-muted">
                    Nenhum valor cadastrado para esta campanha.
                </td>
            </tr>
        `;
        
        // Validar totais calculados
        totalEntradas = isNaN(totalEntradas) ? 0 : totalEntradas;
        totalSaidas = isNaN(totalSaidas) ? 0 : totalSaidas;
        
        // Obter valor da campanha
        const valorCampanha = window.currentCampaignValue || 0;
        console.log('=== VALORES PARA CÁLCULO ===');
        console.log('Valor da campanha:', valorCampanha);
        console.log('Total entradas:', totalEntradas);
        console.log('Total saídas:', totalSaidas);
        
        // Calcular lucro: Valor da campanha + entradas - saídas
        const lucro = valorCampanha + totalEntradas - totalSaidas;
        console.log('Lucro calculado:', lucro);
        
        // Atualizar totais
        document.getElementById('totalEntradas').textContent = formatarMoeda(totalEntradas);
        document.getElementById('totalSaidas').textContent = formatarMoeda(totalSaidas);
        document.getElementById('saldoTotal').textContent = formatarMoeda(lucro);
        document.getElementById('saldoTotal').className = lucro >= 0 ? 'text-white fw-bold' : 'text-danger fw-bold';
        
        // Gerar relatório financeiro detalhado
        gerarRelatorioFinanceiro(valores, totalEntradas, totalSaidas, lucro, valorCampanha);
        
    } catch (error) {
        console.error('Erro ao carregar valores:', error);
        valuesContainer.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-3">
                    <div class="alert alert-danger" role="alert">
                        Erro ao carregar valores: ${error.message}
                    </div>
                </td>
            </tr>
        `;
    }
}

// Função para gerar relatório financeiro detalhado
function gerarRelatorioFinanceiro(valores, totalEntradas, totalSaidas, lucro, valorCampanha) {
    try {
        // Validar todos os valores de entrada
        totalEntradas = isNaN(totalEntradas) ? 0 : totalEntradas;
        totalSaidas = isNaN(totalSaidas) ? 0 : totalSaidas;
        lucro = isNaN(lucro) ? 0 : lucro;
        valorCampanha = isNaN(valorCampanha) ? 0 : valorCampanha;
        
        console.log('=== VALORES VALIDADOS PARA RELATÓRIO ===');
        console.log('Total Entradas:', totalEntradas);
        console.log('Total Saídas:', totalSaidas);
        console.log('Lucro:', lucro);
        console.log('Valor Campanha:', valorCampanha);
        
        // Calcular ROI baseado no investimento total (valor da campanha + saídas)
        const investimentoTotal = valorCampanha + totalSaidas;
        const roi = investimentoTotal > 0 ? ((lucro / investimentoTotal) * 100) : 0;
        
        // Atualizar resumo financeiro - verificar se elementos existem
        const reportValorCampanha = document.getElementById('reportValorCampanha');
        const reportTotalEntradas = document.getElementById('reportTotalEntradas');
        const reportTotalSaidas = document.getElementById('reportTotalSaidas');
        const reportLucroLiquido = document.getElementById('reportLucroLiquido');
        const reportROI = document.getElementById('reportROI');
        
        if (reportValorCampanha) reportValorCampanha.textContent = formatarMoeda(valorCampanha);
        if (reportTotalEntradas) reportTotalEntradas.textContent = formatarMoeda(totalEntradas);
        if (reportTotalSaidas) reportTotalSaidas.textContent = formatarMoeda(totalSaidas);
        if (reportLucroLiquido) {
            reportLucroLiquido.textContent = formatarMoeda(lucro);
            reportLucroLiquido.className = lucro >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold';
        }
        if (reportROI) {
            reportROI.textContent = roi.toFixed(2) + '%';
            reportROI.className = roi >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold';
        }
        
        // Análise de performance
        let statusPerformance = '';
        let corStatus = '';
        if (roi >= 50) {
            statusPerformance = 'Excelente';
            corStatus = 'text-success';
        } else if (roi >= 20) {
            statusPerformance = 'Boa';
            corStatus = 'text-info';
        } else if (roi >= 0) {
            statusPerformance = 'Regular';
            corStatus = 'text-warning';
        } else {
            statusPerformance = 'Ruim';
            corStatus = 'text-danger';
        }
        
        const reportStatusFinanceiro = document.getElementById('reportStatusFinanceiro');
        if (reportStatusFinanceiro) {
            reportStatusFinanceiro.textContent = statusPerformance;
            reportStatusFinanceiro.className = 'badge ' + corStatus;
        }
        
        // Resumo executivo
        let resumoTexto = '';
        if (lucro > 0) {
            resumoTexto = `Esta campanha apresenta resultado positivo com lucro líquido de ${formatarMoeda(lucro)}. `;
            resumoTexto += `Investimento inicial: ${formatarMoeda(valorCampanha)}, Entradas adicionais: ${formatarMoeda(totalEntradas)}, Saídas: ${formatarMoeda(totalSaidas)}. `;
            if (roi >= 30) {
                resumoTexto += 'O ROI está excelente, indicando alta eficiência do investimento.';
            } else if (roi >= 10) {
                resumoTexto += 'O ROI está em nível satisfatório.';
            } else {
                resumoTexto += 'O ROI está baixo, considere otimizar os custos.';
            }
        } else {
            resumoTexto = `Esta campanha apresenta prejuízo de ${formatarMoeda(Math.abs(lucro))}. `;
            resumoTexto += `Investimento inicial: ${formatarMoeda(valorCampanha)}, Entradas: ${formatarMoeda(totalEntradas)}, Saídas: ${formatarMoeda(totalSaidas)}. `;
            resumoTexto += 'É necessário revisar a estratégia e reduzir custos para torná-la lucrativa.';
        }
        
        const reportResumo = document.getElementById('reportResumo');
        if (reportResumo) {
            reportResumo.textContent = resumoTexto;
        } else {
            console.warn('Elemento reportResumo não encontrado');
        }
        
        // Estatísticas adicionais
        const totalTransacoes = valores.length;
        const entradas = valores.filter(v => v.type === 'ENTRADA');
        const saidas = valores.filter(v => v.type === 'SAIDA');
        
        const reportTotalTransacoes = document.getElementById('reportTotalTransacoes');
        const reportNumEntradas = document.getElementById('reportNumEntradas');
        const reportNumSaidas = document.getElementById('reportNumSaidas');
        
        if (reportTotalTransacoes) reportTotalTransacoes.textContent = totalTransacoes;
        if (reportNumEntradas) reportNumEntradas.textContent = entradas.length;
        if (reportNumSaidas) reportNumSaidas.textContent = saidas.length;
        
        // Ticket médio
        const ticketMedioEntrada = entradas.length > 0 ? totalEntradas / entradas.length : 0;
        const ticketMedioSaida = saidas.length > 0 ? totalSaidas / saidas.length : 0;
        
        const reportTicketMedioEntrada = document.getElementById('reportTicketMedioEntrada');
        const reportTicketMedioSaida = document.getElementById('reportTicketMedioSaida');
        
        if (reportTicketMedioEntrada) reportTicketMedioEntrada.textContent = formatarMoeda(ticketMedioEntrada);
        if (reportTicketMedioSaida) reportTicketMedioSaida.textContent = formatarMoeda(ticketMedioSaida);
        
        // Maior entrada e maior saída
        const maiorEntrada = entradas.length > 0 ? Math.max(...entradas.map(v => parseFloat(v.value) || 0)) : 0;
        const maiorSaida = saidas.length > 0 ? Math.max(...saidas.map(v => parseFloat(v.value) || 0)) : 0;
        
        const reportMaiorEntrada = document.getElementById('reportMaiorEntrada');
        const reportMaiorSaida = document.getElementById('reportMaiorSaida');
        
        if (reportMaiorEntrada) reportMaiorEntrada.textContent = formatarMoeda(maiorEntrada);
        if (reportMaiorSaida) reportMaiorSaida.textContent = formatarMoeda(maiorSaida);
        
    } catch (error) {
        console.error('Erro ao gerar relatório financeiro:', error);
    }
}

// Função para exportar relatório
function exportarRelatorio() {
    try {
        const campaignName = document.getElementById('campaignNameInModal').textContent;
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        // Obter dados do relatório
        const valorCampanha = document.getElementById('reportValorCampanha').textContent;
        const totalEntradas = document.getElementById('reportTotalEntradas').textContent;
        const totalSaidas = document.getElementById('reportTotalSaidas').textContent;
        const lucroLiquido = document.getElementById('reportLucroLiquido').textContent;
        const roi = document.getElementById('reportROI').textContent;
        const performance = document.getElementById('reportStatusFinanceiro').textContent;
        const resumo = document.getElementById('reportResumo').textContent;
        const totalTransacoes = document.getElementById('reportTotalTransacoes').textContent;
        const numEntradas = document.getElementById('reportNumEntradas').textContent;
        const numSaidas = document.getElementById('reportNumSaidas').textContent;
        const ticketMedioEntrada = document.getElementById('reportTicketMedioEntrada').textContent;
        const ticketMedioSaida = document.getElementById('reportTicketMedioSaida').textContent;
        
        // Criar conteúdo do relatório
        const conteudoRelatorio = `
RELATÓRIO FINANCEIRO - ${campaignName}
Data: ${dataAtual}

=== RESUMO FINANCEIRO ===
Valor da Campanha: ${valorCampanha}
Total de Entradas: ${totalEntradas}
Total de Saídas: ${totalSaidas}
Lucro Líquido: ${lucroLiquido}
ROI: ${roi}
Performance: ${performance}

Fórmula do Lucro: Valor da Campanha + Entradas - Saídas

=== ESTATÍSTICAS ===
Total de Transações: ${totalTransacoes}
Número de Entradas: ${numEntradas}
Número de Saídas: ${numSaidas}
Ticket Médio - Entradas: ${ticketMedioEntrada}
Ticket Médio - Saídas: ${ticketMedioSaida}

=== ANÁLISE EXECUTIVA ===
${resumo}

=== DETALHAMENTO ===
`;
        
        // Adicionar detalhes das transações
        const valuesTable = document.querySelector('#valuesContainer');
        const rows = valuesTable.querySelectorAll('tr');
        let detalhes = '';
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                const descricao = cells[0].textContent.trim();
                const tipo = cells[1].textContent.trim();
                const valor = cells[2].textContent.trim();
                detalhes += `${descricao} | ${tipo} | ${valor}\n`;
            }
        });
        
        const relatorioCompleto = conteudoRelatorio + detalhes;
        
        // Criar e baixar arquivo
        const blob = new Blob([relatorioCompleto], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${campaignName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        mostrarAlerta('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        mostrarAlerta('Erro ao exportar relatório: ' + error.message, 'danger');
    }
}

// Função para limpar formulário de valor
function limparFormularioValor() {
    document.getElementById('valueDescription').value = '';
    document.getElementById('valueAmount').value = '';
    document.getElementById('valueType').value = 'ENTRADA';
    document.getElementById('editValueId').value = '';
    
    // Resetar botões
    document.getElementById('btnSalvarValor').style.display = 'inline-block';
    document.getElementById('btnAtualizarValor').style.display = 'none';
}

// Função para salvar valor
async function salvarValor() {
    try {
        const campaignId = document.getElementById('currentCampaignId').value;
        const description = document.getElementById('valueDescription').value.trim();
        const value = document.getElementById('valueAmount').value;
        const type = document.getElementById('valueType').value;

        // Validações
        if (!description) {
            mostrarAlerta('Descrição é obrigatória', 'danger');
            return;
        }

        if (!value || parseFloat(value) <= 0) {
            mostrarAlerta('Valor deve ser maior que zero', 'danger');
            return;
        }

        const valueData = {
            description,
            value: parseFloat(value),
            type,
            campaignId: parseInt(campaignId)
        };

        const response = await fetch('http://45.172.160.51:4000/public/campaign-value', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(valueData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar valor');
        }

        // Esconder formulário e limpar
        document.getElementById('addValueForm').style.display = 'none';
        limparFormularioValor();

        // Recarregar valores
        await carregarValoresCampanha(campaignId);
        
        // Recarregar campanhas e estatísticas
        await carregarCampanhas();
        await carregarEstatisticas();

        mostrarAlerta('Valor adicionado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar valor:', error);
        mostrarAlerta('Erro ao salvar valor: ' + error.message, 'danger');
    }
}

// Função para editar valor
async function editarValor(valueId) {
    try {
        // Primeiro, obter todos os valores da campanha atual
        const campaignId = document.getElementById('currentCampaignId').value;
        const response = await fetch(`http://45.172.160.51:4000/public/campaign-value/campaign/${campaignId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar valores da campanha');
        }
        
        const valores = await response.json();
        const valor = valores.find(v => v.id == valueId);
        
        if (!valor) {
            throw new Error('Valor não encontrado');
        }

        // Preencher formulário
        document.getElementById('editValueId').value = valor.id;
        document.getElementById('valueDescription').value = valor.description;
        document.getElementById('valueAmount').value = valor.value;
        document.getElementById('valueType').value = valor.type;

        // Mostrar formulário em modo edição
        document.getElementById('addValueForm').style.display = 'block';
        document.getElementById('btnSalvarValor').style.display = 'none';
        document.getElementById('btnAtualizarValor').style.display = 'inline-block';

        // Adicionar evento ao botão atualizar se não existir
        const btnAtualizar = document.getElementById('btnAtualizarValor');
        if (!btnAtualizar.hasAttribute('data-event-added')) {
            btnAtualizar.addEventListener('click', atualizarValor);
            btnAtualizar.setAttribute('data-event-added', 'true');
        }

    } catch (error) {
        console.error('Erro ao carregar valor:', error);
        mostrarAlerta('Erro ao carregar dados do valor: ' + error.message, 'danger');
    }
}

// Função para atualizar valor
async function atualizarValor() {
    try {
        const id = document.getElementById('editValueId').value;
        const description = document.getElementById('valueDescription').value.trim();
        const value = document.getElementById('valueAmount').value;
        const type = document.getElementById('valueType').value;

        // Validações
        if (!description) {
            mostrarAlerta('Descrição é obrigatória', 'danger');
            return;
        }

        if (!value || parseFloat(value) <= 0) {
            mostrarAlerta('Valor deve ser maior que zero', 'danger');
            return;
        }

        const valueData = {
            description,
            value: parseFloat(value),
            type
        };

        const response = await fetch(`http://45.172.160.51:4000/public/campaign-value/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(valueData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao atualizar valor');
        }

        // Esconder formulário e limpar
        document.getElementById('addValueForm').style.display = 'none';
        limparFormularioValor();

        // Recarregar valores
        const campaignId = document.getElementById('currentCampaignId').value;
        await carregarValoresCampanha(campaignId);
        
        // Recarregar campanhas e estatísticas
        await carregarCampanhas();
        await carregarEstatisticas();

        mostrarAlerta('Valor atualizado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao atualizar valor:', error);
        mostrarAlerta('Erro ao atualizar valor: ' + error.message, 'danger');
    }
}

// Função para excluir valor
async function excluirValor(valueId) {
    if (!confirm('Tem certeza que deseja excluir este valor?')) {
        return;
    }

    try {
        const response = await fetch(`http://45.172.160.51:4000/public/campaign-value/${valueId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao excluir valor');
        }

        // Recarregar valores
        const campaignId = document.getElementById('currentCampaignId').value;
        await carregarValoresCampanha(campaignId);
        
        // Recarregar campanhas e estatísticas
        await carregarCampanhas();
        await carregarEstatisticas();

        mostrarAlerta('Valor excluído com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir valor:', error);
        mostrarAlerta('Erro ao excluir valor: ' + error.message, 'danger');
    }
}