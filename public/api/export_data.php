<?php
// Não definir Content-Type: application/json aqui no topo
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Core/Auth.php';
require_once __DIR__ . '/../../src/Core/PromptService.php';
require_once __DIR__ . '/../../src/Core/TemplateManager.php';

// Se você instalou league/html-to-markdown via Composer
// Comente estas linhas se não estiver usando Composer para esta biblioteca
// require_once __DIR__ . '/../../vendor/autoload.php'; 
// use League\HTMLToMarkdown\HtmlConverter;

$auth = new Auth();
if (!$auth->isLoggedIn()) {
    http_response_code(401);
    // Para um endpoint de download, um erro JSON pode não ser o ideal,
    // mas para consistência com outras APIs...
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Não autenticado.']);
    exit;
}

$userId = $auth->getUserId();
$dataType = trim(filter_input(INPUT_GET, 'type', FILTER_DEFAULT) ?? ''); // Usar FILTER_DEFAULT
$format = trim(filter_input(INPUT_GET, 'format', FILTER_DEFAULT) ?? 'json');
$itemId = filter_input(INPUT_GET, 'itemId', FILTER_VALIDATE_INT);

if (empty($dataType) || !in_array($format, ['json', 'txt', 'md'])) { // Adicionado 'md'
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Tipo de dado ou formato de exportação inválido.']);
    exit;
}

$filename = "export_data_" . date('Ymd_His'); // Nome de arquivo mais único
$content = "";
$contentType = "application/octet-stream"; // Default para forçar download

// Inicializar HtmlConverter se a biblioteca estiver disponível
$htmlConverter = null;
if (class_exists('League\HTMLToMarkdown\HtmlConverter')) {
    $htmlConverter = new League\HTMLToMarkdown\HtmlConverter(['header_style' => 'atx', 'strip_tags' => true]);
}

function convertToMarkdown($htmlContent, $converterInstance) {
    if ($converterInstance && !empty($htmlContent)) {
        try {
            return $converterInstance->convert($htmlContent);
        } catch (Exception $e) {
            // Em caso de erro na conversão, retorna o texto com tags removidas
            return strip_tags($htmlContent);
        }
    }
    return strip_tags($htmlContent ?? ''); // Fallback se não houver conversor ou conteúdo
}


