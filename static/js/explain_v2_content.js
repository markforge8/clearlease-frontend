/**
 * Explain v2 Content Controller
 * 
 * Simple content display without forced progressive disclosure
 */

(function() {
    'use strict';

    /**
     * Initialize: Load data and populate content
     */
    function init() {
        // Load Explain v2 data (assumed to be passed from backend)
        const explainV2Data = window.explainV2Data || getDefaultData();
        
        // Populate content
        populateContent(explainV2Data);
    }

    /**
     * Populate content from Explain v2 data
     */
    function populateContent(data) {
        // Escape window
        const escapeWindowText = document.getElementById('escape_window_text');
        if (escapeWindowText && data.escape_window) {
            const conditions = data.escape_window.conditions || '';
            escapeWindowText.textContent = conditions || 
                'If you cancel before the specified date, it won\'t automatically renew; if you miss that date, the contract will continue automatically.';
        }

        // Headline
        const headlineText = document.getElementById('headline_text');
        if (headlineText && data.headline) {
            headlineText.textContent = data.headline || 
                'If you miss a specific time point, the cost of exiting later will increase.';
        }

        // Core logic
        const coreLogicText = document.getElementById('core_logic_text');
        if (coreLogicText && data.core_logic) {
            coreLogicText.textContent = data.core_logic || 
                'If you miss a specific time window, the contract will automatically renew, and by then canceling will cost more than it does now.';
        }

        // User actions
        const userActionsList = document.getElementById('user_actions_list');
        if (userActionsList && data.user_actions && Array.isArray(data.user_actions)) {
            userActionsList.innerHTML = '';
            data.user_actions.forEach(action => {
                const li = document.createElement('li');
                li.textContent = action;
                userActionsList.appendChild(li);
            });
        }
    }

    /**
     * Default data (fallback if not injected from backend)
     */
    function getDefaultData() {
        return {
            escape_window: {
                conditions: 'If you cancel before the specified date, it won\'t automatically renew; if you miss that date, the contract will continue automatically.'
            },
            headline: 'If you miss a specific time point, the cost of exiting later will increase.',
            core_logic: 'If you miss a specific time window, the contract will automatically renew, and by then canceling will cost more than it does now.',
            user_actions: [
                'Note the deadline for making a decision and set a reminder',
                'Consider whether to continue before the deadline',
                'Find out what the cost would be if you miss the cancellation window'
            ]
        };
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

