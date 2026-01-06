/**
 * Explain v2 Content Controller
 * 
 * Simple content display without forced progressive disclosure
 */

(function() {
    'use strict';

    /**
     * Map risk codes to risk types
     */
    function mapRiskCodeToType(riskCode) {
        const riskMap = {
            // Auto-renewal related codes
            'auto_renewal': 'auto_renewal',
            'automatic_renewal': 'auto_renewal',
            'renewal': 'auto_renewal',
            'extension': 'auto_renewal',
            
            // Liability related codes
            'liability': 'liability',
            'indemnity': 'liability',
            'hold_harmless': 'liability',
            'damages': 'liability',
            'insurance': 'liability',
            
            // Unilateral changes related codes
            'unilateral': 'unilateral_changes',
            'modification': 'unilateral_changes',
            'amendment': 'unilateral_changes',
            'discretion': 'unilateral_changes',
            
            // Default to general
            'general': 'general'
        };
        
        return riskMap[riskCode.toLowerCase()] || 'general';
    }

    /**
     * Initialize: Load data and populate content
     */
    function init() {
        // Load Explain v2 data (assumed to be passed from backend)
        let explainV2Data = window.explainV2Data;
        
        // Check if risk type is specified in URL or data
        if (!explainV2Data) {
            // Get risk type from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            let riskType = urlParams.get('risk_type');
            
            // Map risk code to risk type
            if (riskType) {
                riskType = mapRiskCodeToType(riskType);
                explainV2Data = getRiskSpecificData(riskType);
            } else {
                explainV2Data = getDefaultData();
            }
        }
        
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
            escapeWindowText.textContent = conditions;
        }

        // Headline
        const headlineText = document.getElementById('headline_text');
        if (headlineText && data.headline) {
            headlineText.textContent = data.headline;
        }

        // Hide unused sections
        const coreLogicText = document.getElementById('core_logic_text');
        if (coreLogicText) {
            coreLogicText.parentElement.parentElement.style.display = 'none';
        }

        const userActionsList = document.getElementById('user_actions_list');
        if (userActionsList) {
            userActionsList.parentElement.parentElement.style.display = 'none';
        }
    }

    /**
     * Default data (fallback if not injected from backend)
     */
    function getDefaultData() {
        return {
            escape_window: {
                conditions: `Why this matters: Automatic renewal clauses can extend your tenancy without active consent, potentially trapping you in undesirable rental terms or locations if your circumstances change. This creates financial and logistical burdens if you need to relocate on short notice.

When this becomes risky: This clause becomes dangerous when cancellation windows are unusually brief (less than 30 days), notification requirements are overly strict, or landlords fail to remind tenants of upcoming deadlines.

What to look for: Search for phrases like "automatic renewal," "extension term," or "renewal notice period." Note the exact number of days required for cancellation notice, whether written notice is mandatory, and if the landlord must provide advance written reminder of the renewal date.`
            },
            headline: `Why this matters: Liability clauses determine your financial responsibility for damages, injuries, or accidents that occur on the property. Overly broad liability terms can expose you to significant financial risk beyond normal tenant obligations.

When this becomes risky: This becomes problematic if the clause includes "joint and several liability" for all tenants, waives your right to dispute claims, or holds you responsible for damages caused by third parties or natural disasters.

What to look for: Look for language like "hold harmless," "indemnify," "liability for damages," or "waiver of claims." Pay attention to any clauses that attempt to limit the landlord's liability while expanding yours.`
        };
    }

    /**
     * Get specialized data for different risk types
     */
    function getRiskSpecificData(riskType) {
        const riskData = {
            'auto_renewal': {
                conditions: `Why this matters: Automatic renewal clauses can extend your tenancy without active consent, potentially trapping you in undesirable rental terms or locations if your circumstances change. This creates financial and logistical burdens if you need to relocate on short notice.

When this becomes risky: This clause becomes dangerous when cancellation windows are unusually brief (less than 30 days), notification requirements are overly strict, or landlords fail to remind tenants of upcoming deadlines.

What to look for: Search for phrases like "automatic renewal," "extension term," or "renewal notice period." Note the exact number of days required for cancellation notice, whether written notice is mandatory, and if the landlord must provide advance written reminder of the renewal date.`
            },
            'liability': {
                conditions: `Why this matters: Liability clauses determine your financial responsibility for damages, injuries, or accidents that occur on the property. Overly broad liability terms can expose you to significant financial risk beyond normal tenant obligations.

When this becomes risky: This becomes problematic if the clause includes "joint and several liability" for all tenants, waives your right to dispute claims, or holds you responsible for damages caused by third parties or natural disasters.

What to look for: Look for language like "hold harmless," "indemnify," "liability for damages," or "waiver of claims." Pay attention to any clauses that attempt to limit the landlord's liability while expanding yours.`
            },
            'unilateral_changes': {
                conditions: `Why this matters: Unilateral change clauses allow landlords to modify lease terms without your consent, creating a power imbalance that can erode your tenant rights over time. This can lead to unexpected rent increases, new fees, or stricter rules.

When this becomes risky: This clause becomes concerning if it allows changes to fundamental terms like rent, security deposit requirements, or maintenance responsibilities without reasonable notice or justification.

What to look for: Watch for phrases like "reserve the right to modify," "at landlord's discretion," or "without prior notice." Check if there are any limitations on the types of changes allowed or if you have the right to terminate the lease in response to significant changes.`
            }
        };
        
        return riskData[riskType] || getDefaultData();
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

