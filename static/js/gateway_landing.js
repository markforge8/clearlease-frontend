// ClearLease MVP - Frontend JavaScript
// Handles API communication and UI updates

// API Configuration
const BACKEND_BASE_URL = 'https://clearlease-production.up.railway.app';
// Ensure BACKEND_BASE_URL is always set
const BASE_URL = BACKEND_BASE_URL || 'https://clearlease-production.up.railway.app';

const API_ENDPOINT = BASE_URL + '/analyze';
const API_INGEST_ENDPOINT = BASE_URL + '/ingest';
const API_HISTORY_ENDPOINT = BASE_URL + '/history';
const API_EXPORT_PDF_ENDPOINT = BASE_URL + '/export/pdf';
const API_LOGIN_ENDPOINT = BASE_URL + '/api/auth/login';
const API_REGISTER_ENDPOINT = BASE_URL + '/api/auth/register';
const API_ME_ENDPOINT = BASE_URL + '/api/auth/me';

// Debug: Log API endpoints
console.log('BACKEND_BASE_URL:', BACKEND_BASE_URL);
console.log('BASE_URL:', BASE_URL);
console.log('API_HISTORY_ENDPOINT:', API_HISTORY_ENDPOINT);

// DOM Elements
const leaseTextarea = document.getElementById('leaseText');
const fileUpload = document.getElementById('fileUpload');
const analyzeButton = document.getElementById('analyzeButton');
const resultsSection = document.getElementById('resultsSection');
const riskItemsContainer = document.getElementById('riskItems');
const overviewContainer = document.getElementById('overview');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');

// Login Elements
const loginSection = document.getElementById('loginSection');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const loginMessage = document.getElementById('loginMessage');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
const explicitLoginButton = document.getElementById('explicitLoginButton');

// Event Listeners
analyzeButton.addEventListener('click', handleAnalyze);
loginButton.addEventListener('click', handleLogin);
registerButton.addEventListener('click', handleRegister);
logoutButton.addEventListener('click', handleLogout);
explicitLoginButton.addEventListener('click', () => {
    loginSection.style.display = 'block';
});

// Handle Enter key in textarea (Ctrl+Enter or Cmd+Enter)
leaseTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleAnalyze();
    }
});

// Handle Enter key in email input
emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

// Handle Enter key in password input
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

// Initialize app
window.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Validate token and get user info
        try {
            const userData = await fetchUserInfo();
            if (userData) {
                updateUserInfo(userData);
                // Hide login button when signed in
                explicitLoginButton.style.display = 'none';
                // Check user status and redirect if needed
                checkUserStatusAndRedirect(userData);
                // Check for recoverable analysis
                await checkForRecoverableAnalysis();
            }
        } catch (error) {
            // Token invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Show login button when signed out
            explicitLoginButton.style.display = 'block';
        }
    } else {
        // Show login button when signed out
        explicitLoginButton.style.display = 'block';
    }
    

});

/**
 * Check for recoverable analysis from backend
 */
async function checkForRecoverableAnalysis() {
    const token = localStorage.getItem('token');
    const analysisId = localStorage.getItem('analysis_id');
    
    if (!token || !analysisId) {
        return;
    }
    
    try {
        // Request backend for current user status and recoverable analysis
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user status');
        }
        
        const data = await response.json();
        if (data.success && data.data.analysis) {
            // Backend returned analysis, render it according to new control flow
            console.log('Recovered analysis:', data.data.analysis);
            displayAnalysisResults(data.data.analysis);
        }
    } catch (error) {
        console.error('Error checking for recoverable analysis:', error);
    }
}



/**
 * Handle login
 */
