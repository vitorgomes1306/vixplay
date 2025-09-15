/**
 * Modern Dashboard JS - Funcionalidades para uma dashboard dinâmica e responsiva
 */

// Configurações e variáveis globais
const ANIMATION_DURATION = 300; // ms
const CHART_COLORS = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  accent: '#4cc9f0',
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  light: '#f8f9fa',
  dark: '#212529',
  gray: '#6c757d'
};

// Inicialização quando o DOM estiver pronto
// Comentado para evitar conflito com index.html
// document.addEventListener('DOMContentLoaded', function() {
//   initializeDashboard();
//   setupEventListeners();
//   loadInitialData();
// });

/**
 * Inicializa os componentes da dashboard
 */
function initializeDashboard() {
  // Função desabilitada para evitar conflito com index.html
  return;
  
  // Inicializa o toggle da sidebar
  initSidebar();
  
  // Inicializa tooltips
  initTooltips();
  
  // Inicializa os gráficos se existirem
  // initCharts(); // Comentado para evitar conflito com gráficos do index.html
  
  // Inicializa o tema (claro/escuro)
  initThemeToggle();
  
  // Adiciona animações de entrada
  addEntryAnimations();
  
  // Inicializa os cards com efeitos de hover
  initCards();
  
  console.log('Dashboard inicializada com sucesso!');
}

/**
 * Configura a funcionalidade da sidebar
 */
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');
  const mobileToggle = document.querySelector('.mobile-toggle');
  
  // Verifica se os elementos existem antes de adicionar os listeners
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      if (content) {
        content.classList.toggle('expanded');
      }
    });
  }
  
  // Para dispositivos móveis
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', function() {
      sidebar.classList.toggle('expanded');
      if (sidebarOverlay) {
        sidebarOverlay.classList.toggle('active');
      }
    });
  }
  
  // Fecha a sidebar ao clicar no overlay
  if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('expanded');
      sidebarOverlay.classList.remove('active');
    });
  }
  
  // Marca o item ativo na sidebar
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href)) {
      link.classList.add('active');
    }
  });
}

/**
 * Inicializa tooltips personalizados
 */
function initTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(element => {
    const tooltipText = element.getAttribute('data-tooltip');
    
    if (tooltipText) {
      element.classList.add('custom-tooltip');
      
      const tooltip = document.createElement('span');
      tooltip.classList.add('tooltip-text');
      tooltip.textContent = tooltipText;
      
      element.appendChild(tooltip);
    }
  });
}

/**
 * Inicializa gráficos na dashboard
 */
function initCharts() {
  // Verifica se a biblioteca Chart.js está disponível
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js não está disponível. Os gráficos não serão renderizados.');
    return;
  }
  
  // Configuração padrão para todos os gráficos
  Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
  Chart.defaults.color = '#6c757d';
  Chart.defaults.responsive = true;
  
  // Inicializa gráficos específicos
  initVisitorsChart();
  initDeviceChart();
  initActivityChart();
}

/**
 * Inicializa o gráfico de visitantes
 */
function initVisitorsChart() {
  const visitorsChartEl = document.getElementById('visitorsChart');
  
  if (!visitorsChartEl) return;
  
  const ctx = visitorsChartEl.getContext('2d');
  
  // Dados de exemplo
  const data = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    datasets: [{
      label: 'Visitantes',
      data: [65, 59, 80, 81, 56, 55, 72],
      backgroundColor: hexToRgba(CHART_COLORS.primary, 0.2),
      borderColor: CHART_COLORS.primary,
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#fff',
          titleColor: '#212529',
          bodyColor: '#212529',
          borderColor: '#e9ecef',
          borderWidth: 1,
          padding: 10,
          boxPadding: 5,
          usePointStyle: true,
          callbacks: {
            labelPointStyle: function(context) {
              return {
                pointStyle: 'circle',
                rotation: 0
              };
            }
          }
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
            borderDash: [2, 2]
          }
        }
      }
    }
  };
  
  new Chart(ctx, config);
}

