// ClearLease MVP - Frontend JavaScript
// Handles API communication and UI updates

const API_ENDPOINT = 'https://api.clearlease.org/analyze';

// DOM Elements
const leaseTextarea = document.getElementById('leaseText');
const analyzeButton = document.getElementById('analyzeButton');
const resultsSection = document.getElementById('resultsSection');
const riskItemsContainer = document.getElementById('riskItems');
const overviewContainer = document.getElementById('overview');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
analyzeButton.addEventListener('click', handleAnalyze);

// Handle Enter key in textarea (Ctrl+Enter or Cmd+Enter)
leaseTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleAnalyze();
    }
});

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

    // Reset UI
    hideAllSections();
    showLoading();
    analyzeButton.disabled = true;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contract_text: leaseText
            })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
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

    // Display risk items
    const riskItems = extractRiskItems(data);
    if (riskItems.length > 0) {
        displayRiskItems(riskItems);
    } else {
        showNoRisksFound();
    }

    // Show results section
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

