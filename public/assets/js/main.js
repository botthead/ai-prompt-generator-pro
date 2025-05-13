// public/assets/js/main.js - Scripts Globais da Aplicação

document.addEventListener('DOMContentLoaded', function() {
    // Ativar tooltips do Bootstrap em toda a aplicação
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configuração global do Axios para incluir o token CSRF nos headers
    // para requisições POST, PUT, DELETE, PATCH.
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfTokenMeta) {
        const csrfToken = csrfTokenMeta.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
            // console.log('CSRF token set for Axios requests via X-CSRF-TOKEN header.');
        } else {
            console.warn('CSRF token meta tag found, but its content is empty.');
        }
    } else {
        console.warn('CSRF token meta tag not found. AJAX POST/PUT/DELETE requests might fail CSRF validation if not handled autrement.');
    }

    // Funções globais para alertas e toasts
    window.showGlobalAlert = function(type, title, text = '', footer = '') {
        Swal.fire({
            icon: type, // 'success', 'error', 'warning', 'info', 'question'
            title: title,
            text: text,
            footer: footer,
            confirmButtonColor: '#0d6efd', // Cor primária do Bootstrap
            customClass: {
                popup: 'shadow-lg rounded-3', // Adiciona sombra e bordas arredondadas
            }
        });
    };
    
    window.showGlobalToast = function(type, title, position = 'top-end', timer = 3000, timerProgressBar = true) {
         Swal.fire({
            toast: true,
            position: position,
            icon: type,
            title: title,
            showConfirmButton: false,
            timer: timer,
            timerProgressBar: timerProgressBar,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            },
            customClass: {
                popup: 'colored-toast' // Classe para customização se necessário
            }
        });
    };

    // Função global para mostrar/esconder o overlay de carregamento (já definida no footer, mas pode ser chamada daqui)
    window.showGlobalLoader = function(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    };
    
    // Opcional: Interceptadores Axios para loader global (se não quiser em cada chamada)
    // Cuidado: Isso pode ativar o loader para chamadas muito rápidas que não precisam dele.
    // if (typeof axios !== 'undefined') {
    //     axios.interceptors.request.use(function (config) {
    //         // Adicionar uma flag na config da request se não quiser o loader global para ela
    //         if (!config.noLoader) { 
    //             showGlobalLoader(true);
    //         }
    //         return config;
    //     }, function (error) {
    //         showGlobalLoader(false);
    //         return Promise.reject(error);
    //     });
    //     axios.interceptors.response.use(function (response) {
    //         // Apenas desliga o loader se ele foi ligado pela request (precisaria de lógica mais complexa)
    //         // Por simplicidade, desligamos sempre, mas o ideal é controlar por request.
    //         showGlobalLoader(false); 
    //         return response;
    //     }, function (error) {
    //         showGlobalLoader(false);
    //         // Tratar erros globais do Axios se desejar, ex: 401 redirecionar para login
    //         // if (error.response && error.response.status === 401) {
    //         //    if (!window.location.pathname.endsWith('/login.php')) { // Evitar loop de redirect
    //         //        showGlobalAlert('error', 'Sessão Expirada', 'Sua sessão expirou ou você não está autenticado. Redirecionando para login...');
    //         //        setTimeout(() => window.location.href = (window.BASE_URL || '.') + '/login.php', 2500);
    //         //    }
    //         // }
    //         return Promise.reject(error);
    //     });
    // }


    console.log('AI Prompt Generator Pro - main.js loaded and configured.');
});

// Helper para sanitizar HTML (usar com cautela, DOMPurify é melhor para cenários complexos de XSS)
function sanitizeHTML(str) {
    if (str === null || typeof str === 'undefined') return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}