async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        loginMessage.textContent = 'Please enter both email and password';
        return;
    }
    
    loginButton.disabled = true;
    registerButton.disabled = true;
    loginMessage.textContent = 'Logging in...';
    
    try {
        const response = await fetch(API_LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save token and user info
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Update UI
            updateUserInfo(data.data.user);
            loginMessage.textContent = 'Login successful!';
            
            // Hide login button
            explicitLoginButton.style.display = 'none';
            
            // Redirect based on paid status
            checkUserStatusAndRedirect(data.data.user);
        } else {
            loginMessage.textContent = 'Login failed: ' + (data.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        loginMessage.textContent = 'Error logging in. Please try again.';
    } finally {
        loginButton.disabled = false;
        registerButton.disabled = false;
    }
}

/**
 * Handle register
 */
async function handleRegister() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        loginMessage.textContent = 'Please enter both email and password';
        return;
    }
    
    loginButton.disabled = true;
    registerButton.disabled = true;
    loginMessage.textContent = 'Registering...';
    
    try {
        const response = await fetch(API_REGISTER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save token and user info
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Update UI
            updateUserInfo(data.data.user);
            loginMessage.textContent = 'Registration successful!';
            
            // Hide login button
            explicitLoginButton.style.display = 'none';
            
            // Redirect based on paid status
            checkUserStatusAndRedirect(data.data.user);
        } else {
            loginMessage.textContent = 'Registration failed: ' + (data.message || 'Invalid information');
        }
    } catch (error) {
        console.error('Register error:', error);
        loginMessage.textContent = 'Error registering. Please try again.';
    } finally {
        loginButton.disabled = false;
        registerButton.disabled = false;
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    // Clear token and user info
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('analysis_id');
    
    // Update UI
    clearUserInfo();
    
    // Show login button
    explicitLoginButton.style.display = 'block';
    
    // Redirect to login page (home)
    window.location.href = '/';
}

/**
 * Update user info display
 */
function updateUserInfo(user) {
    if (user) {
        userEmail.textContent = user.email;
        userInfo.style.display = 'block';
        loginSection.style.display = 'none';
        
        // Add dev reset button if in development environment
        addDevResetButton();
        
        // Add history button
        addHistoryButton();
    } else {
        clearUserInfo();
    }
}

/**
 * Add history button to user info section
 */
function addHistoryButton() {
    // Check if button already exists
    if (document.getElementById('historyButton')) {
        return;
    }
    
    // Create history button
    const historyButton = document.createElement('button');
    historyButton.id = 'historyButton';
    historyButton.textContent = 'Saved Analyses';
    historyButton.style.cssText = `
        background-color: #17a2b8;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.9rem;
        cursor: pointer;
        margin-top: 0.5rem;
        width: 100%;
    `;
    
    // Add click event listener
    historyButton.addEventListener('click', async () => {
        try {
            updateLoadingMessage('Loading saved analyses...');
            const history = await fetchHistory();
            toggleHistorySection();
            displayHistory(history);
        } catch (error) {
            console.error('Error fetching history:', error);
            showError(`Failed to load history: ${error.message}`);
        } finally {
            hideLoading();
        }
    });
    
    // Add button to user info section
    if (userInfo) {
        userInfo.appendChild(historyButton);
    }
}

/**
 * Toggle history section visibility
 */
function toggleHistorySection() {
    const historySection = document.getElementById('historySection');
    if (!historySection) {
        // Create history section if it doesn't exist
        const historySection = document.createElement('div');
        historySection.id = 'historySection';
        historySection.className = 'history-section';
        historySection.style.cssText = `
            margin-top: 2rem;
            padding: 2rem;
            background-color: #f8f9fa;
            border-radius: 8px;
            display: block;
        `;
        
        const historyHeader = document.createElement('h2');
        historyHeader.textContent = 'Saved Analyses';
        historyHeader.style.cssText = `
            margin-bottom: 0.5rem;
            font-size: 1.5rem;
            font-weight: 400;
        `;
        
        const historyExplanation = document.createElement('p');
        historyExplanation.style.cssText = `
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
            color: #666666;
            line-height: 1.5;
        `;
        historyExplanation.textContent = 'Your past analyses are saved automatically when you\'re logged in.';
        
        historySection.appendChild(historyHeader);
        historySection.appendChild(historyExplanation);
        
        // Insert after input section
        const inputSection = document.querySelector('.input-section');
        if (inputSection) {
            inputSection.parentNode.insertBefore(historySection, inputSection.nextSibling);
        }
    } else {
        // Toggle visibility
        historySection.style.display = historySection.style.display === 'none' ? 'block' : 'block';
    }
}

