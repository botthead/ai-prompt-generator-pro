// main.js - Scripts Globais da Aplicação

document.addEventListener('DOMContentLoaded', function() {
    // Ativar tooltips do Bootstrap em toda a aplicação (se houver)
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Adicionar classe 'active' ao link de navegação da página atual
    // (Já está sendo feito no nav.php com basename, mas pode ser uma alternativa via JS)
    // const currentPage = window.location.pathname.split("/").pop();
    // if (currentPage) {
    //     const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    //     navLinks.forEach(link => {
    //         if (link.getAttribute('href') === currentPage || link.getAttribute('href') === `index.php?page=${currentPage}`) {
    //             link.classList.add('active');
    //             // Se for um dropdown item, ativar o pai também
    //             const dropdownToggle = link.closest('.dropdown')?.querySelector('.dropdown-toggle');
    //             if (dropdownToggle) {
    //                 dropdownToggle.classList.add('active');
    //             }
    //         }
    //     });
    // }

    // Exemplo de função para exibir mensagens com SweetAlert2
    window.showGlobalAlert = function(type, title, text = '') {
        Swal.fire({
            icon: type, // 'success', 'error', 'warning', 'info', 'question'
            title: title,
            text: text,
            confirmButtonColor: '#0d6efd' // Cor primária do Bootstrap
        });
    };
    
    window.showGlobalToast = function(type, title, position = 'top-end', timer = 3000) {
         Swal.fire({
            toast: true,
            position: position,
            icon: type,
            title: title,
            showConfirmButton: false,
            timer: timer,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    };


    // Funções para o loader global (já no footer.php, mas podem ser centralizadas aqui)
    // window.showGlobalLoader = function(show) {
    //     const overlay = document.getElementById('loadingOverlay');
    //     if (overlay) {
    //         overlay.style.display = show ? 'flex' : 'none';
    //     }
    // }

    // Exemplo de como usar o loader com Axios (já no footer.php, mas pode ser centralizado)
    // if (typeof axios !== 'undefined') {
    //     axios.interceptors.request.use(function (config) {
    //         if (!config.doNotShowLoader) { // Adicionar flag para não mostrar em certas requisições
    //             showGlobalLoader(true);
    //         }
    //         return config;
    //     }, function (error) {
    //         showGlobalLoader(false);
    //         return Promise.reject(error);
    //     });
    //     axios.interceptors.response.use(function (response) {
    //         showGlobalLoader(false);
    //         return response;
    //     }, function (error) {
    //         showGlobalLoader(false);
    //         // Tratar erros globalmente se desejar
    //         // if (error.response && error.response.status === 401) {
    //         //    showGlobalAlert('error', 'Sessão Expirada', 'Sua sessão expirou. Por favor, faça login novamente.');
    //         //    setTimeout(() => window.location.href = 'login.php', 2000);
    //         // }
    //         return Promise.reject(error);
    //     });
    // }

    console.log('AI Prompt Generator Pro - main.js loaded.');
});

// Helper para sanitizar HTML (usar com cautela, bibliotecas como DOMPurify são melhores para XSS complexo)
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
} 