/**
 * Inicializa o gráfico de dispositivos
 */
function initDeviceChart() {
  const deviceChartEl = document.getElementById('deviceChart');
  
  if (!deviceChartEl) return;
  
  const ctx = deviceChartEl.getContext('2d');
  
  // Dados de exemplo
  const data = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [65, 30, 5],
      backgroundColor: [
        CHART_COLORS.primary,
        CHART_COLORS.success,
        CHART_COLORS.warning
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
  
  const config = {
    type: 'doughnut',
    data: data,
    options: {
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        }
      }
    }
  };
  
  new Chart(ctx, config);
}

/**
 * Inicializa o gráfico de atividade
 */
function initActivityChart() {
  const activityChartEl = document.getElementById('activityChart');
  
  if (!activityChartEl) return;
  
  const ctx = activityChartEl.getContext('2d');
  
  // Dados de exemplo
  const data = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [{
      label: 'Visualizações',
      data: [12, 19, 3, 5, 2, 3, 7],
      backgroundColor: CHART_COLORS.primary
    }]
  };
  
  const config = {
    type: 'bar',
    data: data,
    options: {
      plugins: {
        legend: {
          display: false
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
            borderDash: [2, 2]
          }
        }
      }
    }
  };
  
  new Chart(ctx, config);
}

/**
 * Inicializa o toggle de tema claro/escuro
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  
  if (!themeToggle) return;
  
  // Verifica se há preferência salva
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
  }
  
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });
}

/**
 * Adiciona animações de entrada aos elementos
 */
function addEntryAnimations() {
  const animatedElements = document.querySelectorAll('.animate-entry');
  
  animatedElements.forEach((element, index) => {
    // Atrasa a animação com base no índice
    setTimeout(() => {
      element.classList.add('fade-in');
    }, index * 100);
  });
}

/**
 * Inicializa os cards com efeitos de hover
 */
function initCards() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    });
  });
}

/**
 * Configura os listeners de eventos para elementos interativos
 */
function setupEventListeners() {
  // Listener para botões de ação nos painéis
  setupPanelActionButtons();
  
  // Listener para formulários
  setupFormValidation();
  
  // Listener para notificações
  setupNotifications();
  
  // Listener para pesquisa
  setupSearch();
}

/**
 * Configura os botões de ação nos painéis
 */
function setupPanelActionButtons() {
  // Botões de editar painel
  const editButtons = document.querySelectorAll('.btn-edit-panel');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const panelId = this.getAttribute('data-panel-id');
      if (panelId) {
        abrirModalEdicao(panelId);
      }
    });
  });
  
  // Botões de excluir painel
  const deleteButtons = document.querySelectorAll('.btn-delete-panel');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const panelId = this.getAttribute('data-panel-id');
      const panelName = this.getAttribute('data-panel-name');
      if (panelId) {
        abrirModalExclusao(panelId, panelName);
      }
    });
  });
  
  // Botões de visualizar painel
  const viewButtons = document.querySelectorAll('.btn-view-panel');
  viewButtons.forEach(button => {
    button.addEventListener('click', function() {
      const panelId = this.getAttribute('data-panel-id');
      if (panelId) {
        visualizarPainel(panelId);
      }
    });
  });
}

/**
 * Configura validação de formulários
 */
function setupFormValidation() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!this.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        
        // Destaca os campos inválidos
        highlightInvalidFields(this);
      }
      
      form.classList.add('was-validated');
    });
  });
}

/**
 * Destaca campos inválidos em um formulário
 */
function highlightInvalidFields(form) {
  const invalidFields = form.querySelectorAll(':invalid');
  
  invalidFields.forEach(field => {
    // Adiciona animação de shake
    field.classList.add('shake-animation');
    
    // Remove a animação após ela terminar
    setTimeout(() => {
      field.classList.remove('shake-animation');
    }, 600);
    
    // Adiciona mensagem de erro personalizada se não existir
    if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('invalid-feedback')) {
      const feedback = document.createElement('div');
      feedback.classList.add('invalid-feedback');
      feedback.textContent = field.validationMessage || 'Este campo é obrigatório';
      field.parentNode.insertBefore(feedback, field.nextSibling);
    }
  });
  
  // Foca no primeiro campo inválido
  if (invalidFields.length > 0) {
    invalidFields[0].focus();
  }
}