/**
 * Add dev reset button for Pro status
 */
function addDevResetButton() {
    // Check if button already exists
    if (document.getElementById('devResetButton')) {
        return;
    }
    
    // Create reset button
    const resetButton = document.createElement('button');
    resetButton.id = 'devResetButton';
    resetButton.textContent = 'Reset Pro Status (Dev Only)';
    resetButton.style.cssText = `
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        margin-top: 0.5rem;
        width: 100%;
    `;
    
    // Add click event listener
    resetButton.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first');
            return;
        }
        
        try {
            // Call reset-paid endpoint
            const response = await fetch(`${BACKEND_BASE_URL}/api/dev/reset-paid`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('Reset Pro status response:', data);
            
            if (data.success) {
                // Reset successful, refresh user info
                const userData = await fetchUserInfo();
                if (userData) {
                    updateUserInfo(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                    alert('Pro status reset successfully');
                }
            } else {
                alert('Failed to reset Pro status: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error resetting Pro status:', error);
            alert('Error resetting Pro status: ' + error.message);
        }
    });
    
    // Add button to user info section
    if (userInfo) {
        userInfo.appendChild(resetButton);
    }
}

/**
 * Clear user info display
 */
function clearUserInfo() {
    userEmail.textContent = '';
    userInfo.style.display = 'none';
}

/**
 * Fetch user info from API
 */
async function fetchUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No token');
    }
    
    console.log('Fetching user info with token:', token.substring(0, 20) + '...');
    
    const response = await fetch(API_ME_ENDPOINT, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    console.log('Fetch user info response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch user info error response:', errorText);
        throw new Error('Failed to fetch user info');
    }
    
    const data = await response.json();
    console.log('Fetch user info response data:', data);
    
    if (data.success) {
        console.log('User info fetched successfully:', data.data);
        console.log('User paid status:', data.data.paid);
        return data.data;
    } else {
        console.error('Failed to fetch user info:', data.message);
        throw new Error('Failed to fetch user info');
    }
}

/**
 * Check user status and redirect if needed
 */
function checkUserStatusAndRedirect(user) {
    if (!user) {
        // Not logged in, show login page
        window.location.href = '/';
        return;
    }
    
    // User is logged in, no need to check paid status here
    // Backend will handle it and return locked status in API responses
}

/**
 * Show free version
 */
async function showFreeVersion() {
    // Remove any existing login prompt
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) {
        loginPrompt.remove();
    }
}

/**
 * Show upgrade CTA for free users
 */
function showUpgradeCTA() {
    // Check if upgrade CTA already exists
    if (document.getElementById('upgradeCTA')) {
        return;
    }
    
    // Add upgrade CTA to the results section
    const upgradeCTA = document.createElement('div');
    upgradeCTA.id = 'upgradeCTA';
    upgradeCTA.className = 'upgrade-cta';
    upgradeCTA.innerHTML = `
        <h3>Upgrade to Unlock All Features</h3>
        <p>Get unlimited analyses, detailed explanations, and more with a paid plan for just $7.99.</p>
        <button class="upgrade-button">Upgrade Now</button>
    `;
    
    // Add event listener to upgrade button
    upgradeCTA.querySelector('.upgrade-button').addEventListener('click', () => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            // Not logged in, show login section
            loginSection.style.display = 'block';
        } else {
            // Logged in, redirect to Gumroad payment page with return URL
            // Replace with actual Gumroad URL that redirects back to payment/success
            const currentDomain = window.location.origin;
            window.location.href = `https://gumroad.com/l/clearlease?return=${encodeURIComponent(currentDomain + '/payment/success')}`;
        }
    });
    
    // Insert before results section
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.parentNode.insertBefore(upgradeCTA, resultsSection);
    }
}

