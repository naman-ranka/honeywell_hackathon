// static/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');
    const factoryDescription = document.getElementById('factoryDescription');

    const statusArea = document.getElementById('statusArea');
    const overallStatus = document.getElementById('overallStatus');
    const statusChecklist = document.getElementById('statusChecklist');

    const outputArea = document.getElementById('outputArea');
    const logOutput = document.getElementById('logOutput');
    const rawLLMOutput = document.getElementById('rawLLMOutput');
    const copyRawLLMButton = document.getElementById('copyRawLLMButton');
    const workspaceJsonOutput = document.getElementById('workspaceJsonOutput');
    const componentTypesJsonOutput = document.getElementById('componentTypesJsonOutput');
    const entitiesJsonOutput = document.getElementById('entitiesJsonOutput');
    const assetsJsonOutput = document.getElementById('assetsJsonOutput');
    const sceneJsonOutput = document.getElementById('sceneJsonOutput');
    const connectionsJsonOutput = document.getElementById('connectionsJsonOutput');

    const outputTabs = new bootstrap.Tab(document.getElementById('logs-tab')); // For activating tabs programmatically

    // Initialize copy button
    if (copyRawLLMButton) {
        copyRawLLMButton.addEventListener('click', () => {
            copyToClipboard(rawLLMOutput);
        });
    }

    // --- Helper Functions ---
    function setButtonLoading(isLoading) {
        if (isLoading) {
            buttonText.textContent = 'Processing...';
            buttonSpinner.classList.remove('d-none');
            generateButton.disabled = true;
        } else {
            buttonText.textContent = 'Build Factory Twin';
            buttonSpinner.classList.add('d-none');
            generateButton.disabled = false;
        }
    }

    function resetUIState() {
        statusArea.style.display = 'none';
        outputArea.style.display = 'none';
        overallStatus.textContent = '';
        overallStatus.className = 'alert'; // Reset alert class
        logOutput.textContent = 'Execution logs will appear here...';
        rawLLMOutput.textContent = 'Raw LLM output will appear here...';
        workspaceJsonOutput.textContent = 'Workspace JSON from LLM will appear here...';
        componentTypesJsonOutput.textContent = 'Component Types JSON from LLM will appear here...';
        entitiesJsonOutput.textContent = 'Entities JSON from LLM will appear here...';
        assetsJsonOutput.textContent = 'Assets JSON from LLM will appear here...';
        sceneJsonOutput.textContent = 'Scene JSON from LLM will appear here...';
        connectionsJsonOutput.textContent = 'Connections JSON from LLM will appear here...';

        // Reset checklist icons
        const listItems = statusChecklist.querySelectorAll('li');
        listItems.forEach(item => {
            const icon = item.querySelector('i');
            icon.className = 'bi bi-question-circle'; // Reset to default pending icon
        });

        // Ensure the Log tab is active initially when results are shown
        const logTabElement = document.getElementById('logs-tab');
        const logTab = bootstrap.Tab.getInstance(logTabElement) || new bootstrap.Tab(logTabElement);
        logTab.show();
    }

    function updateChecklistItem(stepKey, status) {
        const listItem = statusChecklist.querySelector(`li[data-step="${stepKey}"]`);
        if (listItem) {
            const icon = listItem.querySelector('i');
            switch (status) {
                case 'pending': // Or a new status if backend sends intermediate updates
                    icon.className = 'bi bi-hourglass-split';
                    break;
                case 'success':
                    icon.className = 'bi bi-check-circle-fill text-success';
                    break;
                case 'failed':
                    icon.className = 'bi bi-x-circle-fill text-danger';
                    break;
                case 'skipped':
                    icon.className = 'bi bi-skip-forward-fill text-secondary';
                     // Optionally add text like "(Skipped)"
                     if (!listItem.textContent.includes('Skipped')) {
                         listItem.appendChild(document.createTextNode(" (Skipped)"));
                     }
                    break;
                default:
                    icon.className = 'bi bi-question-circle'; // Unknown state
            }
        } else {
            console.warn(`Checklist item for step "${stepKey}" not found.`);
        }
    }

    function displayResults(data) {
        statusArea.style.display = 'block';
        outputArea.style.display = 'block';

        // Overall Status
        overallStatus.textContent = data.message || 'Process finished.';
        if (data.status === 'success') {
            overallStatus.className = 'alert alert-success';
        } else if (data.status === 'error') {
            overallStatus.className = 'alert alert-danger';
        } else {
            overallStatus.className = 'alert alert-info';
        }

        // Step Status Checklist
        if (data.step_status) {
            for (const [key, status] of Object.entries(data.step_status)) {
                updateChecklistItem(key, status);
            }
             // Update any steps not explicitly returned (e.g., if process failed early)
             const allSteps = Array.from(statusChecklist.querySelectorAll('li')).map(li => li.getAttribute('data-step'));
             allSteps.forEach(stepKey => {
                 if (!(stepKey in data.step_status)) {
                    // If a step wasn't reported, mark it based on overall status or as pending/unknown
                    updateChecklistItem(stepKey, data.status === 'error' ? 'failed' : 'pending'); // Or maybe 'skipped' if appropriate
                 }
             });
        } else {
             // If no step_status provided, mark all based on overall status
              const allSteps = Array.from(statusChecklist.querySelectorAll('li')).map(li => li.getAttribute('data-step'));
              allSteps.forEach(stepKey => updateChecklistItem(stepKey, data.status === 'success' ? 'success' : 'failed'));
        }


        // Logs
        logOutput.textContent = data.logs || 'No logs received.';

        // JSON Outputs - use try-catch for safety
        try {
             // Display raw LLM output with syntax highlighting
             if (data.raw_llm_response) {
                 // First set as text content for safety
                 rawLLMOutput.textContent = data.raw_llm_response;
                 
                 // Then try to apply syntax highlighting 
                 try {
                     // Create highlighted HTML for the JSON
                     let rawText = data.raw_llm_response;
                     // If it's a JSON response from raw LLM, try to beautify it
                     if (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) {
                         try {
                             // Parse and re-stringify for proper formatting
                             const jsonObj = JSON.parse(rawText);
                             rawText = JSON.stringify(jsonObj, null, 2);
                         } catch (e) {
                             console.log("Raw LLM response is not valid JSON, using as-is");
                         }
                     }
                     
                     // Create a code element with the proper class for Prism
                     const codeElement = document.createElement('code');
                     codeElement.className = 'language-json';
                     codeElement.textContent = rawText;
                     
                     // Create a pre element to hold the code
                     const preElement = document.createElement('pre');
                     preElement.className = 'language-json';
                     preElement.appendChild(codeElement);
                     
                     // Clear the container and add the highlighted code
                     rawLLMOutput.innerHTML = '';
                     rawLLMOutput.appendChild(preElement);
                     
                     // Apply Prism highlighting
                     if (typeof Prism !== 'undefined') {
                         Prism.highlightElement(codeElement);
                     }
                 } catch (highlightError) {
                     console.error("Error applying syntax highlighting:", highlightError);
                     // Fallback to plain text if highlighting fails
                     rawLLMOutput.textContent = data.raw_llm_response;
                 }
             } else if (data.gemini_json) {
                 rawLLMOutput.textContent = JSON.stringify(data.gemini_json, null, 2);
             } else {
                 rawLLMOutput.textContent = 'No raw LLM output available.';
             }

             // Display individual component JSONs
             workspaceJsonOutput.textContent = data.gemini_json?.workspace ? JSON.stringify(data.gemini_json.workspace, null, 2) : 'No Workspace JSON received.';
             componentTypesJsonOutput.textContent = data.gemini_json?.componentTypes ? JSON.stringify(data.gemini_json.componentTypes, null, 2) : 'No Component Types JSON received.';
             entitiesJsonOutput.textContent = data.gemini_json?.entities ? JSON.stringify(data.gemini_json.entities, null, 2) : 'No Entities JSON received.';
             assetsJsonOutput.textContent = data.gemini_json?.assets ? JSON.stringify(data.gemini_json.assets, null, 2) : 'No Assets JSON received.';
             sceneJsonOutput.textContent = data.gemini_json?.scene ? JSON.stringify(data.gemini_json.scene, null, 2) : 'No Scene JSON received.';
             connectionsJsonOutput.textContent = data.gemini_json?.connections ? JSON.stringify(data.gemini_json.connections, null, 2) : 'No Connections JSON received.';
             
             // Apply syntax highlighting to all JSON outputs
             applyPrismHighlighting();
        } catch (e) {
            console.error("Error stringifying JSON response:", e);
             // Display raw or error message in tabs
             workspaceJsonOutput.textContent = `Error displaying JSON: ${e.message}`;
             // ... repeat for other JSON outputs ...
             logOutput.textContent += "\n\nError displaying JSON outputs in UI.";
        }
    }
    
    /**
     * Applies Prism.js syntax highlighting to all JSON output elements
     */
    function applyPrismHighlighting() {
        if (typeof Prism === 'undefined') return;
        
        const jsonOutputs = document.querySelectorAll('.json-output');
        jsonOutputs.forEach(element => {
            if (element.textContent.trim().startsWith('{') || element.textContent.trim().startsWith('[')) {
                try {
                    const text = element.textContent;
                    const codeElement = document.createElement('code');
                    codeElement.className = 'language-json';
                    codeElement.textContent = text;
                    
                    const preElement = document.createElement('pre');
                    preElement.className = 'language-json';
                    preElement.appendChild(codeElement);
                    
                    element.innerHTML = '';
                    element.appendChild(preElement);
                    
                    Prism.highlightElement(codeElement);
                } catch (error) {
                    console.warn("Failed to apply syntax highlighting to element:", error);
                }
            }
        });
    }

    function displayError(errorMessage) {
        statusArea.style.display = 'block';
        outputArea.style.display = 'none'; // Hide output tabs on fetch error
        overallStatus.textContent = `An error occurred: ${errorMessage}`;
        overallStatus.className = 'alert alert-danger';
        // Reset checklist or mark all as failed
        const listItems = statusChecklist.querySelectorAll('li');
        listItems.forEach(item => {
             const icon = item.querySelector('i');
             icon.className = 'bi bi-x-circle-fill text-danger';
        });
    }

    /**
     * Copies text from the given element to clipboard
     */
    function copyToClipboard(element) {
        if (!element) return;
        
        let textToCopy = '';
        
        // Get the actual text content
        if (element.querySelector('code')) {
            // If we have highlighted code, get the text from there
            textToCopy = element.querySelector('code').textContent;
        } else {
            // Otherwise get the direct text content
            textToCopy = element.textContent;
        }
        
        // Create a temporary textarea to copy from
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        // Select and copy
        textarea.select();
        document.execCommand('copy');
        
        // Clean up
        document.body.removeChild(textarea);
        
        // Visual feedback
        const originalText = copyRawLLMButton.innerHTML;
        copyRawLLMButton.innerHTML = '<i class="bi bi-check2"></i> Copied!';
        copyRawLLMButton.classList.add('btn-success');
        
        // Reset after 2 seconds
        setTimeout(() => {
            copyRawLLMButton.innerHTML = originalText;
            copyRawLLMButton.classList.remove('btn-success');
        }, 2000);
    }

    // --- Event Listener ---
    generateButton.addEventListener('click', async () => {
        const description = factoryDescription.value.trim();
        if (!description) {
            alert('Please enter a factory description.');
            return;
        }

        resetUIState();
        setButtonLoading(true);
        statusArea.style.display = 'block'; // Show status area immediately
        overallStatus.textContent = 'Sending description to backend...';
        overallStatus.className = 'alert alert-info';
        // Optional: Set initial checklist state to pending/loading
        const listItems = statusChecklist.querySelectorAll('li i');
        listItems.forEach(icon => icon.className = 'bi bi-hourglass-split');


        try {
            const response = await fetch('/api/build-full-twin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description: description }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle HTTP errors (e.g., 400, 500)
                throw new Error(result.error || `Server responded with status ${response.status}`);
            }

            // Handle successful response from backend (which might still indicate partial success/failure)
            displayResults(result);

        } catch (error) {
            console.error('Error during API call:', error);
            displayError(error.message);
        } finally {
            setButtonLoading(false);
        }
    });

});