/**
 * Configura o sistema de notificações
 */
function setupNotifications() {
  const notificationBell = document.querySelector('.notification-bell');
  const notificationDropdown = document.querySelector('.notification-dropdown');
  
  if (notificationBell && notificationDropdown) {
    notificationBell.addEventListener('click', function(e) {
      e.preventDefault();
      notificationDropdown.classList.toggle('show');
      
      // Marca notificações como lidas quando o dropdown é aberto
      if (notificationDropdown.classList.contains('show')) {
        const unreadBadge = notificationBell.querySelector('.badge');
        if (unreadBadge) {
          unreadBadge.style.display = 'none';
        }
        
        const unreadNotifications = notificationDropdown.querySelectorAll('.notification-item.unread');
        unreadNotifications.forEach(notification => {
          notification.classList.remove('unread');
        });
      }
    });
    
    // Fecha o dropdown ao clicar fora dele
    document.addEventListener('click', function(e) {
      if (!notificationBell.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.remove('show');
      }
    });
  }
}

/**
 * Configura a funcionalidade de pesquisa
 */
function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchResults = document.querySelector('.search-results');
  
  if (searchInput && searchResults) {
    searchInput.addEventListener('focus', function() {
      searchResults.style.display = 'block';
    });
    
    searchInput.addEventListener('blur', function() {
      // Pequeno atraso para permitir cliques nos resultados
      setTimeout(() => {
        if (!searchResults.contains(document.activeElement)) {
          searchResults.style.display = 'none';
        }
      }, 100);
    });
    
    searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      
      if (query.length > 2) {
        // Simula uma pesquisa
        searchResults.innerHTML = '';
        
        // Resultados de exemplo
        const exampleResults = [
          { title: 'Painel Principal', type: 'painel', url: 'painel.html?id=1' },
          { title: 'Configurações', type: 'configuracao', url: 'configuracoes.html' },
          { title: 'Estatísticas', type: 'estatistica', url: 'estatisticas.html' }
        ];
        
        const filteredResults = exampleResults.filter(result => 
          result.title.toLowerCase().includes(query)
        );
        
        if (filteredResults.length > 0) {
          filteredResults.forEach(result => {
            const resultItem = document.createElement('a');
            resultItem.href = result.url;
            resultItem.classList.add('search-result-item');
            
            let icon = 'bi-file-earmark';
            if (result.type === 'painel') icon = 'bi-tv';
            if (result.type === 'configuracao') icon = 'bi-gear';
            if (result.type === 'estatistica') icon = 'bi-bar-chart';
            
            resultItem.innerHTML = `
              <i class="bi ${icon}"></i>
              <div class="search-result-content">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-type">${result.type}</div>
              </div>
            `;
            
            searchResults.appendChild(resultItem);
          });
        } else {
          searchResults.innerHTML = '<div class="search-no-results">Nenhum resultado encontrado</div>';
        }
        
        searchResults.style.display = 'block';
      } else if (query.length === 0) {
        searchResults.style.display = 'none';
      }
    });
  }
}

/**
 * Carrega dados iniciais para a dashboard
 */
function loadInitialData() {
  // Simula carregamento de dados
  showLoader();
  
  // Simula uma requisição AJAX
  setTimeout(() => {
    hideLoader();
    loadPanels();
    updateStatistics();
  }, 1000);
}

/**
 * Mostra o loader durante carregamento
 */
function showLoader() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'block';
  }
}

/**
 * Esconde o loader após carregamento
 */
function hideLoader() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
}

/**
 * Carrega os painéis na interface
 */