/**
 * Unlock all features for paid users
 */
function unlockAllFeatures() {
    // Remove upgrade CTA if it exists
    const upgradeCTA = document.getElementById('upgradeCTA');
    if (upgradeCTA) {
        upgradeCTA.remove();
    }
    
    // No need to show any payment prompts for paid users
}

/**
 * Main analysis handler
 */
async function handleAnalyze() {
    const leaseText = leaseTextarea.value.trim();
    const uploadedFile = fileUpload.files[0];

    // Validation
    if (!leaseText && !uploadedFile) {
        showError('Please paste your lease agreement text or upload a file before analyzing.');
        return;
    }

    if (leaseText && leaseText.length < 50) {
        showError('Please provide a longer lease agreement text (at least 50 characters).');
        return;
    }
    
    // Get user info if logged in
    const token = localStorage.getItem('token');
    let userData;
    
    if (token) {
        try {
            userData = await fetchUserInfo();
            console.log('User info:', userData);
        } catch (error) {
            console.error('Error fetching user info:', error);
            // Continue with analysis even if user info fetch fails
            // Analysis should always be available
        }
    } else {
        console.log('User not logged in, proceeding with free analysis');
    }
    
    // Reset UI
    hideAllSections();
    showLoading();
    analyzeButton.disabled = true;

    try {
        let textToAnalyze = leaseText;
        
        // If file is uploaded, call /ingest endpoint
        if (uploadedFile) {
            updateLoadingMessage('Uploading file...');
            const ingestResponse = await callIngestEndpoint(uploadedFile, token);
            
            // Check for error in ingest response
            if (ingestResponse.error) {
                throw new Error(ingestResponse.error);
            }
            
            // Check if text exists
            if (!ingestResponse.text) {
                throw new Error('No text extracted from the file');
            }
            
            textToAnalyze = ingestResponse.text;
            
            // Optional: Display source_type hint
            if (ingestResponse.source_type) {
                console.log('Source type:', ingestResponse.source_type);
                // Add source type hint to results section
                addSourceTypeHint(ingestResponse.source_type);
            }
        }
        
        updateLoadingMessage('Analyzing risks...');
        
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                contract_text: textToAnalyze
            })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Save analysis_id if provided
        if (data.analysis_id) {
            localStorage.setItem('analysis_id', data.analysis_id);
        }
        
        // Display results according to new control flow
        console.log('Analysis results:', data);
        displayAnalysisResults(data);

    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Unable to analyze your lease. Please try again later. ${error.message}`);
    } finally {
        hideLoading();
        analyzeButton.disabled = false;
    }
}

/**
 * Call the /ingest endpoint to extract text from a file
 */
async function callIngestEndpoint(file, token) {
    updateLoadingMessage('Uploading file...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Prepare headers
    const headers = {};
    
    // Add authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(API_INGEST_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: formData
    });
    
    updateLoadingMessage('Extracting text...');
    
    if (!response.ok) {
        throw new Error(`Ingest failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
}

/**
 * Update the loading message
 */
function updateLoadingMessage(message) {
    if (loadingState) {
        loadingState.innerHTML = `<p>${message}</p>`;
    }
}

/**
 * Add source type hint to results section
 */
