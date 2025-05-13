    </div> <!-- Fecha .main-content .container do header.php -->

    <footer class="footer mt-auto py-3 bg-light border-top">
        <div class="container text-center">
            <span class="text-muted">© <?php echo date("Y"); ?> <?php echo htmlspecialchars(APP_NAME); ?>. Todos os direitos reservados.</span>
        </div>
    </footer>

    <div id="loadingOverlay">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Carregando...</span>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
    <script src="https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js"></script>
    
    <!-- DOMPurify CDN (ANTES de Marked.js se Marked.js for usado para inserir HTML) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js" integrity="sha512-sayUhAScOuMccbiImR3Ek8EOYOIzLh5hQEOh2QzV5V7W3HRDk59GPaDGJAgJbHkvmyGRLGMDCI9GJUWClL45GA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <!-- Marked.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    
    <script>
        window.BASE_URL = "<?php echo htmlspecialchars(BASE_URL); ?>";
    </script>
    <script src="<?php echo htmlspecialchars(BASE_URL); ?>/assets/js/main.js"></script>

    <?php
    if (isset($pageScripts) && is_array($pageScripts)) {
        foreach ($pageScripts as $script) {
            // Simples sanitização para remover tentativas de path traversal
            $safeScript = str_replace(['../', '..\\'], '', $script);
            if (preg_match('/^[a-zA-Z0-9\-\._]+$/', $safeScript)) { // Permite apenas caracteres seguros no nome do arquivo
                 echo '<script src="' . htmlspecialchars(BASE_URL) . '/assets/js/' . htmlspecialchars($safeScript) . '"></script>' . "\n";
            }
        }
    }
    ?>
    </body>
    </html>