function loadPanels() {
  const painelContainer = document.getElementById('painelContainer');
  const noPanels = document.getElementById('noPanels');
  
  if (!painelContainer) return;
  
  // Simula dados de painéis
  const paineis = [
    {
      id: 1,
      nome: 'Painel Principal',
      descricao: 'Exibe informações gerais e estatísticas',
      tipo: 'FULL_SCREEN',
      dataCriacao: '2023-10-15',
      status: 'ativo'
    },
    {
      id: 2,
      nome: 'Painel de Notícias',
      descricao: 'Exibe notícias e atualizações',
      tipo: 'DIVIDED',
      dataCriacao: '2023-10-20',
      status: 'ativo'
    },
    {
      id: 3,
      nome: 'Painel de Clima',
      descricao: 'Exibe informações meteorológicas',
      tipo: 'FULL_SCREEN',
      dataCriacao: '2023-10-25',
      status: 'inativo'
    }
  ];
  
  if (paineis.length === 0) {
    if (noPanels) noPanels.style.display = 'block';
    return;
  }
  
  if (noPanels) noPanels.style.display = 'none';
  
  // Limpa o container
  painelContainer.innerHTML = '';
  
  // Renderiza os painéis
  paineis.forEach((painel, index) => {
    const panelCard = document.createElement('div');
    panelCard.classList.add('col');
    panelCard.classList.add('animate-entry');
    
    // Atrasa a animação com base no índice
    setTimeout(() => {
      panelCard.classList.add('fade-in');
    }, index * 100);
    
    let statusBadge = '';
    if (painel.status === 'ativo') {
      statusBadge = '<span class="badge bg-success">Ativo</span>';
    } else {
      statusBadge = '<span class="badge bg-danger">Inativo</span>';
    }
    
    let tipoIcon = '';
    if (painel.tipo === 'FULL_SCREEN') {
      tipoIcon = '<i class="bi bi-fullscreen me-1"></i> Tela Cheia';
    } else {
      tipoIcon = '<i class="bi bi-layout-split me-1"></i> Dividido';
    }
    
    panelCard.innerHTML = `
      <div class="card h-100">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">${painel.nome}</h5>
          ${statusBadge}
        </div>
        <div class="card-body">
          <p class="card-text">${painel.descricao || 'Sem descrição'}</p>
          <div class="d-flex align-items-center mb-3">
            <small class="text-muted me-3">
              <i class="bi bi-calendar3 me-1"></i> ${formatDate(painel.dataCriacao)}
            </small>
            <small class="text-muted">
              ${tipoIcon}
            </small>
          </div>
        </div>
        <div class="card-footer">
          <div class="d-flex justify-content-between">
            <button class="btn btn-sm btn-primary btn-view-panel" data-panel-id="${painel.id}">
              <i class="bi bi-eye me-1"></i> Visualizar
            </button>
            <div>
              <button class="btn btn-sm btn-outline-primary btn-edit-panel me-1" data-panel-id="${painel.id}">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger btn-delete-panel" data-panel-id="${painel.id}" data-panel-name="${painel.nome}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    painelContainer.appendChild(panelCard);
  });
  
  // Reconfigura os botões de ação
  setupPanelActionButtons();
}

/**
 * Atualiza as estatísticas na dashboard
 */
function updateStatistics() {
  // Exemplo de atualização de estatísticas
  const totalPaineis = document.getElementById('totalPaineis');
  const totalDispositivos = document.getElementById('totalDispositivos');
  const totalVisualizacoes = document.getElementById('totalVisualizacoes');
  
  if (totalPaineis) totalPaineis.textContent = '3';
  if (totalDispositivos) totalDispositivos.textContent = '12';
  if (totalVisualizacoes) totalVisualizacoes.textContent = '1,254';
  
  // Anima os números
  animateNumbers();
}

/**
 * Anima os números nas estatísticas
 */
function animateNumbers() {
  const numberElements = document.querySelectorAll('.stats-value');
  
  numberElements.forEach(element => {
    const finalValue = element.textContent;
    let startValue = 0;
    
    // Remove vírgulas para cálculos
    const finalValueNumber = parseInt(finalValue.replace(/,/g, ''));
    const duration = 1500; // ms
    const frameRate = 30; // fps
    const totalFrames = duration / (1000 / frameRate);
    const increment = finalValueNumber / totalFrames;
    
    const counter = setInterval(() => {
      startValue += increment;
      
      if (startValue >= finalValueNumber) {
        element.textContent = finalValue; // Garante o valor final exato
        clearInterval(counter);
      } else {
        // Formata o número com vírgulas se necessário
        element.textContent = Math.floor(startValue).toLocaleString();
      }
    }, 1000 / frameRate);
  });
}

/**
 * Abre o modal de edição de painel
 */
function abrirModalEdicao(panelId) {
  // Implementação existente ou nova implementação
  console.log(`Abrindo modal de edição para o painel ${panelId}`);
  
  // Aqui você pode chamar a função existente ou implementar uma nova
  if (typeof window.abrirModalEdicao === 'function') {
    window.abrirModalEdicao(panelId);
  } else {
    // Nova implementação
    const editPanelModal = new bootstrap.Modal(document.getElementById('editPanelModal'));
    if (editPanelModal) {
      // Simula carregamento de dados do painel
      document.getElementById('editPanelId').value = panelId;
      // Outros campos seriam preenchidos com dados reais
      
      editPanelModal.show();
    }
  }
}

/**
 * Abre o modal de exclusão de painel
 */
function abrirModalExclusao(panelId, panelName) {
  // Implementação existente ou nova implementação
  console.log(`Abrindo modal de exclusão para o painel ${panelId}`);
  
  // Aqui você pode chamar a função existente ou implementar uma nova
  if (typeof window.abrirModalExclusao === 'function') {
    window.abrirModalExclusao(panelId, panelName);
  } else {
    // Nova implementação
    const deletePanelModal = new bootstrap.Modal(document.getElementById('deletePanelModal'));
    if (deletePanelModal) {
      document.getElementById('deletePanelId').value = panelId;
      document.getElementById('deletePanelName').textContent = panelName;
      
      deletePanelModal.show();
    }
  }
}

/**
 * Visualiza um painel
 */
function visualizarPainel(panelId) {
  // Implementação existente ou nova implementação
  console.log(`Visualizando painel ${panelId}`);
  
  // Aqui você pode chamar a função existente ou implementar uma nova
  if (typeof window.visualizarPainel === 'function') {
    window.visualizarPainel(panelId);
  } else {
    // Nova implementação - redireciona para a página de visualização
    window.location.href = `painel.html?id=${panelId}`;
  }
}

/**
 * Formata uma data no formato brasileiro
 */
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Converte uma cor hex para rgba
 */
function hexToRgba(hex, alpha = 1) {
  if (!hex) return '';
  
  // Remove o # se existir
  hex = hex.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Exibe uma notificação toast
 */
function showToast(message, type = 'success') {
  // Cria o elemento toast se não existir
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.classList.add('toast-container', 'position-fixed', 'bottom-0', 'end-0', 'p-3');
    document.body.appendChild(toastContainer);
  }
  
  // Cria um novo toast
  const toastId = 'toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.classList.add('toast', 'fade-in');
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Define a cor com base no tipo
  let bgClass = 'bg-success';
  let icon = 'bi-check-circle';
  
  if (type === 'error') {
    bgClass = 'bg-danger';
    icon = 'bi-exclamation-circle';
  } else if (type === 'warning') {
    bgClass = 'bg-warning';
    icon = 'bi-exclamation-triangle';
  } else if (type === 'info') {
    bgClass = 'bg-info';
    icon = 'bi-info-circle';
  }
  
  toast.innerHTML = `
    <div class="toast-header ${bgClass} text-white">
      <i class="bi ${icon} me-2"></i>
      <strong class="me-auto">Notificação</strong>
      <small>Agora</small>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Inicializa o toast
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 5000
  });
  
  bsToast.show();
  
  // Remove o toast do DOM após ser escondido
  toast.addEventListener('hidden.bs.toast', function() {
    toast.remove();
  });
}