</div> <!-- Fecha .main-content .container do header.php -->

<footer class="footer mt-auto py-3 bg-light border-top">
    <div class="container text-center">
        <span class="text-muted">© <?php echo date("Y"); ?> <?php echo htmlspecialchars(APP_NAME); ?>. Todos os direitos reservados.</span>
    </div>
</footer>

<!-- Overlay de Carregamento Global -->
<div id="loadingOverlay">
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
    </div>
</div>

<!-- jQuery (Bootstrap Bundle já inclui Popper) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>

<!-- Bootstrap JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

<!-- Axios (para chamadas AJAX) -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<!-- SweetAlert2 JS -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>

<!-- CKEditor 5 (Build Clássico via CDN - Para produção, considere um build customizado e hospedado localmente) -->
<!-- Se você baixou e hospedou, altere este src -->
<!-- Exemplo: <script src="<?php echo htmlspecialchars(BASE_URL); ?>/assets/js/ckeditor5/build/ckeditor.js"></script> -->

<!-- Seu JavaScript customizado principal -->
<script src="<?php echo htmlspecialchars(BASE_URL); ?>/assets/js/main.js"></script>

<?php
// Incluir scripts JS específicos da página, se definidos
if (isset($pageScripts) && is_array($pageScripts)) {
    foreach ($pageScripts as $script) {
        echo '<script src="' . htmlspecialchars(BASE_URL) . '/assets/js/' . htmlspecialchars($script) . '"></script>' . "\n";
    }
}
?>

<script>
    // Função global para mostrar/esconder o overlay de carregamento
    function showGlobalLoader(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // Configuração global do Axios para mostrar loader (opcional)
    // axios.interceptors.request.use(function (config) {
    //     showGlobalLoader(true);
    //     return config;
    // }, function (error) {
    //     showGlobalLoader(false);
    //     return Promise.reject(error);
    // });
    // axios.interceptors.response.use(function (response) {
    //     showGlobalLoader(false);
    //     return response;
    // }, function (error) {
    //     showGlobalLoader(false);
    //     return Promise.reject(error);
    // });
</script>

</body>
</html> 