function addSourceTypeHint(sourceType) {
    // Create hint element if it doesn't exist
    let hintElement = document.getElementById('sourceTypeHint');
    if (!hintElement) {
        hintElement = document.createElement('div');
        hintElement.id = 'sourceTypeHint';
        hintElement.style.cssText = `
            margin: 1rem 0;
            padding: 1rem;
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            border-radius: 4px;
            font-size: 0.9rem;
            color: #666666;
        `;
        
        // Insert before results section
        if (resultsSection) {
            resultsSection.parentNode.insertBefore(hintElement, resultsSection);
        }
    }
    
    // Set hint text based on source type
    let hintText = '';
    switch (sourceType) {
        case 'pdf':
            hintText = 'PDF extracted text';
            break;
        case 'image':
            hintText = 'OCR extracted text';
            break;
        case 'txt':
            hintText = 'Text file content';
            break;
        default:
            hintText = 'Extracted text';
    }
    
    hintElement.innerHTML = `<p>${hintText}</p>`;
    hintElement.style.display = 'block';
}

/**
 * Fetch analysis history from the API
 */
async function fetchHistory() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('User not logged in');
    }
    
    console.log('Calling fetchHistory with API_HISTORY_ENDPOINT:', API_HISTORY_ENDPOINT);
    
    const response = await fetch(API_HISTORY_ENDPOINT, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.history || [];
}

/**
 * Display analysis history
 */
function displayHistory(history) {
    const historySection = document.getElementById('historySection');
    if (!historySection) {
        return;
    }
    
    if (history.length === 0) {
        historySection.innerHTML = '<p>No analysis history found.</p>';
        return;
    }
    
    const historyHTML = history.map(item => {
        const date = new Date(item.created_at).toLocaleString();
        return `
            <div class="history-item">
                <div class="history-item-header">
                    <div class="history-item-date">${date}</div>
                    <div class="history-item-risk risk-${item.risk_level}">${item.risk_level.charAt(0).toUpperCase() + item.risk_level.slice(1)}</div>
                </div>
                <div class="history-item-summary">${item.summary}</div>
                <div class="history-item-actions">
                    <button class="history-item-button" onclick="loadHistoryItem('${item.id}')">View Details</button>
                    <button class="history-item-button" onclick="exportToPDF('${item.id}')">Export PDF</button>
                </div>
            </div>
        `;
    }).join('');
    
    historySection.innerHTML = historyHTML;
}

/**
 * Load a specific history item
 */
