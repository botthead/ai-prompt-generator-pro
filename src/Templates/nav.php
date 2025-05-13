<?php
// AppConfig.php já deve ter sido incluído pelo header.php
// A sessão também já deve ter sido iniciada pelo header.php
?>
<nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
    <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="<?php echo htmlspecialchars(BASE_URL); ?>/index.php">
            <i class="fas fa-brain me-2"></i><?php echo htmlspecialchars(APP_NAME); ?>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbarNav" aria-controls="mainNavbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNavbarNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <?php if (isset($_SESSION['user_id'])): ?>
                    <li class="nav-item">
                        <a class="nav-link <?php echo (basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : ''); ?>" href="<?php echo htmlspecialchars(BASE_URL); ?>/dashboard.php">
                            <i class="fas fa-tachometer-alt me-1"></i>Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?php echo (basename($_SERVER['PHP_SELF']) == 'templates.php' ? 'active' : ''); ?>" href="<?php echo htmlspecialchars(BASE_URL); ?>/templates.php">
                            <i class="fas fa-file-alt me-1"></i>Meus Templates
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?php echo (basename($_SERVER['PHP_SELF']) == 'history.php' ? 'active' : ''); ?>" href="<?php echo htmlspecialchars(BASE_URL); ?>/history.php">
                            <i class="fas fa-history me-1"></i>Histórico
                        </a>
                    </li>
                <?php endif; ?>
            </ul>
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                <?php if (isset($_SESSION['user_id'])): ?>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="navbarUserDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-user-circle me-1"></i><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'Usuário'); ?>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarUserDropdown">
                            <li><a class="dropdown-item <?php echo (basename($_SERVER['PHP_SELF']) == 'profile.php' ? 'active' : ''); ?>" href="<?php echo htmlspecialchars(BASE_URL); ?>/profile.php"><i class="fas fa-user-edit me-2"></i>Perfil</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="<?php echo htmlspecialchars(BASE_URL); ?>/logout.php"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                        </ul>
                    </li>
                <?php else: ?>
                    <li class="nav-item">
                        <a class="nav-link <?php echo (basename($_SERVER['PHP_SELF']) == 'login.php' ? 'active' : ''); ?>" href="<?php echo htmlspecialchars(BASE_URL); ?>/login.php">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?php echo (basename($_SERVER['PHP_SELF']) == 'register.php' ? 'active' : ''); ?>" href="<?php echo htmlspecialchars(BASE_URL); ?>/register.php">Registrar</a>
                    </li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav>