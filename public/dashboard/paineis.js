
// ===== VARIÁVEIS GLOBAIS =====
const token = localStorage.getItem('token');
const userName = localStorage.getItem('usuarioName');
const painelContainer = document.getElementById('painelContainer');
const loading = document.getElementById('loading');
const noPanels = document.getElementById('noPanels');
const alertContainer = document.getElementById('alertContainer');

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
if (!token) {
    window.location.href = "/";
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticação
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Preencher nome do usuário
    if (userName) {
        document.getElementById('userNameDisplay').textContent = userName;
    }

    // Definir link ativo na sidebar
    setActiveSidebarLink();

    // Anexar evento de logout
    document.getElementById('logoutBtnSidebar').addEventListener('click', handleLogout);

    // Inicializar tema escuro se necessário
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
    
    carregarPaineis();
    carregarEstatisticas();
    configurarEventosModais();
});

// ===== FUNÇÃO PARA CONFIGURAR EVENTOS DOS MODAIS =====
// ===== FUNÇÃO PARA CONFIGURAR EVENTOS DOS MODAIS =====
function configurarEventosModais() {
    // Configura eventos para o modal de adicionar painel
    const addPanelModal = document.getElementById('addPanelModal');
    const showWeatherInput = document.getElementById('showWeather');
    const weatherFrequencyInput = document.getElementById('weatherFrequency');
    const showNewsInput = document.getElementById('showNews');
    const newsFrequencyInput = document.getElementById('newsFrequency');
    const showLotteryInput = document.getElementById('showLottery');
    const lotteryFrequencyInput = document.getElementById('lotteryFrequency');
    const showCoinsInput = document.getElementById('showCoins');
    const coinsFrequencyInput = document.getElementById('coinsFrequency');
    const showCustomScreenInput = document.getElementById('showCustomScreen');
    const customScreenFrequencyInput = document.getElementById('customScreenFrequency');
    const customScreenContentInput = document.getElementById('customScreenContent');

    addPanelModal.addEventListener('show.bs.modal', function () {
        // Reseta o estado dos checkboxes e desabilita os campos de frequência por padrão
        showWeatherInput.checked = false;
        weatherFrequencyInput.disabled = true;
        showNewsInput.checked = false;
        newsFrequencyInput.disabled = true;
        showLotteryInput.checked = false;
        lotteryFrequencyInput.disabled = true;
        showCoinsInput.checked = false;
        coinsFrequencyInput.disabled = true;
        showCustomScreenInput.checked = false;
        customScreenFrequencyInput.disabled = true;
        customScreenContentInput.disabled = true;
    });

    showWeatherInput.addEventListener('change', function () {
        weatherFrequencyInput.disabled = !this.checked;
        document.getElementById('weatherFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    showNewsInput.addEventListener('change', function () {
        newsFrequencyInput.disabled = !this.checked;
        document.getElementById('newsFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    showLotteryInput.addEventListener('change', function () {
        lotteryFrequencyInput.disabled = !this.checked;
        document.getElementById('lotteryFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    showCoinsInput.addEventListener('change', function () {
        coinsFrequencyInput.disabled = !this.checked;
        document.getElementById('coinsFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    showCustomScreenInput.addEventListener('change', function () {
        customScreenFrequencyInput.disabled = !this.checked;
        customScreenContentInput.disabled = !this.checked;
        document.getElementById('customScreenFrequencyGroup').style.display = this.checked ? 'block' : 'none';
        document.getElementById('customScreenContentGroup').style.display = this.checked ? 'block' : 'none';
    });

    // Configura eventos para o modal de editar painel
    const editPanelModal = document.getElementById('editPanelModal');
    const editShowWeatherInput = document.getElementById('editShowWeather');
    const editWeatherFrequencyInput = document.getElementById('editWeatherFrequency');
    const editShowNewsInput = document.getElementById('editShowNews');
    const editNewsFrequencyInput = document.getElementById('editNewsFrequency');
    const editShowLotteryInput = document.getElementById('editShowLottery');
    const editLotteryFrequencyInput = document.getElementById('editLotteryFrequency');
    const editShowCoinsInput = document.getElementById('editShowCoins');
    const editCoinsFrequencyInput = document.getElementById('editCoinsFrequency');
    const editShowCustomScreenInput = document.getElementById('editShowCustomScreen');
    const editCustomScreenFrequencyInput = document.getElementById('editCustomScreenFrequency');
    const editCustomScreenContentInput = document.getElementById('editCustomScreenContent');

    editPanelModal.addEventListener('show.bs.modal', function () {
        // O estado será atualizado por abrirModalEdicao, mas garantimos que a lógica inicial seja aplicada
        editWeatherFrequencyInput.disabled = !editShowWeatherInput.checked;
        document.getElementById('editWeatherFrequencyGroup').style.display = editShowWeatherInput.checked ? 'block' : 'none';
        editNewsFrequencyInput.disabled = !editShowNewsInput.checked;
        document.getElementById('editNewsFrequencyGroup').style.display = editShowNewsInput.checked ? 'block' : 'none';
        editLotteryFrequencyInput.disabled = !editShowLotteryInput.checked;
        document.getElementById('editLotteryFrequencyGroup').style.display = editShowLotteryInput.checked ? 'block' : 'none';
        editCoinsFrequencyInput.disabled = !editShowCoinsInput.checked;
        document.getElementById('editCoinsFrequencyGroup').style.display = editShowCoinsInput.checked ? 'block' : 'none';
        editCustomScreenFrequencyInput.disabled = !editShowCustomScreenInput.checked;
        editCustomScreenContentInput.disabled = !editShowCustomScreenInput.checked;
        document.getElementById('editCustomScreenFrequencyGroup').style.display = editShowCustomScreenInput.checked ? 'block' : 'none';
        document.getElementById('editCustomScreenContentGroup').style.display = editShowCustomScreenInput.checked ? 'block' : 'none';
    });

    editShowWeatherInput.addEventListener('change', function () {
        editWeatherFrequencyInput.disabled = !this.checked;
        document.getElementById('editWeatherFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    editShowNewsInput.addEventListener('change', function () {
        editNewsFrequencyInput.disabled = !this.checked;
        document.getElementById('editNewsFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    editShowLotteryInput.addEventListener('change', function () {
        editLotteryFrequencyInput.disabled = !this.checked;
        document.getElementById('editLotteryFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    editShowCoinsInput.addEventListener('change', function () {
        editCoinsFrequencyInput.disabled = !this.checked;
        document.getElementById('editCoinsFrequencyGroup').style.display = this.checked ? 'block' : 'none';
    });
    editShowCustomScreenInput.addEventListener('change', function () {
        editCustomScreenFrequencyInput.disabled = !this.checked;
        editCustomScreenContentInput.disabled = !this.checked;
        document.getElementById('editCustomScreenFrequencyGroup').style.display = this.checked ? 'block' : 'none';
        document.getElementById('editCustomScreenContentGroup').style.display = this.checked ? 'block' : 'none';
    });
}

// ===== FUNÇÃO PARA MOSTRAR ALERTAS =====
function mostrarAlerta(tipo, mensagem) {
    const alertClass = tipo === 'sucesso' ? 'alert-success' : 'alert-danger';
    const icon = tipo === 'sucesso' ? 'bi-check-circle' : 'bi-exclamation-triangle';

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

// ===== CARREGAR ESTATÍSTICAS =====
async function carregarEstatisticas() {
    try {
        // Carregar total de painéis
        const totalPaineisElement = document.getElementById('totalPaineis');
        const totalDispositivosElement = document.getElementById('totalDispositivos');
        const totalVisualizacoesElement = document.getElementById('totalVisualizacoes');
        
        // Buscar painéis da API
        const respostaPaineis = await fetch('/public/paineis', {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        
        if (respostaPaineis.ok) {
            const paineis = await respostaPaineis.json();
            if (Array.isArray(paineis)) {
                totalPaineisElement.textContent = paineis.length;
            }
        }
        
        // Buscar dispositivos da API
        const respostaDispositivos = await fetch('/devices', {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        
        if (respostaDispositivos.ok) {
            const dispositivos = await respostaDispositivos.json();
            if (Array.isArray(dispositivos)) {
                totalDispositivosElement.textContent = dispositivos.length;
                
                // Contar dispositivos conectados (status = true)
                const dispositivosConectados = dispositivos.filter(d => d.statusDevice === true).length;
                totalDispositivosElement.textContent = dispositivosConectados;
            }
        }
        
        // Inicializar gráficos com dados reais
        inicializarGraficos();
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        mostrarAlerta('erro', 'Erro ao carregar estatísticas. Tente novamente.');
    }
}

// ===== INICIALIZAR GRÁFICOS =====
function inicializarGraficos() {
    // Gráfico de visualizações
    const visitorsChartCtx = document.getElementById('visitorsChart');
    if (visitorsChartCtx) {
        const visitorsChart = new Chart(visitorsChartCtx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Visualizações',
                    data: [120, 190, 300, 250, 280, 320, 410],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#4361ee',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [2, 4],
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

// ===== NAVEGAÇÃO =====
function irParaDispositivos() {
    window.location.href = 'dispositivos.html';
}

// ===== INICIALIZAÇÃO DO TEMA =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o toggle do tema escuro
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Verifica se o tema escuro está ativado no localStorage
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        // Adiciona o evento de alteração do tema
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
});

// Inicializa o toggle da sidebar para dispositivos móveis
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('expanded');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('active');
            }
        });
    }
    
    if (sidebarOverlay && sidebar) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('expanded');
            sidebarOverlay.classList.remove('active');
        });
    }
});

// ===== FUNÇÕES DE NAVEGAÇÃO E INTERFACE =====

// Função para definir o link ativo na sidebar
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Função para lidar com o logout
function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('usuarioEmail');
        localStorage.removeItem('usuarioName');
        localStorage.removeItem('token');
        window.location.href = "login.html";
    }
}

// ===== CARREGAR PAINÉIS =====
async function carregarPaineis() {
    try {
        loading.style.display = 'block';
        painelContainer.style.display = 'none';
        noPanels.style.display = 'none';

        const resposta = await fetch('http://45.172.160.51:4000/public/paineis', {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao carregar painéis: Status ' + resposta.status);
        }

        const paineis = await resposta.json();
        console.log('📋 Painéis carregados da API:', paineis); // Log para depuração
        loading.style.display = 'none';

        if (!Array.isArray(paineis) || paineis.length === 0) {
            noPanels.style.display = 'block';
            return;
        }

        renderizarPaineis(paineis);
        painelContainer.style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar painéis:', error);
        loading.style.display = 'none';
        mostrarAlerta('erro', 'Erro ao carregar painéis. Tente novamente.');
    }
}

// ===== RENDERIZAR PAINÉIS =====
function renderizarPaineis(paineis) {
    painelContainer.innerHTML = paineis.map(painel => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-pip-fill"></i>
                            ${painel.name || 'Sem Título'}
                        </h5>
                        <span class="badge bg-primary">#${painel.id}</span>
                    </div>
                    
                    <p class="card-text text-muted flex-grow-1">
                        ${painel.description || 'Sem descrição'}
                    </p>
                    
                    <div class="mt-auto">
                        <small class="text-muted d-block mb-3">
                            <i class="bi bi-calendar me-1"></i>
                            Criado em: ${new Date(painel.createdAt).toLocaleDateString('pt-BR')}
                        </small>
                        
                        <!-- Botão principal para abrir o painel -->
                        <div class="d-grid gap-2 mb-2">
                            <button class="btn btn-primary" onclick="abrirPainel(${painel.id})">
                                <i class="bi bi-play-circle me-2"></i>Abrir Painel
                            </button>
                        </div>
                        
                        <!-- Botões de ação secundários -->
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-secondary btn-sm flex-fill" 
                                    onclick="abrirModalEdicao(${painel.id}, '${(painel.name || '').replace(/'/g, "\\'")}', '${(painel.description || '').replace(/'/g, "\\'")}', '${painel.type || 'FULL_SCREEN'}', ${painel.showWeather === true}, ${painel.weatherFrequency || 10}, ${painel.showNews === true}, ${painel.newsFrequency || 10}, ${painel.showLottery === true}, ${painel.lotteryFrequency || 10}, ${painel.showCoins === true}, ${painel.coinsFrequency || 10}, ${painel.showCustomScreen === true}, ${painel.customScreenFrequency || 2}, '${(painel.customScreenContent || '').replace(/'/g, "\\'")}')">
                                <i class="bi bi-pencil me-1"></i>Editar
                            </button>
                            <button class="btn btn-outline-danger btn-sm flex-fill" 
                                    onclick="abrirModalExclusao(${painel.id}, '${(painel.name || '').replace(/'/g, "\\'")}')">
                                <i class="bi bi-trash me-1"></i>Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== ABRIR PAINEL PARA GERENCIAR MÍDIAS =====
function abrirPainel(painelId) {
    window.location.href = `painel.html?id=${painelId}`;
}

// ===== SALVAR NOVO PAINEL =====
async function salvarPainel() {
    const name = document.getElementById('panelName').value.trim();
    const description = document.getElementById('panelDescription').value.trim();
    const type = document.querySelector('input[name="panelType"]:checked').value;
    const showWeather = document.getElementById('showWeather').checked;
    const weatherFrequency = showWeather ? parseInt(document.getElementById('weatherFrequency').value, 10) : 10;
    const showNews = document.getElementById('showNews').checked;
    const newsFrequency = showNews ? parseInt(document.getElementById('newsFrequency').value, 10) : 10;
    const showLottery = document.getElementById('showLottery').checked;
    const lotteryFrequency = showLottery ? parseInt(document.getElementById('lotteryFrequency').value, 10) : 10;
    const showCoins = document.getElementById('showCoins').checked;
    const coinsFrequency = showCoins ? parseInt(document.getElementById('coinsFrequency').value, 10) : 10;
    const showCustomScreen = document.getElementById('showCustomScreen').checked;
    const customScreenFrequency = showCustomScreen ? parseInt(document.getElementById('customScreenFrequency').value, 10) : 2;
    const customScreenContent = showCustomScreen ? document.getElementById('customScreenContent').value.trim() : '';

    if (!name) {
        mostrarAlerta('erro', 'Nome do painel é obrigatório');
        return;
    }

    try {
        const resposta = await fetch('http://45.172.160.51:4000/public/painel', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                name,
                description,
                type,
                showWeather,
                weatherFrequency,
                showNews,
                newsFrequency,
                showLottery,
                lotteryFrequency,
                showCoins,
                coinsFrequency,
                showCustomScreen,
                customScreenFrequency,
                customScreenContent
            })
        });

        if (resposta.ok) {
            const painel = await resposta.json();
            mostrarAlerta('sucesso', `Painel "${painel.name}" criado com sucesso!`);

            // Fechar modal de forma robusta
            const modalElement = document.getElementById('addPanelModal');
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
            document.getElementById('addPanelForm').reset();

            // Recarregar painéis
            carregarPaineis();
        } else {
            const erro = await resposta.json();
            mostrarAlerta('erro', 'Erro ao criar painel: ' + (erro.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao criar painel:', error);
        mostrarAlerta('erro', 'Erro de conexão ao criar painel');
    }
}

// ===== ABRIR MODAL DE EDIÇÃO =====
function abrirModalEdicao(id, name, description, type, showWeather, weatherFrequency, showNews, newsFrequency, showLottery, lotteryFrequency, showCoins, coinsFrequency, showCustomScreen, customScreenFrequency, customScreenContent) {
    document.getElementById('editPanelId').value = id;
    document.getElementById('editPanelName').value = name;
    document.getElementById('editPanelDescription').value = description || '';
    document.querySelector(`input[name="editPanelType"][value="${type}"]`).checked = true;
    document.getElementById('editShowWeather').checked = showWeather === true;
    document.getElementById('editWeatherFrequency').value = weatherFrequency;
    document.getElementById('editWeatherFrequency').disabled = !(showWeather === true);
    document.getElementById('editShowNews').checked = showNews === true;
    document.getElementById('editNewsFrequency').value = newsFrequency;
    document.getElementById('editNewsFrequency').disabled = !(showNews === true);
    document.getElementById('editShowLottery').checked = showLottery === true;
    document.getElementById('editLotteryFrequency').value = lotteryFrequency;
    document.getElementById('editLotteryFrequency').disabled = !(showLottery === true);
    document.getElementById('editShowCoins').checked = showCoins === true;
    document.getElementById('editCoinsFrequency').value = coinsFrequency;
    document.getElementById('editCoinsFrequency').disabled = !(showCoins === true);
    document.getElementById('editShowCustomScreen').checked = showCustomScreen === true;
    document.getElementById('editCustomScreenFrequency').value = customScreenFrequency;
    document.getElementById('editCustomScreenFrequency').disabled = !(showCustomScreen === true);
    document.getElementById('editCustomScreenContent').value = customScreenContent || '';
    document.getElementById('editCustomScreenContent').disabled = !(showCustomScreen === true);

    console.log(`📋 Abrindo modal de edição para painel ID ${id}: showLottery=${showLottery}, lotteryFrequency=${lotteryFrequency}`); // Log para depuração

    const modal = new bootstrap.Modal(document.getElementById('editPanelModal'));
    modal.show();
}

// ===== SALVAR EDIÇÃO DO PAINEL =====
async function salvarEdicaoPainel() {
    const id = document.getElementById('editPanelId').value;
    const name = document.getElementById('editPanelName').value.trim();
    const description = document.getElementById('editPanelDescription').value.trim();
    const type = document.querySelector('input[name="editPanelType"]:checked').value;
    const showWeather = document.getElementById('editShowWeather').checked;
    const weatherFrequency = showWeather ? parseInt(document.getElementById('editWeatherFrequency').value, 10) : 10;
    const showNews = document.getElementById('editShowNews').checked;
    const newsFrequency = showNews ? parseInt(document.getElementById('editNewsFrequency').value, 10) : 10;
    const showLottery = document.getElementById('editShowLottery').checked;
    const lotteryFrequency = showLottery ? parseInt(document.getElementById('editLotteryFrequency').value, 10) : 10;
    const showCoins = document.getElementById('editShowCoins').checked;
    const coinsFrequency = showCoins ? parseInt(document.getElementById('editCoinsFrequency').value, 10) : 10;
    const showCustomScreen = document.getElementById('editShowCustomScreen').checked;
    const customScreenFrequency = showCustomScreen ? parseInt(document.getElementById('editCustomScreenFrequency').value, 10) : 2;
    const customScreenContent = showCustomScreen ? document.getElementById('editCustomScreenContent').value.trim() : '';

    if (!name) {
        mostrarAlerta('erro', 'Nome do painel é obrigatório');
        return;
    }

    try {
        const resposta = await fetch(`http://45.172.160.51:4000/public/painel/${id}/config`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                name,
                description,
                type,
                showWeather,
                weatherFrequency,
                showNews,
                newsFrequency,
                showLottery,
                lotteryFrequency,
                showCoins,
                coinsFrequency,
                showCustomScreen,
                customScreenFrequency,
                customScreenContent
            })
        });

        if (resposta.ok) {
            const painel = await resposta.json();
            mostrarAlerta('sucesso', `Painel "${painel.name}" atualizado com sucesso!`);

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPanelModal'));
            modal.hide();

            // Recarregar painéis
            carregarPaineis();
        } else {
            const erro = await resposta.json();
            mostrarAlerta('erro', 'Erro ao atualizar painel: ' + (erro.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao atualizar painel:', error);
        mostrarAlerta('erro', 'Erro de conexão ao atualizar painel');
    }
}

// ===== ABRIR MODAL DE EXCLUSÃO =====
function abrirModalExclusao(id, name) {
    document.getElementById('deletePanelId').value = id;
    document.getElementById('deletePanelName').textContent = name;

    const modal = new bootstrap.Modal(document.getElementById('deletePanelModal'));
    modal.show();
}

// ===== CONFIRMAR EXCLUSÃO DO PAINEL =====
async function confirmarExclusaoPainel() {
    const id = document.getElementById('deletePanelId').value;
    const name = document.getElementById('deletePanelName').textContent;

    try {
        const resposta = await fetch(`http://45.172.160.51:4000/public/painel/${id}`, {
            method: 'DELETE',
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (resposta.ok) {
            mostrarAlerta('sucesso', `Painel "${name}" excluído com sucesso!`);

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deletePanelModal'));
            modal.hide();

            // Recarregar painéis
            carregarPaineis();
        } else {
            const erro = await resposta.json();
            mostrarAlerta('erro', 'Erro ao excluir painel: ' + (erro.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir painel:', error);
        mostrarAlerta('erro', 'Erro de conexão ao excluir painel');
    }
}

// ===== FUNÇÃO PARA ABRIR MODAL DE TELAS PERSONALIZADAS =====
function abrirModalCustomScreen() {
    const modal = new bootstrap.Modal(document.getElementById('customScreenModal'));
    carregarCustomScreens();
    modal.show();
}

// ===== CARREGAR TELAS PERSONALIZADAS =====
async function carregarCustomScreens() {
    try {
        const customScreenList = document.getElementById('customScreenList');
        customScreenList.innerHTML = '<p>Carregando telas personalizadas...</p>';

        const resposta = await fetch('http://45.172.160.51:4000/custom-screens', {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao carregar telas personalizadas: Status ' + resposta.status);
        }

        const customScreens = await resposta.json();
        if (!Array.isArray(customScreens) || customScreens.length === 0) {
            customScreenList.innerHTML = '<p>Nenhuma tela personalizada encontrada. Clique em "Adicionar Nova Tela Personalizada" para criar uma.</p>';
            return;
        }

        customScreenList.innerHTML = customScreens.map(screen => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${screen.title || 'Sem Título'}</strong>
                    <small class="text-muted d-block">Criado em: ${new Date(screen.createdAt).toLocaleDateString('pt-BR')}</small>
                </div>
                <div>
                    <button class="btn btn-outline-primary btn-sm me-2" onclick="selecionarCustomScreen(${screen.id}, '${(screen.title || '').replace(/'/g, "\\\'")}', '${(screen.content || '').replace(/'/g, "\\\'")}')">
                        <i class="bi bi-check me-1"></i>Selecionar
                    </button>
                    <button class="btn btn-outline-secondary btn-sm me-2" onclick="abrirModalEditarCustomScreen(${screen.id}, '${(screen.title || '').replace(/'/g, "\\\'")}', '${(screen.content || '').replace(/'/g, "\\\'")}')">
                        <i class="bi bi-pencil me-1"></i>Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="abrirModalExcluirCustomScreen(${screen.id}, '${(screen.title || '').replace(/'/g, "\\\'")}')">
                        <i class="bi bi-trash me-1"></i>Excluir
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar telas personalizadas:', error);
        document.getElementById('customScreenList').innerHTML = '<p>Erro ao carregar telas personalizadas. Tente novamente.</p>';
    }
}

// ===== ABRIR MODAL PARA ADICIONAR TELA PERSONALIZADA =====
function abrirModalAdicionarCustomScreen() {
    const modal = new bootstrap.Modal(document.getElementById('addCustomScreenModal'));
    document.getElementById('addCustomScreenForm').reset();
    modal.show();
}

// ===== SALVAR NOVA TELA PERSONALIZADA =====
async function salvarCustomScreen() {
    const title = document.getElementById('customScreenTitle').value.trim();
    const content = document.getElementById('customScreenContentAdd').value.trim();

    if (!title) {
        mostrarAlerta('erro', 'Título da tela personalizada é obrigatório');
        return;
    }
    if (!content) {
        mostrarAlerta('erro', 'Conteúdo da tela personalizada é obrigatório');
        return;
    }

    try {
        const resposta = await fetch('http://45.172.160.51:4000/custom-screens', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ title, content })
        });

        if (resposta.ok) {
            const customScreen = await resposta.json();
            mostrarAlerta('sucesso', `Tela personalizada "${customScreen.title}" criada com sucesso!`);

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomScreenModal'));
            modal.hide();

            // Atualizar lista de telas personalizadas
            carregarCustomScreens();
        } else {
            const erro = await resposta.json();
            mostrarAlerta('erro', 'Erro ao criar tela personalizada: ' + (erro.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao criar tela personalizada:', error);
        mostrarAlerta('erro', 'Erro de conexão ao criar tela personalizada');
    }
}

// ===== ABRIR MODAL PARA EDITAR TELA PERSONALIZADA =====
function abrirModalEditarCustomScreen(id, title, content) {
    document.getElementById('editCustomScreenId').value = id;
    document.getElementById('editCustomScreenTitle').value = title;
    document.getElementById('editCustomScreenContent').value = content || '';

    const modal = new bootstrap.Modal(document.getElementById('editCustomScreenModal'));
    modal.show();
}

// ===== SALVAR EDIÇÃO DE TELA PERSONALIZADA =====
async function salvarEdicaoCustomScreen() {
    const id = document.getElementById('editCustomScreenId').value;
    const title = document.getElementById('editCustomScreenTitle').value.trim();
    const content = document.getElementById('editCustomScreenContent').value.trim();

    if (!title) {
        mostrarAlerta('erro', 'Título da tela personalizada é obrigatório');
        return;
    }
    if (!content) {
        mostrarAlerta('erro', 'Conteúdo da tela personalizada é obrigatório');
        return;
    }

    try {
        const resposta = await fetch(`/custom-screens/${id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ title, content })
        });

        if (resposta.ok) {
            const customScreen = await resposta.json();
            mostrarAlerta('sucesso', `Tela personalizada "${customScreen.title}" atualizada com sucesso!`);

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCustomScreenModal'));
            modal.hide();

            // Atualizar lista de telas personalizadas
            carregarCustomScreens();
        } else {
            const erro = await resposta.json();
            mostrarAlerta('erro', 'Erro ao atualizar tela personalizada: ' + (erro.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao atualizar tela personalizada:', error);
        mostrarAlerta('erro', 'Erro de conexão ao atualizar tela personalizada');
    }
}

// ===== ABRIR MODAL PARA EXCLUIR TELA PERSONALIZADA =====
function abrirModalExcluirCustomScreen(id, title) {
    document.getElementById('deleteCustomScreenId').value = id;
    document.getElementById('deleteCustomScreenTitle').textContent = title;

    const modal = new bootstrap.Modal(document.getElementById('deleteCustomScreenModal'));
    modal.show();
}

// ===== CONFIRMAR EXCLUSÃO DE TELA PERSONALIZADA =====
async function confirmarExclusaoCustomScreen() {
    const id = document.getElementById('deleteCustomScreenId').value;
    const title = document.getElementById('deleteCustomScreenTitle').textContent;

    try {
        const resposta = await fetch(`http://45.172.160.51:4000/custom-screens/${id}`, {
            method: 'DELETE',
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (resposta.ok) {
            mostrarAlerta('sucesso', `Tela personalizada "${title}" excluída com sucesso!`);

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCustomScreenModal'));
            modal.hide();

            // Atualizar lista de telas personalizadas
            carregarCustomScreens();
        } else {
            const erro = await resposta.json();
            mostrarAlerta('erro', 'Erro ao excluir tela personalizada: ' + (erro.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir tela personalizada:', error);
        mostrarAlerta('erro', 'Erro de conexão ao excluir tela personalizada');
    }
}

// ===== SELECIONAR TELA PERSONALIZADA PARA O PAINEL =====
function selecionarCustomScreen(id, title, content) {
    // Aqui você pode implementar a lógica para associar a tela personalizada selecionada ao painel
    // Por exemplo, armazenar o conteúdo no campo customScreenContent do painel
    mostrarAlerta('sucesso', `Tela personalizada "${title}" selecionada com sucesso!`);
    const customScreenModal = bootstrap.Modal.getInstance(document.getElementById('customScreenModal'));
    customScreenModal.hide();

    // Preenche o campo de conteúdo personalizado no modal de adicionar/editar painel (se aplicável)
    if (document.getElementById('editPanelModal').classList.contains('show')) {
        document.getElementById('editShowCustomScreen').checked = true;
        document.getElementById('editCustomScreenContent').value = content;
        document.getElementById('editCustomScreenContent').disabled = false;
        document.getElementById('editCustomScreenFrequencyGroup').style.display = 'block';
        document.getElementById('editCustomScreenContentGroup').style.display = 'block';
    } else {
        document.getElementById('showCustomScreen').checked = true;
        document.getElementById('customScreenContent').value = content;
        document.getElementById('customScreenContent').disabled = false;
        document.getElementById('customScreenFrequencyGroup').style.display = 'block';
        document.getElementById('customScreenContentGroup').style.display = 'block';
    }
}