async function loadHistoryItem(analysisId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showError('Please log in to view history items');
        return;
    }
    
    try {
        updateLoadingMessage('Loading saved analysis...');
        
        const response = await fetch(`${API_ENDPOINT}/${analysisId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load analysis: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        // Add flag to indicate this is a saved analysis
        data.isSavedAnalysis = true;
        displayAnalysisResults(data);
    } catch (error) {
        console.error('Error loading history item:', error);
        showError(`Failed to load analysis: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Add saved analysis indication to results section
 */
function addSavedAnalysisIndication() {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) {
        return;
    }
    
    // Check if indication already exists
    if (document.getElementById('savedAnalysisIndication')) {
        return;
    }
    
    // Create indication element
    const indication = document.createElement('div');
    indication.id = 'savedAnalysisIndication';
    indication.style.cssText = `
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
        border-radius: 4px;
        font-size: 0.9rem;
        color: #1976d2;
        font-weight: 500;
    `;
    indication.textContent = 'Viewing saved analysis (no new analysis was run)';
    
    // Insert at the top of results section
    if (resultsSection.firstChild) {
        resultsSection.insertBefore(indication, resultsSection.firstChild);
    } else {
        resultsSection.appendChild(indication);
    }
}

/**
 * Export analysis to PDF
 */
async function exportToPDF(analysisId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showError('Please log in to export to PDF');
        return;
    }
    
    try {
        updateLoadingMessage('Generating PDF...');
        
        const response = await fetch(`${API_EXPORT_PDF_ENDPOINT}?analysis_id=${analysisId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            // Handle 401/403 errors (login expired)
            if (response.status === 401 || response.status === 403) {
                showError('Please log in again to export PDF.');
                return;
            }
            // Handle other errors
            showError('Failed to export PDF. Please try again.');
            return;
        }
        
        // Handle PDF download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clearlease-analysis-${analysisId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        // Handle network errors
        showError('Failed to export PDF. Please try again.');
    } finally {
        hideLoading();
    }
}

/**
 * Render basic analysis
 */
function renderBasicAnalysis(basicResult) {
    // Display overview if available
    if (basicResult.overview) {
        displayOverview(basicResult.overview);
    }

    // Show basic analysis
    const riskItems = extractRiskItems(basicResult);
    if (riskItems.length > 0) {
        displayRiskItems(riskItems);
    } else {
        showNoRisksFound();
    }
}

/**
 * Render full analysis
 */
function renderFullAnalysis(fullResult) {
    if (!fullResult) return;
    
    // Show full analysis (add additional details if needed)
    // For now, we'll just display it as is
    const fullRiskItems = extractRiskItems(fullResult);
    if (fullRiskItems.length > 0) {
        // Create a section for full analysis
        const fullAnalysisSection = document.createElement('div');
        fullAnalysisSection.id = 'fullAnalysisSection';
        fullAnalysisSection.style.cssText = 'margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e0e0e0;';
        
        const fullAnalysisTitle = document.createElement('h3');
        fullAnalysisTitle.textContent = 'Detailed Analysis';
        fullAnalysisTitle.style.cssText = 'margin-bottom: 1rem;';
        
        fullAnalysisSection.appendChild(fullAnalysisTitle);
        
        // Add full analysis items
        const fullRiskItemsContainer = document.createElement('div');
        fullRiskItemsContainer.innerHTML = fullRiskItems.map(item => {
            const severityClass = normalizeSeverity(item.severity);
            const severityLabel = severityClass.charAt(0).toUpperCase() + severityClass.slice(1);

            return `
                <div class="risk-item severity-${severityClass}">
                    <div class="risk-item-header">
                        <div class="risk-item-title">${escapeHtml(item.title)}</div>
                        <div class="risk-item-severity ${severityClass}">Detailed: ${severityLabel}</div>
                    </div>
                    <div class="risk-item-message">${escapeHtml(item.message)}</div>
                    ${item.action ? `<div class="risk-item-action">Recommended: ${escapeHtml(item.action)}</div>` : ''}
                </div>
            `;
        }).join('');
        
        fullAnalysisSection.appendChild(fullRiskItemsContainer);
        
        // Add to results section
        if (resultsSection) {
            resultsSection.appendChild(fullAnalysisSection);
        }
    }
}

/**
 * Render upgrade CTA
 */
function renderUpgradeCTA() {
    addUpgradePromptToResults();
}

/**
 * Display analysis results according to new control flow
 */
function displayAnalysisResults(data) {
    // Hide loading and error states
    hideAllSections();

    // Check if this is a saved analysis
    if (data.isSavedAnalysis) {
        addSavedAnalysisIndication();
    } else {
        // Remove indication if it exists
        const indication = document.getElementById('savedAnalysisIndication');
        if (indication) {
            indication.remove();
        }
    }

    // Always render basic analysis
    if (data.basic_result) {
        renderBasicAnalysis(data.basic_result);
    } else {
        // If no basic_result, show no risks found
        showNoRisksFound();
    }

    // Handle locked status
    if (data.locked) {
        // Show upgrade CTA for locked users
        renderUpgradeCTA();
    } else {
        // Show full analysis for unlocked users
        if (data.full_result) {
            renderFullAnalysis(data.full_result);
        }
    }

    // Show results section
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Display analysis results
 */
function displayResults(data) {
    // This function is now deprecated, use displayFullAnalysis or displayPreviewAnalysis instead
    console.warn('displayResults is deprecated, use displayFullAnalysis or displayPreviewAnalysis instead');
    displayPreviewAnalysis(data);
}

/**
 * Add upgrade prompt to results section when locked
 */
function addUpgradePromptToResults() {
    // Check if upgrade prompt already exists
    if (document.getElementById('lockedUpgradePrompt')) {
        return;
    }
    
    // Add upgrade prompt to results section
    const upgradePrompt = document.createElement('div');
    upgradePrompt.id = 'lockedUpgradePrompt';
    upgradePrompt.className = 'upgrade-cta';
    upgradePrompt.innerHTML = `
        <h3>Upgrade to Unlock Full Analysis</h3>
        <p>This is a preview of your analysis. Upgrade to a paid plan to see the complete details.</p>
        <button class="upgrade-button">Upgrade Now</button>
    `;
    
    // Add event listener to upgrade button
    upgradePrompt.querySelector('.upgrade-button').addEventListener('click', () => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            // Not logged in, show login section
            loginSection.style.display = 'block';
        } else {
            // Logged in, redirect to Gumroad payment page with return URL
            // Replace with actual Gumroad URL that redirects back to payment/success
            const currentDomain = window.location.origin;
            window.location.href = `https://gumroad.com/l/clearlease?return=${encodeURIComponent(currentDomain + '/payment/success')}`;
        }
    });
    
    // Insert into results section
    if (resultsSection) {
        resultsSection.appendChild(upgradePrompt);
    }
}

