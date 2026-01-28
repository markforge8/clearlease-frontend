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
    
    // Check if user has just unlocked the app
    checkUnlockStatus();
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
            // Backend returned analysis, render it
            displayResults(data.data.analysis);
        }
    } catch (error) {
        console.error('Error checking for recoverable analysis:', error);
    }
}

/**
 * Check if user has just unlocked the app and show confirmation
 */
function checkUnlockStatus() {
    const unlocked = localStorage.getItem('unlocked');
    if (unlocked) {
        console.log('Detected unlocked status, refreshing user info');
        
        // Show unlock confirmation
        showUnlockConfirmation();
        // Clear unlock status
        localStorage.removeItem('unlocked');
        
        // Force a refresh of user info to get the latest paid status
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserInfo().then(userData => {
                if (userData) {
                    console.log('Refreshed user info:', userData);
                    // Update user info in localStorage
                    localStorage.setItem('user', JSON.stringify(userData));
                    console.log('Updated user info in localStorage');
                    // Update UI
                    updateUserInfo(userData);
                    console.log('Updated UI with user info');
                }
            }).catch(error => {
                console.error('Error refreshing user info:', error);
                // Even if refresh fails, assume paid status
                const user = localStorage.getItem('user');
                if (user) {
                    const parsedUser = JSON.parse(user);
                    parsedUser.paid = true;
                    localStorage.setItem('user', JSON.stringify(parsedUser));
                    console.log('Forced paid status to true in localStorage');
                }
            });
        }
    }
}

/**
 * Show unlock confirmation message
 */
function showUnlockConfirmation() {
    // Create confirmation element
    const confirmation = document.createElement('div');
    confirmation.id = 'unlockConfirmation';
    confirmation.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Set content
    confirmation.textContent = 'Full analysis unlocked!';
    
    // Add to document
    document.body.appendChild(confirmation);
    
    // Remove after 3 seconds
    setTimeout(() => {
        confirmation.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            confirmation.remove();
            style.remove();
        }, 300);
    }, 3000);
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
    window.location.href = 'https://clearlease-frontend.vercel.app/';
}

/**
 * Update user info display
 */
function updateUserInfo(user) {
    if (user) {
        userEmail.textContent = user.email;
        userInfo.style.display = 'block';
        loginSection.style.display = 'none';
    } else {
        clearUserInfo();
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
        console.log('User info fetched successfully:', data.data.user);
        return data.data.user;
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
        window.location.href = 'https://clearlease-frontend.vercel.app/';
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
            window.location.href = 'https://gumroad.com/l/clearlease?return=https://clearlease-frontend.vercel.app/payment/success';
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
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        // Not logged in - show login section
        loginSection.style.display = 'block';
        showError('Please login first to analyze your lease agreement.');
        return;
    }
    
    // No need to check paid status here
    // Backend will handle it and return locked status with preview content
    
    // Logged in - proceed with analysis
    // Backend will return appropriate content based on user status
    // Reset UI
    hideAllSections();
    showLoading();
    analyzeButton.disabled = true;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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
        
        displayResults(data);

    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Unable to analyze your lease. Please try again later. ${error.message}`);
    } finally {
        hideLoading();
        analyzeButton.disabled = false;
    }
}

/**
 * Display analysis results
 */
function displayResults(data) {
    // Hide loading and error states
    hideAllSections();

    // Display overview if available
    if (data.overview) {
        displayOverview(data.overview);
    }

    // Display risk items based on locked status
    if (data.locked) {
        // Show preview if available
        if (data.preview) {
            const riskItems = extractRiskItems(data.preview);
            if (riskItems.length > 0) {
                displayRiskItems(riskItems);
            } else {
                showNoRisksFound();
            }
        } else {
            const riskItems = extractRiskItems(data);
            if (riskItems.length > 0) {
                displayRiskItems(riskItems);
            } else {
                showNoRisksFound();
            }
        }
        // Show upgrade prompt
        addUpgradePromptToResults();
    } else {
        // Show full analysis
        const riskItems = extractRiskItems(data);
        if (riskItems.length > 0) {
            displayRiskItems(riskItems);
        } else {
            showNoRisksFound();
        }
        // Remove any existing upgrade prompts
        const upgradePrompt = document.getElementById('lockedUpgradePrompt');
        if (upgradePrompt) {
            upgradePrompt.remove();
        }
    }

    // Show results section
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            window.location.href = 'https://gumroad.com/l/clearlease?return=https://clearlease-frontend.vercel.app/payment/success';
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
