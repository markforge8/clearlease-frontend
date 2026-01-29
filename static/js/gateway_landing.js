// ClearLease MVP - Frontend JavaScript
// Handles API communication and UI updates

// API Configuration
const BACKEND_BASE_URL = 'https://clearlease-production.up.railway.app';
const API_ENDPOINT = `${BACKEND_BASE_URL}/analyze`;
const API_LOGIN_ENDPOINT = `${BACKEND_BASE_URL}/api/auth/login`;
const API_REGISTER_ENDPOINT = `${BACKEND_BASE_URL}/api/auth/register`;
const API_ME_ENDPOINT = `${BACKEND_BASE_URL}/api/auth/me`;

// DOM Elements
const leaseTextarea = document.getElementById('leaseText');
const analyzeButton = document.getElementById('analyzeButton');
const resultsSection = document.getElementById('resultsSection');
const riskItemsContainer = document.getElementById('riskItems');
const overviewContainer = document.getElementById('overview');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');

// Navigation and Auth Elements
const signInButton = document.getElementById('signInButton');
const signUpButton = document.getElementById('signUpButton');
const authModal = document.getElementById('authModal');
const authModalClose = document.getElementById('authModalClose');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authLoginButton = document.getElementById('authLoginButton');
const authRegisterButton = document.getElementById('authRegisterButton');
const authMessage = document.getElementById('authMessage');
const saveAnalysisSection = document.getElementById('saveAnalysisSection');
const saveAnalysisButton = document.getElementById('saveAnalysisButton');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');

// Event Listeners
analyzeButton.addEventListener('click', handleAnalyze);
logoutButton.addEventListener('click', handleLogout);

// Navigation and Modal Events
if (signInButton) signInButton.addEventListener('click', openAuthModal);
if (signUpButton) signUpButton.addEventListener('click', openAuthModal);
if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
if (authLoginButton) authLoginButton.addEventListener('click', handleLogin);
if (authRegisterButton) authRegisterButton.addEventListener('click', handleRegister);
if (saveAnalysisButton) saveAnalysisButton.addEventListener('click', openAuthModal);

// Close modal when clicking outside
if (authModal) {
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });
}

// Handle Enter key in auth inputs
if (authEmail) {
    authEmail.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
}

if (authPassword) {
    authPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
}

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

// Auth Modal Functions
function openAuthModal() {
    if (authModal) {
        authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAuthModal() {
    if (authModal) {
        authModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Clear form
        if (authEmail) authEmail.value = '';
        if (authPassword) authPassword.value = '';
        if (authMessage) authMessage.textContent = '';
    }
}

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
                // Update navigation
                updateNavigation(userData);
                // Check user status and redirect if needed
                checkUserStatusAndRedirect(userData);
                // Check for recoverable analysis
                await checkForRecoverableAnalysis();
            }
        } catch (error) {
            // Token invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Update navigation
            updateNavigation(null);
            // Check for auth parameter
            checkAuthParameter();
        }
    } else {
        // Update navigation
        updateNavigation(null);
        // Show save analysis section
        if (saveAnalysisSection) {
            saveAnalysisSection.style.display = 'block';
        }
        // Check for auth parameter
        checkAuthParameter();
    }
    

});

// Check for auth parameter in URL
function checkAuthParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    
    if (authParam === 'login' || authParam === 'signup') {
        // Open auth modal
        openAuthModal();
        // Clear the parameter from URL
        urlParams.delete('auth');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
    }
}

// Update navigation based on user status
function updateNavigation(user) {
    if (user) {
        // Logged in
        if (signInButton) signInButton.remove();
        if (signUpButton) signUpButton.remove();
        if (saveAnalysisSection) saveAnalysisSection.style.display = 'none';
        
        // Add logout button to navbar
        const navbarLinks = document.querySelector('.navbar-links');
        if (navbarLinks && !document.querySelector('.navbar-logout')) {
            const logoutButton = document.createElement('button');
            logoutButton.className = 'navbar-button navbar-button-outline navbar-logout';
            logoutButton.textContent = 'Logout';
            logoutButton.addEventListener('click', handleLogout);
            navbarLinks.appendChild(logoutButton);
        }
    } else {
        // Not logged in
        if (signInButton) signInButton.style.display = 'inline-block';
        if (signUpButton) signUpButton.style.display = 'inline-block';
        if (saveAnalysisSection) saveAnalysisSection.style.display = 'block';
        
        // Remove logout button if it exists
        const logoutButton = document.querySelector('.navbar-logout');
        if (logoutButton) {
            logoutButton.remove();
        }
    }
}

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
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    
    if (!email || !password) {
        authMessage.textContent = 'Please enter both email and password';
        authMessage.classList.add('error');
        return;
    }
    
    authLoginButton.disabled = true;
    authRegisterButton.disabled = true;
    authMessage.textContent = 'Logging in...';
    authMessage.classList.remove('error');
    
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
            updateNavigation(data.data.user);
            authMessage.textContent = 'Login successful!';
            
            // Close modal
            closeAuthModal();
            
            // Redirect based on paid status
            checkUserStatusAndRedirect(data.data.user);
        } else {
            authMessage.textContent = 'Login failed: ' + (data.message || 'Invalid credentials');
            authMessage.classList.add('error');
        }
    } catch (error) {
        console.error('Login error:', error);
        authMessage.textContent = 'Error logging in. Please try again.';
        authMessage.classList.add('error');
    } finally {
        authLoginButton.disabled = false;
        authRegisterButton.disabled = false;
    }
}

/**
 * Handle register
 */
async function handleRegister() {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    
    if (!email || !password) {
        authMessage.textContent = 'Please enter both email and password';
        authMessage.classList.add('error');
        return;
    }
    
    authLoginButton.disabled = true;
    authRegisterButton.disabled = true;
    authMessage.textContent = 'Registering...';
    authMessage.classList.remove('error');
    
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
            updateNavigation(data.data.user);
            authMessage.textContent = 'Registration successful!';
            
            // Close modal
            closeAuthModal();
            
            // Redirect based on paid status
            checkUserStatusAndRedirect(data.data.user);
        } else {
            authMessage.textContent = 'Registration failed: ' + (data.message || 'Invalid information');
            authMessage.classList.add('error');
        }
    } catch (error) {
        console.error('Register error:', error);
        authMessage.textContent = 'Error registering. Please try again.';
        authMessage.classList.add('error');
    } finally {
        authLoginButton.disabled = false;
        authRegisterButton.disabled = false;
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
    updateNavigation(null);
    
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
    } else {
        clearUserInfo();
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

    // Validation
    if (!leaseText) {
        showError('Please paste your lease agreement text before analyzing.');
        return;
    }

    if (leaseText.length < 50) {
        showError('Please provide a longer lease agreement text (at least 50 characters).');
        return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (!token) {
        // User not logged in, open auth modal
        openAuthModal();
        return;
    }
    
    // Get user info if logged in
    let userData;
    try {
        userData = await fetchUserInfo();
        console.log('User info:', userData);
    } catch (error) {
        console.error('Error fetching user info:', error);
        // Continue with analysis even if user info fetch fails
        // Analysis should always be available
    }
    
    // Reset UI
    hideAllSections();
    showLoading();
    analyzeButton.disabled = true;

    try {
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
                contract_text: leaseText
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