/**
 * Extract risk items from API response
 * Handles different response formats (key_findings, risk_items, etc.)
 */
function extractRiskItems(data) {
    const riskItems = [];

    // Try key_findings first (gateway format)
    if (data.key_findings && Array.isArray(data.key_findings)) {
        data.key_findings.forEach(item => {
            if (item.title && item.message) {
                riskItems.push({
                    title: item.title,
                    message: item.message,
                    severity: item.severity || item.intensity || 'medium',
                    action: item.user_action || null,
                    risk_code: item.risk_code || null
                });
            }
        });
    }

    // Try risk_items (analysis format)
    if (data.risk_items && Array.isArray(data.risk_items)) {
        data.risk_items.forEach(item => {
            riskItems.push({
                title: item.description || item.risk_code || 'Risk Item',
                message: item.description || 'A potential risk was identified.',
                severity: item.severity || 'medium',
                action: null,
                risk_code: item.risk_code || null
            });
        });
    }

    // Try details.v0.explanation_blocks
    if (data.details && data.details.v0 && data.details.v0.explanation_blocks) {
        data.details.v0.explanation_blocks.forEach(block => {
            riskItems.push({
                title: block.title,
                message: block.message,
                severity: block.severity || 'medium',
                action: block.user_action || null,
                risk_code: block.risk_code || null
            });
        });
    }

    // Deduplicate by title (simple deduplication)
    const seen = new Set();
    return riskItems.filter(item => {
        if (seen.has(item.title)) {
            return false;
        }
        seen.add(item.title);
        return true;
    }).slice(0, 5); // Limit to 5 items for MVP
}

/**
 * Display overview section
 */
function displayOverview(overview) {
    if (!overview) return;

    let html = '';
    
    if (overview.attention_level) {
        html += `<div class="overview-attention">Scan Status: ${overview.attention_level} (preliminary)</div>`;
    }
    
    if (overview.summary) {
        // Remove any non-English text from summary
        const englishSummary = overview.summary.replace(/[^\x00-\x7F]+/g, '');
        html += `<div class="overview-text">${escapeHtml(englishSummary || 'Initial scan completed. Please review the identified clauses below.')}</div>`;
    }

    overviewContainer.innerHTML = html;
    overviewContainer.style.display = 'block';
}

/**
 * Display risk items
 */