if ($dataType === 'history_all') {
    $promptService = new PromptService();
    // Usar o método que pega todos os dados com texto completo
    $historyItems = $promptService->getAllHistoryForUserForExport($userId); 

    if (empty($historyItems)) {
        header('Content-Type: text/html; charset=utf-8');
        echo "<script>alert('Nenhum histórico para exportar.'); window.history.back();</script>";
        exit;
    }

    $filename = "meu_historico_prompts_" . date('Ymd');
    if ($format === 'json') {
        $contentType = "application/json; charset=utf-8";
        $filename .= ".json";
        $content = json_encode($historyItems, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } elseif ($format === 'txt') {
        $contentType = "text/plain; charset=utf-8";
        $filename .= ".txt";
        $txtContent = "Histórico de Prompts - " . APP_NAME . "\n";
        $txtContent .= "Exportado em: " . date('d/m/Y H:i:s') . "\n";
        $txtContent .= "==================================================\n\n";
        foreach ($historyItems as $item) {
            $inputParams = json_decode($item['input_parameters'], true);
            $finalPrompt = $inputParams['final_prompt_text'] ?? ($inputParams['raw_prompt_text'] ?? 'N/A');
            
            $txtContent .= "Data: " . date('d/m/Y H:i', strtotime($item['created_at'])) . "\n";
            $txtContent .= "ID: " . $item['id'] . "\n";
            $txtContent .= "Input (Prompt Enviado):\n" . $finalPrompt . "\n\n";
            $txtContent .= "Output (Resultado Gerado):\n" . ($item['generated_text'] ?? 'N/A') . "\n";
            $txtContent .= "--------------------------------------------------\n\n";
        }
        $content = $txtContent;
    } 
    elseif ($format === 'md') {
        $contentType = "text/markdown; charset=utf-8";
        $filename .= ".md";
        $mdContent = "# Histórico de Prompts - " . APP_NAME . "\n\n";
        $mdContent .= "**Exportado em:** " . date('d/m/Y H:i:s') . "\n\n";
        
        foreach ($historyItems as $item) {
            $inputParams = json_decode($item['input_parameters'], true);
            $finalPrompt = $inputParams['final_prompt_text'] ?? ($inputParams['raw_prompt_text'] ?? 'N/A');
            $generatedOutput = $item['generated_text'] ?? 'N/A';

            // Limpeza básica para Markdown, normaliza quebras de linha
            $finalPromptMd = trim(str_replace(["\r\n", "\r"], "\n", $finalPrompt));
            $generatedOutputMd = trim(str_replace(["\r\n", "\r"], "\n", $generatedOutput));

            $mdContent .= "## Prompt ID: " . $item['id'] . " (Gerado em: " . date('d/m/Y H:i', strtotime($item['created_at'])) . ")\n\n";
            $mdContent .= "### Input (Prompt Enviado):\n";
            $mdContent .= "```text\n" . $finalPromptMd . "\n```\n\n";
            $mdContent .= "### Output (Resultado Gerado):\n";
            $mdContent .= "```text\n" . $generatedOutputMd . "\n```\n\n";
            $mdContent .= "---\n\n";
        }
        $content = $mdContent;
    }

} elseif ($dataType === 'template_single' && $itemId) {
    $templateManager = new TemplateManager();
    $template = $templateManager->getTemplateByIdForUser($itemId, $userId);

    if (!$template) { /* ... (erro 404 como antes) ... */ }
    $safeTemplateName = preg_replace('/[^a-z0-9_-]/i', '_', $template['name']);
    $filename = "template_" . $safeTemplateName . "_" . date('Ymd');

    if ($format === 'json') { /* ... (como antes) ... */ }
    elseif ($format === 'txt') { /* ... (como antes) ... */ }
    elseif ($format === 'md') {
        $contentType = "text/markdown; charset=utf-8";
        $filename .= ".md";
        $mdContent = "# Template de Prompt: " . htmlspecialchars($template['name']) . "\n\n";
        if (!empty($template['description'])) {
            $mdContent .= "**Descrição:** " . htmlspecialchars($template['description']) . "\n\n";
        }
        $mdContent .= "## Estrutura do Prompt:\n";
        $mdContent .= "```\n" . trim(str_replace(["\r\n", "\r"], "\n", $template['prompt_structure'])) . "\n```\n\n"; // Usar ``` sem 'text' para prompts genéricos
        
        $customFields = $template['custom_fields_decoded'] ?? (json_decode($template['custom_fields'] ?? '[]', true));
        if (!empty($customFields)) {
            $mdContent .= "## Campos Personalizados Definidos:\n";
            foreach ($customFields as $field) {
                $mdContent .= "- **Nome Placeholder:** `" . htmlspecialchars($field['name']) . "`\n";
                $mdContent .= "  - **Rótulo:** " . htmlspecialchars($field['label']) . "\n";
                $mdContent .= "  - **Tipo:** " . htmlspecialchars($field['type']) . "\n";
                if ($field['required']) $mdContent .= "  - **Obrigatório:** Sim\n";
                if (!empty($field['placeholder'])) $mdContent .= "  - **Placeholder/Padrão:** " . htmlspecialchars($field['placeholder']) . "\n";
                if ($field['type'] === 'select' && !empty($field['options'])) {
                     $mdContent .= "  - **Opções:** " . htmlspecialchars(implode(", ", $field['options'])) . "\n";
                }
            }
            $mdContent .= "\n";
        } else { $mdContent .= "Nenhum campo personalizado definido.\n\n"; }
        $content = $mdContent;
    }

} elseif ($dataType === 'history_single' && $itemId) {
    $promptService = new PromptService();
    // Usar getHistoryItemByIdForUser que retorna o texto completo
    $item = $promptService->getHistoryItemByIdForUser($itemId, $userId);

    if (!$item) {
        http_response_code(404); header('Content-Type: application/json');
        echo json_encode(['error' => 'Item do histórico não encontrado.']); exit;
    }
    $safeItemId = "item_historico_" . $item['id'] . "_" . date('Ymd', strtotime($item['created_at']));
    $filename = $safeItemId;

    if ($format === 'json') {
        $contentType = "application/json; charset=utf-8"; $filename .= ".json";
        $content = json_encode($item, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } elseif ($format === 'txt') {
        $contentType = "text/plain; charset=utf-8"; $filename .= ".txt";
        $inputParams = json_decode($item['input_parameters'], true);
        $finalPrompt = $inputParams['final_prompt_text'] ?? ($inputParams['raw_prompt_text'] ?? 'N/A');
        $txtContent = "Item do Histórico: ID " . $item['id'] . "\n";
        $txtContent .= "Data: " . date('d/m/Y H:i', strtotime($item['created_at'])) . "\n";
        $txtContent .= "==================================================\n";
        $txtContent .= "Input (Prompt Enviado):\n" . $finalPrompt . "\n\n";
        $txtContent .= "Output (Resultado Gerado):\n" . ($item['generated_text'] ?? 'N/A') . "\n";
        $content = $txtContent;
    } elseif ($format === 'md') {
        $contentType = "text/markdown; charset=utf-8"; $filename .= ".md";
        $inputParams = json_decode($item['input_parameters'], true);
        $finalPrompt = $inputParams['final_prompt_text'] ?? ($inputParams['raw_prompt_text'] ?? 'N/A');
        $generatedOutput = $item['generated_text'] ?? 'N/A';

        $finalPromptMd = trim(str_replace(["\r\n", "\r"], "\n", $finalPrompt));
        $generatedOutputMd = trim(str_replace(["\r\n", "\r"], "\n", $generatedOutput));

        $mdContent = "# Item do Histórico (ID: " . $item['id'] . ")\n\n";
        $mdContent .= "**Data:** " . date('d/m/Y H:i', strtotime($item['created_at'])) . "\n\n";
        $mdContent .= "## Input (Prompt Enviado):\n";
        $mdContent .= "```text\n" . $finalPromptMd . "\n```\n\n";
        $mdContent .= "## Output (Resultado Gerado):\n";
        $mdContent .= "```text\n" . $generatedOutputMd . "\n```\n\n";
        $content = $mdContent;
    }
} else {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Parâmetros de exportação inválidos ou tipo não suportado.']);
    exit;
}

if (empty($content) && $format !== 'json') { // JSON pode ser um array vazio '[]' que não é "empty" mas é válido
    if ($format === 'json' && $content === "[]"){
        // Permite JSON array vazio
    } else {
        header('Content-Type: text/html; charset=utf-8');
        echo "<script>alert('Nenhum conteúdo para exportar com os parâmetros fornecidos ou ocorreu um erro.'); window.history.back();</script>";
        exit;
    }
}

// Garante que o nome do arquivo seja seguro para o header Content-Disposition
$filename = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $filename);

header('Content-Description: File Transfer');
header('Content-Type: ' . $contentType);
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . mb_strlen($content, '8bit')); // Use mb_strlen para contagem correta de bytes com UTF-8
flush(); 
echo $content;
exit;
?>