function displayRiskItems(riskItems) {
    if (riskItems.length === 0) {
        showNoRisksFound();
    } else {
        riskItemsContainer.innerHTML = riskItems.map(item => {
            const severityClass = normalizeSeverity(item.severity);
            const severityLabel = severityClass.charAt(0).toUpperCase() + severityClass.slice(1);

            return `
                <div class="risk-item severity-${severityClass}">
                    <div class="risk-item-header">
                        <div class="risk-item-title">${escapeHtml(item.title)}</div>
                        <div class="risk-item-severity ${severityClass}">Initial: ${severityLabel}</div>
                    </div>
                    <div class="risk-item-message">${escapeHtml(item.message)}</div>
                    ${item.action ? `<div class="risk-item-action">Recommended: ${escapeHtml(item.action)}</div>` : ''}
                    <div class="risk-item-cta" style="margin-top: 15px;">
                    <button class="learn-more-btn" onclick="showExplanation('${item.risk_code || 'general'}', '${escapeHtml(item.title)}')">Understand the uncertainty</button>
                    <div class="explanation-section" id="explanation-${item.risk_code || 'general'}" style="display: none; margin-top: 15px; padding: 15px; background-color: #f8f8f8; border-radius: 6px;">
                        <h4>Uncertainty Analysis</h4>
                        <p>This clause presents potential risks that depend on your specific circumstances and local laws. The initial assessment may not capture all contextual factors.</p>
                        <p>The actual impact could vary based on how this clause interacts with other terms in your lease agreement.</p>
                        <button class="learn-more-btn" onclick="this.parentElement.style.display='none'">Close</button>
                    </div>
                </div>
                </div>
            `;
        }).join('');
    }
    
    // Add handoff section
    addHandoffSection();
}

/**
 * Add handoff section after results
 */
function addHandoffSection() {
    const handoffHtml = `
        <div class="handoff-section" style="margin-top: 3rem; padding: 2rem; background-color: #f8f8f8; border-radius: 8px; text-align: center;">
            <h3 style="font-size: 1.25rem; font-weight: 500; color: #1a1a1a; margin-bottom: 1rem;">Can you be certain about these findings?</h3>
            <p style="font-size: 1rem; color: #666666; margin-bottom: 2rem; line-height: 1.5;">
                This initial scan only identifies potential issues based on surface-level patterns. The actual risk depends on specific contract language and local regulations.
            </p>
            <button class="analyze-button" onclick="window.location.href='/templates/explain_v2_handoff.html'" style="width: auto; display: inline-block;">
                Unlock Next-Step Risk Guide
            </button>
        </div>
    `;
    
    // Create handoff container if it doesn't exist
    let handoffContainer = document.getElementById('handoffContainer');
    if (!handoffContainer) {
        handoffContainer = document.createElement('div');
        handoffContainer.id = 'handoffContainer';
        resultsSection.appendChild(handoffContainer);
    }
    
    handoffContainer.innerHTML = handoffHtml;
}

/**
 * Show no risks found message
 */
function showNoRisksFound() {
    riskItemsContainer.innerHTML = `
        <div class="risk-item">
            <div class="risk-item-message" style="text-align: center; color: #666666; padding: 2rem;">
                Initial scan completed. No significant risk items identified in basic review.
            </div>
        </div>
    `;
}

/**
 * Normalize severity values
 */
function normalizeSeverity(severity) {
    if (!severity) return 'medium';
    const s = severity.toLowerCase();
    if (['high', 'critical'].includes(s)) return 'high';
    if (['low'].includes(s)) return 'low';
    return 'medium';
}

/**
 * Show loading state
 */
function showLoading() {
    loadingState.style.display = 'block';
    updateLoadingMessage('Analyzing risks...');
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingState.style.display = 'none';
}

/**
 * Show error state
 */
function showError(message) {
    hideAllSections();
    errorMessage.textContent = message;
    errorState.style.display = 'block';
}

/**
 * Hide all sections
 */
function hideAllSections() {
    resultsSection.style.display = 'none';
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    overviewContainer.style.display = 'none';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show explanation for a clause
 */
function showExplanation(riskCode, clauseTitle) {
    const explanationSection = document.getElementById('explanation-' + riskCode);
    if (explanationSection) {
        explanationSection.style.display = 'block';
    }
}
