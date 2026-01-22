// ============================================
// GLOBAL VARIABLES AND STATE MANAGEMENT
// ============================================

let selectedModels = [];
let feasibleModels = [];
let currentModelIndex = 0;
let modelInputs = {};
let allResults = {};
// Track answered questions
let answeredQuestions = new Set();

// Model configuration
const MODELS = {
    'three-thirty': {
        name: 'Three for Thirty',
        subtitle: 'Child Savings Plan',
        pageId: 'three-thirty-page',
        description: 'Child lives rent-free with parents for 3 years to save for down payment'
    },
    'co-investing': {
        name: 'Co-Investing',
        subtitle: 'Family Loan from Investments',
        pageId: 'co-investing-page',
        description: 'Parents lend funds from investments with formal repayment agreement'
    },
    'multi-gen': {
        name: 'Multi-Generation Living',
        subtitle: 'Laneway House / Rental Suite',
        pageId: 'multi-gen-page',
        description: 'Child builds addition on parent\'s property'
    },
    'early-inheritance': {
        name: 'Early Inheritance',
        subtitle: 'Advance Future Inheritance',
        pageId: 'early-inheritance-page',
        description: 'Parents gift inheritance early after ensuring retirement needs'
    },
    'home-equity': {
        name: 'Home Equity Usage',
        subtitle: 'LOC vs Reverse Mortgage',
        pageId: 'home-equity-page',
        description: 'Parents use home equity while keeping investments intact'
    }
};

// Default values from meeting minutes
const DEFAULT_VALUES = {
    // Three for Thirty
    'tt-child-income': 60000,
    'tt-parent-loan-rate': 5,
    'tt-parent-tax-rate': 25,
    
    // Co-Investing
    'ci-investment-amount': 200000,
    'ci-stock-return': 6,
    'ci-stock-volatility': 10,
    'ci-loan-amount': 200000,
    'ci-loan-rate': 5,
    'ci-home-price': 400000,
    'ci-mortgage-rate': 4.5,
    'ci-annual-appreciation': 4,
    'ci-marginal-tax': 25,
    'ci-capital-gain': 50,
    
    // Multi-Generation
    'mg-rent-if-not-living': 1500,
    'mg-custom-cost': 500000,
    'mg-child-equity': 15,
    
    // Home Equity
    'he-rm-rate': 7,
    'he-property-appreciation': 4
};

// QUESTION MAPPING SYSTEM
const QUESTIONNAIRE_MAP = {
    // General Questions For Family (PDF Questions 1-4, 17, 24, 34)
    'client-type': { id: 1, pdfId: 'q1', category: 'family', source: 'matchmaker' },
    'parent-age': { id: 2, pdfId: 'q2', category: 'family', source: 'matchmaker' },
    'financial-health': { id: 3, pdfId: 'q3', category: 'family', source: 'matchmaker' },
    'willing-family': { id: 4, pdfId: 'q4', category: 'family', source: 'post-analysis' },
    'family-proximity': { id: 17, pdfId: 'q17', category: 'family', source: 'matchmaker' },
    'liquid-assets': { id: 34, pdfId: 'q34', category: 'family', source: 'post-analysis' },
    
    // General Questions for Buyers (PDF Questions 5-16)
    'buyer-name-age': { id: 5, pdfId: 'q5', category: 'buyer', source: 'post-analysis' },
    'occupation-income': { id: 6, pdfId: 'q6', category: 'buyer', source: 'post-analysis' },
    'credit-rating': { id: 7, pdfId: 'q7', category: 'buyer', source: 'matchmaker' },
    'current-assets': { id: 8, pdfId: 'q8', category: 'buyer', source: 'post-analysis' },
    'existing-debt': { id: 9, pdfId: 'q9', category: 'buyer', source: 'post-analysis' },
    'downpayment-saved': { id: 10, pdfId: 'q10', category: 'buyer', source: 'matchmaker' },
    'mortgage-preapproval': { id: 11, pdfId: 'q11', category: 'buyer', source: 'post-analysis' },
    'future-changes': { id: 12, pdfId: 'q12', category: 'buyer', source: 'post-analysis' },
    'purchase-timeline': { id: 13, pdfId: 'q13', category: 'buyer', source: 'matchmaker' },
    'rental-property-interest': { id: 14, pdfId: 'q14', category: 'buyer', source: 'post-analysis' },
    'children-plans': { id: 15, pdfId: 'q15', category: 'buyer', source: 'post-analysis' },
    
    // Co-Investing Model (PDF Questions 18-22)
    'gifting-repayment': { id: 18, pdfId: 'q18', category: 'co-investing', source: 'matchmaker' },
    'formal-agreement': { id: 19, pdfId: 'q19', category: 'co-investing', source: 'post-analysis' },
    'discussed-amount': { id: 20, pdfId: 'q20', category: 'co-investing', source: 'post-analysis' },
    'interest-expectation': { id: 21, pdfId: 'q21', category: 'co-investing', source: 'post-analysis' },
    'no-repayment-possibility': { id: 22, pdfId: 'q22', category: 'co-investing', source: 'post-analysis' },
    
    // Reverse Mortgage/Line of Credit (PDF Questions 23-28)
    'reverse-mortgage-understanding': { id: 23, pdfId: 'q23', category: 'home-equity', source: 'post-analysis' },
    'home-equity-amount': { id: 24, pdfId: 'q24', category: 'family', source: 'matchmaker' },
    'home-equity': { id: 25, pdfId: 'q25', category: 'home-equity', source: 'post-analysis' },
    'no-monthly-payments': { id: 26, pdfId: 'q26', category: 'home-equity', source: 'post-analysis' },
    'payment-responsibility': { id: 27, pdfId: 'q27', category: 'home-equity', source: 'post-analysis' },
    'siblings-feelings': { id: 28, pdfId: 'q28', category: 'home-equity', source: 'post-analysis' },
    'inheritance-conversations': { id: 29, pdfId: 'q29', category: 'early-inheritance', source: 'post-analysis' },

    // Early Inheritance (PDF Questions 29-33)
    'early-inheritance-openness': { id: 30, pdfId: 'q30', category: 'early-inheritance', source: 'post-analysis' },
    'siblings-early-inheritance': { id: 31, pdfId: 'q31', category: 'early-inheritance', source: 'post-analysis' },
    'siblings-past-assistance': { id: 32, pdfId: 'q32', category: 'early-inheritance', source: 'post-analysis' },
    'parents-comfort': { id: 33, pdfId: 'q33', category: 'early-inheritance', source: 'post-analysis' },
    
    // Multi-Generation Living (PDF Questions 35-43)
    'existing-rental-suite': { id: 35, pdfId: 'q35', category: 'multi-gen', source: 'post-analysis' },
    'laneway-possibility': { id: 36, pdfId: 'q36', category: 'multi-gen', source: 'post-analysis' },
    'living-together-openness': { id: 37, pdfId: 'q37', category: 'multi-gen', source: 'matchmaker', description: 'Openness to living together'},
    'willing-add-suite': { id: 38, pdfId: 'q38', category: 'multi-gen', source: 'post-analysis', description: 'Willingness to add rental suite' },
    'living-timeframe': { id: 39, pdfId: 'q39', category: 'multi-gen', source: 'model-input', description: 'Timeframe for living arrangement' },
    'current-occupants': { id: 40, pdfId: 'q40', category: 'multi-gen', source: 'post-analysis' },
    'renovation-contribution': { id: 41, pdfId: 'q41', category: 'multi-gen', source: 'model-input'},
    'renovation-payment': { id: 42, pdfId: 'q42', category: 'multi-gen', source: 'post-analysis' },
    'potential-conflicts': { id: 43, pdfId: 'q43', category: 'multi-gen', source: 'post-analysis' },
    'primary-financial-goal': { id: 44, pdfId: 'starting-early-q1', category: 'starting-early', source: 'post-analysis',description: 'Primary financial goal for child: down payment vs education'},
    'real-estate-priority': { id: 45, pdfId: 'starting-early-q2', category: 'starting-early', source: 'post-analysis', description: 'Willing to prioritize real estate over stocks'},
    'leveragable-equity': { id: 46, pdfId: 'starting-early-q3', category: 'starting-early', source: 'post-analysis', description: 'Home equity available for leveraging'},
    'rental-experience': { id: 47, pdfId: 'starting-early-q4', category: 'starting-early', source: 'post-analysis', description: 'Experience with rental real estate investing'},
    'retirement-impact': { id: 48, pdfId: 'starting-early-q5', category: 'starting-early', source: 'post-analysis', description: 'Impact of gifting property on retirement goals'},
    'landlord-comfort': { id: 49, pdfId: 'starting-early-q6', category: 'starting-early', source: 'post-analysis', description: 'Comfort with landlord responsibilities'},
    'child-investment-type': { id: 50, pdfId: 'starting-early-q7', category: 'starting-early', source: 'post-analysis',description: 'Type of assets for child\'s future'},
    // Three-for-Thirty (PDF Questions 16)
    'current-living-situation':{id: 16, pdfId: 'q16', category: 'three-thirty', source: 'post-analysis', description: 'Current living situation and rent payment'}

};


// ============================================
// COVER PAGE FUNCTIONS
// ============================================

function initializeCoverPage() {
    initializeSession();
    
    console.log('Initializing Cover Page with session:', currentSession.id);
    
    // Check if coming from questionnaire (for auto-selection)
    const fromQuestionnaire = localStorage.getItem('fromQuestionnaire');
    const recommendedModels = localStorage.getItem('recommendedModels');
    
    // Ensure selectedModels is always an array
    selectedModels = [];

    // Load previously selected models if any (but only if not starting fresh)
    if (recommendedModels && !fromQuestionnaire) {
        try {
            const parsed = JSON.parse(recommendedModels);
            if (Array.isArray(parsed)) {
                selectedModels = parsed;
                updateSelectionUI();
            } else {
                console.error('recommendedModels is not an array:', parsed);
                selectedModels = [];
            }
        } catch (error) {
            console.error('Error parsing recommendedModels:', error);
            selectedModels = [];
        }
    }
    
    if (fromQuestionnaire === 'true' && recommendedModels) {
        try {
            const models = JSON.parse(recommendedModels);
            
            // Ensure models is an array
            if (!Array.isArray(models)) {
                console.error('Questionnaire models is not an array:', models);
                models = [];
            }
            
            // Auto-select recommended models
            models.forEach(modelId => {
                if (!selectedModels.includes(modelId)) {
                    selectedModels.push(modelId);
                    
                    // Update UI
                    const card = document.querySelector(`.model-card-large[data-model="${modelId}"]`);
                    if (card) {
                        card.classList.add('selected');
                        const checkbox = document.getElementById(`check-${modelId}`);
                        if (checkbox) checkbox.checked = true;
                    }
                }
            });
            
            updateSelectionUI();
            
            // Show notification
            showMatchmakerNotification(models);
            
            // Clean up questionnaire flags
            localStorage.removeItem('fromQuestionnaire');
            
        } catch (error) {
            console.error('Error processing questionnaire results:', error);
            selectedModels = [];
        }
    }
    
    // If still empty, try to load from selectedModels
    if (selectedModels.length === 0) {
        const savedSelected = localStorage.getItem('selectedModels');
        if (savedSelected) {
            try {
                const parsed = JSON.parse(savedSelected);
                if (Array.isArray(parsed)) {
                    selectedModels = parsed;
                    updateSelectionUI();
                }
            } catch (error) {
                console.error('Error parsing selectedModels:', error);
            }
        }
    }

    // Add event listener for browser back button
    window.addEventListener('popstate', function(event) {
        handleCoverPageBackNavigation();
    });
}

function handleCoverPageBackNavigation() {
    // When user uses browser back button
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage.includes('CoverPage.html')) {
        // User navigated back to CoverPage
        // Check if they came from forward navigation or back
        const navigationType = performance.getEntriesByType("navigation")[0].type;
        
        if (navigationType === 'back_forward') {
            // User used back/forward buttons, preserve their data
            console.log('Back/forward navigation detected, preserving data');
        } else {
            // Fresh load or other navigation, don't clear
        }
    }
}


// Add this helper function:
function showMatchmakerNotification(models) {
    const notification = document.createElement('div');
    notification.className = 'matchmaker-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">🎯</span>
            <div>
                <strong>Questionnaire Results Applied!</strong>
                <p>We've pre-selected your top ${models.length} strategy matches based on your answers.</p>
            </div>
            <button class="close-notification" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(notification, container.firstChild);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
}

function toggleModelSelection(modelId) {
    const card = document.querySelector(`.model-card-large[data-model="${modelId}"]`);
    const checkbox = document.getElementById(`check-${modelId}`);
    
    if (selectedModels.includes(modelId)) {
        // Deselect
        selectedModels = selectedModels.filter(id => id !== modelId);
        card.classList.remove('selected');
        checkbox.checked = false;
    } else {
        // Select
        selectedModels.push(modelId);
        card.classList.add('selected');
        checkbox.checked = true;
    }
    
    updateSelectionUI();
}

function updateSelectionUI() {
    // Ensure selectedModels is always an array
    if (!Array.isArray(selectedModels)) {
        console.error('selectedModels is not an array, resetting:', selectedModels);
        selectedModels = [];
    }

    const proceedBtn = document.getElementById('proceed-button');
    const summary = document.getElementById('selection-summary');
    const countSpan = document.getElementById('selected-count');
    const listDiv = document.getElementById('selected-models-list');
    
    if (!countSpan) return; // Exit if elements don't exist yet

    countSpan.textContent = selectedModels.length;
    
    if (selectedModels.length > 0) {
            if (proceedBtn) proceedBtn.disabled = false;
        if (summary) summary.style.display = 'block';
        
        // Update selected models list
        if (listDiv) {
            listDiv.innerHTML = '';
            selectedModels.forEach(modelId => {
                const model = MODELS[modelId];
                if (model) {
                    const item = document.createElement('div');
                    item.className = 'selected-model-item';
                    item.innerHTML = `
                        <strong>${model.name}</strong>: ${model.description}
                        <button class="remove-btn" onclick="removeModel('${modelId}')">×</button>
                    `;
                    listDiv.appendChild(item);
                }
            });
        }
    } else {
        if (proceedBtn) proceedBtn.disabled = true;
        if (summary) summary.style.display = 'none';
    }
    
    // Save to localStorage
    localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
}

function removeModel(modelId) {
    // Ensure selectedModels is an array
    if (!Array.isArray(selectedModels)) {
        selectedModels = [];
        return;
    }
    
    selectedModels = selectedModels.filter(id => id !== modelId);
    const card = document.querySelector(`.model-card-large[data-model="${modelId}"]`);
    if (card) card.classList.remove('selected');
    const checkbox = document.getElementById(`check-${modelId}`);
    if (checkbox) checkbox.checked = false;
    updateSelectionUI();
}

function proceedToModelsPage() {
    if (selectedModels.length === 0) {
        alert('Please select at least one strategy to proceed.');
        return;
    }
    
    // Double-check selectedModels is an array
    if (!Array.isArray(selectedModels)) {
        console.error('selectedModels is not an array before saving:', selectedModels);
        selectedModels = [];
        alert('Error in selection. Please try again.');
        return;
    }

    // Save selected models for the models page
    localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
    console.log('Proceeding with models:', selectedModels); // Add for debugging
    // Clear any previous feasibility and inputs (fresh start for this selection)
    localStorage.removeItem('feasibleModels');
    localStorage.removeItem('modelInputs');
    
    // Navigate to Models.html
    window.location.href = 'Models.html';
}

// ============================================
// MODELS PAGE FUNCTIONS
// ============================================

function initializeModelsPage() {
    initializeSession();
    
    // Load selected models with better error handling
    try {
        const saved = localStorage.getItem('selectedModels');
        
        // If nothing is saved, go back
        if (!saved) {
            window.location.href = 'index.html';
            return;
        }
        
        // Try to parse the data
        const parsed = JSON.parse(saved);
        
        // Ensure it's an array
        if (!Array.isArray(parsed)) {
            console.error('selectedModels is not an array:', parsed);
            window.location.href = 'index.html';
            return;
        }
        
        // Check if array is empty
        if (parsed.length === 0) {
            window.location.href = 'index.html';
            return;
        }
        
        selectedModels = parsed;
        
    } catch (error) {
        console.error('Error loading selected models:', error);
        window.location.href = 'index.html';
        return;
    }
    
    // ... rest of the existing code
    feasibleModels = [...selectedModels]; // Start with all models as feasible
    currentModelIndex = 0;
    modelInputs = {};

    // Check if we have existing inputs to restore
    const savedInputs = localStorage.getItem('modelInputs');
    if (savedInputs) {
        try {
            modelInputs = JSON.parse(savedInputs);
            console.log('Restored previous inputs:', modelInputs);
        } catch (error) {
            console.error('Error restoring inputs:', error);
        }
    }
    
    // Initialize feasibility page
    initializeFeasibilityPage();
    
    // Initialize all model input pages
    selectedModels.forEach(modelId => {
        initializeModelPage(modelId);
    });

    // Restore any previously selected feasibility
    const savedFeasibleModels = localStorage.getItem('feasibleModels');
    if (savedFeasibleModels) {
        const previouslyFeasible = JSON.parse(savedFeasibleModels);
        
        // Update checkboxes to match previously saved state
        setTimeout(() => {
            document.querySelectorAll('.not-feasible').forEach(checkbox => {
                const modelId = checkbox.dataset.model;
                if (!previouslyFeasible.includes(modelId)) {
                    checkbox.checked = true;
                }
            });
            updateFeasibility();
        }, 100);
    }
}

function initializeFeasibilityPage() {
    const grid = document.getElementById('feasibility-grid');
    
    // Clear loading message
    grid.innerHTML = '';
    
    // Create feasibility cards for each selected model
    selectedModels.forEach((modelId, index) => {
        const model = MODELS[modelId];
        const card = document.createElement('div');
        card.className = 'strategy-card';
        card.innerHTML = `
            <h3>${index + 1}. ${model.name}</h3>
            <p>${model.description}</p>
            <div class="feasibility-controls">
                <label class="checkbox-label">
                    <input type="checkbox" class="not-feasible" data-model="${modelId}">
                    <span>Not feasible for us</span>
                </label>
            </div>
        `;
        grid.appendChild(card);
    });
    
    // Add event listeners for feasibility checkboxes
    document.querySelectorAll('.not-feasible').forEach(checkbox => {
        checkbox.addEventListener('change', updateFeasibility);
    });
    
    updateFeasibility();
}

function updateFeasibility() {
    const checkboxes = document.querySelectorAll('.not-feasible');
    const proceedBtn = document.getElementById('proceed-to-inputs');
    
    // Update feasible models list
    feasibleModels = [];
    checkboxes.forEach(checkbox => {
        const modelId = checkbox.dataset.model;
        if (!checkbox.checked) {
            feasibleModels.push(modelId);
        }
    });
    
    // Update button state
    proceedBtn.disabled = feasibleModels.length === 0;
    
    if (feasibleModels.length === 0) {
        proceedBtn.innerHTML = 'Select at least one feasible strategy';
    } else {
        proceedBtn.innerHTML = `Continue to Detailed Inputs (${feasibleModels.length} models) →`;
    }
}

function proceedToModelInputs() {
    if (feasibleModels.length === 0) {
        alert('Please select at least one feasible strategy.');
        return;
    }
    
    // Save comfort levels from feasibility page
    document.querySelectorAll('.comfort-slider').forEach(slider => {
        const modelId = slider.dataset.model;
        if (feasibleModels.includes(modelId)) {
            modelInputs[modelId] = modelInputs[modelId] || {};
            modelInputs[modelId].feasibilityComfort = parseInt(slider.value);
        }
    });
    
    // Hide feasibility page, show first model input page
    //const feasibilityPage = document.getElementById('feasibility-page');
    //if (feasibilityPage) {
    //    feasibilityPage.classList.remove('active');
    //}
    
    if (feasibleModels.length > 0) {
        currentModelIndex = 0;
        showModelInputPage(feasibleModels[0]);
        
        // Hide the navigation bar since we're not using it anymore
        //const modelNav = document.getElementById('model-navigation');
        //if (modelNav) {
        //    modelNav.style.display = 'none';
        //}
    }
}

function initializeModelPage(modelId) {
    // Set up event listeners for "I don't know" buttons
    const page = document.getElementById(MODELS[modelId].pageId);
    if (!page) return;
    
    // Find all helper buttons and attach events
    const helperBtns = page.querySelectorAll('.helper-btn');
    helperBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const inputId = this.parentElement.querySelector('input, select').id;
            const defaultValue = DEFAULT_VALUES[inputId];
            if (defaultValue !== undefined) {
                useDefault(inputId, defaultValue);
            }
        });
    });
    
    // Special initialization for multi-gen page
    if (modelId === 'multi-gen') {
        const buildTypeSelect = document.getElementById('mg-build-type');
        if (buildTypeSelect) {
            buildTypeSelect.addEventListener('change', updateBuildCost);
        }
    }

    // Check if we should show long-term planning questions
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const clientType = questionnaireData.clientType;
    const childAge = questionnaireData.answers['child-age-range'];
    const isLongTermPlanning = (clientType === 'parent' || clientType === 'both') && 
                               childAge === 'under18';
    
    // Initialize long-term questions if applicable
    if (isLongTermPlanning) {
        initializeLongTermQuestions(modelId);
    }

    // Special initialization for home-equity page
if (modelId === 'home-equity') {
    // Add event listener for method change
    setTimeout(() => {
        const methodSelect = document.getElementById('he-method');
        if (methodSelect) {
        methodSelect.addEventListener('change', function() {
            console.log('Home equity method changed to:', this.value);
            
            // If reverse mortgage is selected, show qualification check
            if (this.value === 'reverse') {
                // Remove existing note
                const existingNote = document.querySelector('.reverse-mortgage-note');
                if (existingNote) existingNote.remove();
                
                // Show reverse mortgage qualification check
                showReverseMortgageQuestionnaire(function() {
                    console.log('Reverse mortgage check completed');
                    
                    // Get the updated data
                    const updatedRMQ = JSON.parse(localStorage.getItem('reverseMortgageQuestionnaire') || '{}');
                    
                    // If qualification shows issues, warn user
                    if (updatedRMQ.qualificationStatus && 
                        (updatedRMQ.qualificationStatus.includes('not_qualified') || 
                        updatedRMQ.qualificationStatus.includes('unlikely'))) {
                        
                        const proceed = confirm(
                            '⚠️ REVERSE MORTGAGE QUALIFICATION WARNING\n\n' +
                            'Our assessment indicates you may not qualify for a reverse mortgage.\n\n' +
                            'Proceeding with this strategy may not reflect realistic outcomes.\n\n' +
                            'Click OK to continue anyway with these results.\n' +
                            'Click Cancel to go back and choose a different strategy.'
                        );
                        
                        if (!proceed) {
                            // User wants to go back, change to HELOC
                            this.value = 'heloc';
                            this.focus();
                            
                            // Remove the note
                            const note = document.querySelector('.reverse-mortgage-note');
                            if (note) note.remove();
                            
                            // Clear any stored reverse mortgage questionnaire data
                            localStorage.removeItem('reverseMortgageQuestionnaire');
                        }
                    }
                }.bind(this)); // Bind 'this' to maintain context
                
                // Add a note about qualification
                const note = document.createElement('div');
                note.className = 'reverse-mortgage-note';
                note.style.cssText = 'background: #e8f4fc; padding: 8px; margin: 10px 0; border-radius: 4px; font-size: 0.9rem;';
                note.innerHTML = 'ℹ️ Reverse Mortgage qualification assessment will help determine if this option is suitable for you.';
                
                // Insert after the select
                this.parentNode.insertBefore(note, this.nextSibling);
            } else {
                // Remove note if not reverse mortgage
                const existingNote = document.querySelector('.reverse-mortgage-note');
                if (existingNote) existingNote.remove();
                
                // Clear reverse mortgage questionnaire data when switching away from reverse mortgage
                localStorage.removeItem('reverseMortgageQuestionnaire');
            }
        });
            
            // If already set to reverse mortgage, trigger check on page load
            if (methodSelect.value === 'reverse') {
                methodSelect.dispatchEvent(new Event('change'));
            }
        }
    }, 100);
}
}

function initializeLongTermQuestions(modelId) {
    const page = document.getElementById(MODELS[modelId].pageId);
    if (!page) return;
    
    // Check if we've already added long-term questions to this page
    const existingQuestions = page.querySelector('.long-term-questions');
    if (existingQuestions) {
        return; // Already initialized, don't add again
    }
    
    // Create container for long-term questions
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'long-term-questions';
    questionsContainer.innerHTML = '<h3>📈 Long-term Planning (Child Under 18)</h3>';
    
    // Get the input section to append questions to
    const inputSection = page.querySelector('.input-section');
    if (!inputSection) return;
    
    // Add model-specific questions based on model type
    switch(modelId) {
        case 'co-investing':
            questionsContainer.innerHTML += `
                <div class="input-group">
                    <label>Are you willing to prioritize a real estate-focused investment strategy 
                           over traditional stock assets to help your child purchase a home in the future?</label>
                    <div class="button-group">
                        <button type="button" class="toggle-btn" data-value="yes" 
                                onclick="selectLongTermAnswer('co-investing', 'real-estate-priority', 'yes')">Yes</button>
                        <button type="button" class="toggle-btn" data-value="no" 
                                onclick="selectLongTermAnswer('co-investing', 'real-estate-priority', 'no')">No</button>
                        <button type="button" class="toggle-btn" data-value="unsure" 
                                onclick="selectLongTermAnswer('co-investing', 'real-estate-priority', 'unsure')">Unsure</button>
                    </div>
                    <input type="hidden" id="co-investing-real-estate-priority" value="">
                </div>
            `;
            break;
            
        case 'home-equity':
            questionsContainer.innerHTML += `
                <div class="input-group">
                    <label>Do you currently have home equity you would be willing to leverage 
                           to buy another property? If so, how much?</label>
                    <input type="text" id="home-equity-leverage-amount" 
                           placeholder="e.g., $200,000, or 'Not applicable'"
                           onchange="updateLongTermTextInput('home-equity', 'leverage-amount', this.value)">
                    <small>If you're not sure, enter your approximate home equity</small>
                </div>
            `;
            break;
            
        case 'early-inheritance':
            questionsContainer.innerHTML += `
                <div class="input-group">
                    <label>Would purchasing a property with the intention of gifting it to 
                           your child negatively affect your own financial retirement goals?</label>
                    <div class="button-group">
                        <button type="button" class="toggle-btn" data-value="yes" 
                                onclick="selectLongTermAnswer('early-inheritance', 'retirement-impact', 'yes')">Yes</button>
                        <button type="button" class="toggle-btn" data-value="no" 
                                onclick="selectLongTermAnswer('early-inheritance', 'retirement-impact', 'no')">No</button>
                        <button type="button" class="toggle-btn" data-value="unsure" 
                                onclick="selectLongTermAnswer('early-inheritance', 'retirement-impact', 'unsure')">Unsure</button>
                    </div>
                    <input type="hidden" id="early-inheritance-retirement-impact" value="">
                </div>
            `;
            break;
    }
    
    // Add general questions for ALL models with long-term planning
    addGeneralLongTermQuestions(questionsContainer, modelId);
    
    // Append the questions container to the page
    inputSection.appendChild(questionsContainer);
    
    // Restore any previously answered values
    restoreLongTermAnswers(modelId);
}

// Add this function to restore previously answered long-term answers
function restoreLongTermAnswers(modelId) {
    const inputs = modelInputs[modelId] || {};
    const page = document.getElementById(MODELS[modelId].pageId);
    if (!page) return;
    
    // Check all long-term question inputs
    const longTermInputs = page.querySelectorAll('.long-term-questions input, .long-term-questions select');
    longTermInputs.forEach(input => {
        const inputId = input.id;
        
        // Look for answers in modelInputs
        let answer = inputs[inputId];
        
        if (answer) {
            input.value = answer;
            
            // For hidden inputs with button groups, also select the corresponding button
            if (input.type === 'hidden' && answer) {
                const buttonGroup = input.parentElement.querySelector('.button-group');
                if (buttonGroup) {
                    buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
                        btn.classList.remove('selected');
                        if (btn.dataset.value === answer) {
                            btn.classList.add('selected');
                        }
                    });
                }
            }
            
            // Mark as previously answered
            markAsPreviouslyAnswered(input);
        }
    });
}

// Add this function to mark inputs as previously answered
function markAsPreviouslyAnswered(inputElement) {
    if (!inputElement) return;
    
    const container = inputElement.closest('.input-group');
    if (container) {
        container.classList.add('previously-answered');
        
        // Add a visual indicator
        const existingBadge = container.querySelector('.answered-badge');
        if (!existingBadge) {
            const badge = document.createElement('span');
            badge.className = 'answered-badge';
            badge.textContent = '✓ Previously Answered';
            badge.style.cssText = 'font-size: 0.8rem; color: #27ae60; margin-left: 0.5rem; font-weight: bold;';
            container.querySelector('label').appendChild(badge);
        }
    }
}

function addGeneralLongTermQuestions(container, modelId) {
    // Check if this model already has general questions from a different source
    if (container.innerHTML.includes('primary-goal')) {
        return; // Already have general questions
    }
    
    container.innerHTML += `
        <div class="input-group">
            <label>What is your primary financial goal for your child right now?</label>
            <div class="button-group">
                <button type="button" class="toggle-btn" data-value="downpayment" 
                        onclick="selectLongTermAnswer('${modelId}', 'primary-goal', 'downpayment')">Future down payment for a home</button>
                <button type="button" class="toggle-btn" data-value="education" 
                        onclick="selectLongTermAnswer('${modelId}', 'primary-goal', 'education')">Funding post-secondary education</button>
                <button type="button" class="toggle-btn" data-value="both" 
                        onclick="selectLongTermAnswer('${modelId}', 'primary-goal', 'both')">Both equally</button>
            </div>
            <input type="hidden" id="${modelId}-primary-goal" value="">
        </div>
        
        <div class="input-group">
            <label>Do you have any experience investing in rental real estate?</label>
            <div class="button-group">
                <button type="button" class="toggle-btn" data-value="yes" 
                        onclick="selectLongTermAnswer('${modelId}', 'rental-experience', 'yes')">Yes</button>
                <button type="button" class="toggle-btn" data-value="no" 
                        onclick="selectLongTermAnswer('${modelId}', 'rental-experience', 'no')">No</button>
            </div>
            <input type="hidden" id="${modelId}-rental-experience" value="">
        </div>
        
        <div class="input-group">
            <label>Are you comfortable with the responsibilities of being a landlord?</label>
            <div class="button-group">
                <button type="button" class="toggle-btn" data-value="yes" 
                        onclick="selectLongTermAnswer('${modelId}', 'landlord-comfort', 'yes')">Yes</button>
                <button type="button" class="toggle-btn" data-value="no" 
                        onclick="selectLongTermAnswer('${modelId}', 'landlord-comfort', 'no')">No</button>
                <button type="button" class="toggle-btn" data-value="unsure" 
                        onclick="selectLongTermAnswer('${modelId}', 'landlord-comfort', 'unsure')">Unsure</button>
            </div>
            <input type="hidden" id="${modelId}-landlord-comfort" value="">
        </div>
        
        <div class="input-group">
            <label>Are you currently saving or investing specifically for your child's future?</label>
            <div class="input-with-helper">
                <input type="text" id="${modelId}-current-saving-assets" 
                       placeholder="e.g., RESP, TFSA, non-registered investments"
                       onchange="updateLongTermTextInput('${modelId}', 'current-saving-assets', this.value)">
                <button type="button" class="helper-btn" onclick="useDefault('${modelId}-current-saving-assets', 'Not currently saving specifically')">
                    🤔 Not sure?
                </button>
            </div>
        </div>
    `;
}

// Add this helper function for text inputs in long-term questions
function updateLongTermTextInput(modelId, fieldBase, value) {
    const fieldId = `${modelId}-${fieldBase}`;
    if (!modelInputs[modelId]) {
        modelInputs[modelId] = {};
    }
    modelInputs[modelId][fieldId] = value;
    localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
}

// Helper function for long-term question answers
function selectLongTermAnswer(modelId, fieldBase, value) {
    console.log(`selectLongTermAnswer called: ${modelId}, ${fieldBase}, ${value}`);
    
    // Create the full field ID with model prefix
    const fieldId = `${modelId}-${fieldBase}`;
    const hiddenInput = document.getElementById(fieldId);
    
    if (!hiddenInput) {
        console.error(`Hidden input ${fieldId} not found`);
        return;
    }
    
    // Find the button group
    const buttonGroup = hiddenInput.parentElement.querySelector('.button-group');
    if (buttonGroup) {
        buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.value === value) {
                btn.classList.add('selected');
            }
        });
    }
    
    // Set the hidden input value
    hiddenInput.value = value;
    
    // Store in modelInputs immediately
    if (!modelInputs[modelId]) {
        modelInputs[modelId] = {};
    }
    modelInputs[modelId][fieldId] = value;
    
    // Save to localStorage
    localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
    
    console.log(`Saved ${fieldId}: ${value} for model ${modelId}`);
}

function updateBuildCost() {
    const buildType = document.getElementById('mg-build-type').value;
    const customGroup = document.getElementById('mg-custom-cost-group');
    
    if (buildType === 'custom') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

function showModelInputPage(modelId) {
    console.log(`showModelInputPage called with: ${modelId}`);
    
    // Hide all model input pages
    document.querySelectorAll('.model-input-page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Also hide feasibility page if it's visible
    const feasibilityPage = document.getElementById('feasibility-page');
    if (feasibilityPage) {
        feasibilityPage.classList.remove('active');
    }

    // Show the requested model page
    const pageId = MODELS[modelId].pageId;
    const page = document.getElementById(pageId);
    
    if (page) {
        page.classList.add('active');
        window.scrollTo(0, 0);
        
        // Update current model index
        const newIndex = feasibleModels.indexOf(modelId);
        if (newIndex !== -1) {
            currentModelIndex = newIndex;
        }
        
        // Update the Save button text based on whether this is the last model
        updateSaveButtonForCurrentModel();
        
    } else {
        console.error(`Page ${pageId} not found for model ${modelId}`);
        // Skip this model and go to next
        skipModel(modelId);
        return;
    }
}

function updateSaveButtonForCurrentModel() {
    // Get the current model page
    const currentModelId = feasibleModels[currentModelIndex];
    if (!currentModelId) return;
    
    const page = document.getElementById(MODELS[currentModelId].pageId);
    if (!page) return;
    
    // Find the Save button
    const saveButton = page.querySelector('.form-actions button:not(.secondary-btn)');
    if (!saveButton) return;
    
    // Check if this is the last model
    if (currentModelIndex === feasibleModels.length - 1) {
        // Last model - change button to "Finish & Compare Results"
        saveButton.textContent = 'Finish & Compare Results';
        
        // For ALL models, just finish
        saveButton.onclick = function() {
            saveCurrentModelInputs();
            finishAllInputs();
        };
    } else {
        // Not last model - keep as "Save & Continue"
        saveButton.textContent = 'Save & Continue';
        
        // Restore original onclick handler based on model type
        switch(currentModelId) {
            case 'three-thirty':
                saveButton.onclick = saveThreeThirtyInputs;
                break;
            case 'co-investing':
                saveButton.onclick = saveCoInvestingInputs;
                break;
            case 'multi-gen':
                saveButton.onclick = saveMultiGenInputs;
                break;
            case 'early-inheritance':
                saveButton.onclick = saveEarlyInheritanceInputs;
                break;
            case 'home-equity':
                saveButton.onclick = saveHomeEquityInputs;
                break;
        }
    }
}

function saveCurrentModelAndContinue() {
    // Save current model inputs
    saveCurrentModelInputs();
    
    // Move to next model if available
    if (currentModelIndex < feasibleModels.length - 1) {
        currentModelIndex++;
        showModelInputPage(feasibleModels[currentModelIndex]);
    } else {
        // This is the last model, finish
        finishAllInputs();
    }
}

function saveCurrentModelInputs() {
    if (feasibleModels.length === 0 || currentModelIndex < 0) {
        console.log("No current model to save");
        return;
    }

    const currentModel = feasibleModels[currentModelIndex];
    if (!currentModel) return;
    
    // Get all inputs from current model page
    const page = document.getElementById(MODELS[currentModel].pageId);
    if (!page) return;
    
    // Initialize model inputs object
    modelInputs[currentModel] = modelInputs[currentModel] || {};
    
    // Save all form inputs
    const inputs = page.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.id && input.id !== '') {
            if (input.type === 'checkbox' || input.type === 'radio') {
                modelInputs[currentModel][input.id] = input.checked;
            } else if (input.type === 'range') {
                modelInputs[currentModel][input.id] = parseInt(input.value);
            } else {
                modelInputs[currentModel][input.id] = input.value;
            }
        }
    });
    
    // Save comfort level
    const comfortSlider = page.querySelector('.comfort-slider');
    if (comfortSlider) {
        modelInputs[currentModel].comfort = parseInt(comfortSlider.value);
    }
    
    console.log(`Saved inputs for ${currentModel}:`, modelInputs[currentModel]);

    // Immediately save to localStorage
    localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
}

// ============================================
// MODEL-SPECIFIC SAVE FUNCTIONS (SIMPLIFIED)
// ============================================

function saveThreeThirtyInputs() {
    saveCurrentModelInputs();
    // Check if we should save long-term questions
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const isLongTermPlanning = (questionnaireData.clientType === 'parent' || 
                               questionnaireData.clientType === 'both') && 
                               questionnaireData.answers['child-age-range'] === 'under18';
    
    if (isLongTermPlanning) {
        // Save general long-term questions for this model
        const page = document.getElementById('three-thirty-page');
        if (page) {
            const generalQuestions = page.querySelectorAll('.long-term-questions input, .long-term-questions select');
            generalQuestions.forEach(input => {
                if (input.id && input.id !== '') {
                    modelInputs['three-thirty'][input.id] = input.value;
                }
            });
        }
    }
    saveCurrentModelAndContinue();
}

function saveCoInvestingInputs() {
    saveCurrentModelInputs();
    saveCurrentModelAndContinue();
}

function saveMultiGenInputs() {
    saveCurrentModelInputs();
    saveCurrentModelAndContinue();
}

function saveEarlyInheritanceInputs() {
    saveCurrentModelInputs();
    saveCurrentModelAndContinue();
}

function saveHomeEquityInputs() {
    // First save all current inputs
    saveCurrentModelInputs();
    
    // Get the home equity method
    const methodSelect = document.getElementById('he-method');
    const method = methodSelect ? methodSelect.value : null;
    
    console.log(`Home Equity Method selected: ${method}`);
    
    // Just save and continue - qualification check moved to UI selection
    saveCurrentModelAndContinue();
}

function skipModel(modelId) {
    console.log(`Skipping model: ${modelId}`);
    
    // Remove from feasible models
    const index = feasibleModels.indexOf(modelId);
    if (index > -1) {
        feasibleModels.splice(index, 1);
    }
    
    // If no models left, finish
    if (feasibleModels.length === 0) {
        finishAllInputs();
        return;
    }
    
    // Adjust current index
    if (index <= currentModelIndex && currentModelIndex > 0) {
        currentModelIndex = Math.max(0, currentModelIndex - 1);
    }
    
    // Show the current model
    if (currentModelIndex < feasibleModels.length) {
        showModelInputPage(feasibleModels[currentModelIndex]);
    }
}

function finishAllInputs() {
    console.log("Finishing all model inputs...");
    
    // Save current model inputs
    saveCurrentModelInputs();
    
    // Run analysis for all models
    allResults = {};
    feasibleModels.forEach(modelId => {
        try {
            console.log(`Running analysis for: ${modelId}`);
            allResults[modelId] = runModelAnalysis(modelId, modelInputs[modelId] || {});
        } catch (error) {
            console.error(`Error analyzing ${modelId}:`, error);
            allResults[modelId] = { netBenefit: 0, risk: 3, error: error.message };
        }
    });
    
    // Save results to localStorage for comparison page
    localStorage.setItem('modelResults', JSON.stringify(allResults));
    localStorage.setItem('feasibleModels', JSON.stringify(feasibleModels));
    localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
    
    console.log("Analysis complete. Results:", allResults);
    console.log("Navigating to comparison page...");
    
    // Navigate to comparison page - FIXED FILENAME
    window.location.href = 'ResultComparsionPage.html';
}

function handleFinishButtonClick() {
    // Check which model is currently active
    const activePage = document.querySelector('.model-input-page.active');
    if (!activePage) return;
    
    const modelId = Object.keys(MODELS).find(key => MODELS[key].pageId === activePage.id);
    
    // For all models including home equity, just finish
    finishAllInputs();
}

// ============================================
// MODEL ANALYSIS FUNCTIONS (keep existing)
// ============================================

function runModelAnalysis(modelId, inputs) {
    // This is a simplified analysis. In production, this would be more complex.
    
    switch(modelId) {
        case 'three-thirty':
            return analyzeThreeThirty(inputs);
        case 'co-investing':
            return analyzeCoInvesting(inputs);
        case 'multi-gen':
            return analyzeMultiGen(inputs);
        case 'early-inheritance':
            return analyzeEarlyInheritance(inputs);
        case 'home-equity':
            return analyzeHomeEquity(inputs);
        default:
            return { netBenefit: 0, risk: 3, timeToHome: 5 };
    }
}

function analyzeThreeThirty(inputs) {
    const childIncome = parseFloat(inputs['tt-child-income']) || 60000;
    const savingsRate = (parseFloat(inputs['tt-savings-rate']) || 70) / 100;
    const currentSavings = parseFloat(inputs['tt-current-savings']) || 0;
    const targetDownPayment = parseFloat(inputs['tt-target-downpayment']) || 80000;
    const homePrice = parseFloat(inputs['tt-home-price']) || 400000;
    const savingsYears = parseFloat(inputs['tt-savings-years']) || 3;
    
    // Parent loan scenario parameters
    const parentLoanAmount = parseFloat(inputs['tt-parent-loan-amount']) || 200000;
    const parentLoanRate = (parseFloat(inputs['tt-parent-loan-rate']) || 5) / 100;
    const mortgageRate = 0.045; // Assuming 4.5% mortgage rate
    const appreciationRate = 0.04; // 4% annual home appreciation
    const mortgageTerm = 25; // Standard 25-year mortgage
    const analysisYears = 30; // Compare over 30 years
    
    // Calculate child's annual savings
    const annualSavings = childIncome * savingsRate;
    
    // SCENARIO 1: Parent Loan (Child buys immediately)
    // ================================================
    
    // Child gets loan and buys home immediately
    const scenario1DownPayment = Math.min(parentLoanAmount, homePrice * 0.2); // Max 20% down payment
    const scenario1MortgageAmount = homePrice - scenario1DownPayment;
    
    // Calculate monthly mortgage payment
    const monthlyMortgageRate = mortgageRate / 12;
    const mortgageMonths = mortgageTerm * 12;
    const monthlyMortgagePayment = scenario1MortgageAmount * 
        (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, mortgageMonths)) / 
        (Math.pow(1 + monthlyMortgageRate, mortgageMonths) - 1);
    
    // Calculate parent loan payment (amortized over 30 years)
    const monthlyParentRate = parentLoanRate / 12;
    const parentLoanMonths = 30 * 12;
    const monthlyParentPayment = scenario1DownPayment * 
        (monthlyParentRate * Math.pow(1 + monthlyParentRate, parentLoanMonths)) / 
        (Math.pow(1 + monthlyParentRate, parentLoanMonths) - 1);
    
    // Calculate home value after 30 years
    const scenario1HomeValue = homePrice * Math.pow(1 + appreciationRate, analysisYears);
    
    // Calculate remaining mortgage balance after 30 years (mortgage paid off after 25 years)
    const cenario1RemainingMortgage = 0;

    // Calculate remaining parent loan balance after 30 years
    const scenario1RemainingParentLoan = 0;
    
    // Calculate total interest paid
    const scenario1MortgageInterest = (monthlyMortgagePayment * mortgageMonths) - scenario1MortgageAmount;
    const scenario1ParentLoanInterest = (monthlyParentPayment * parentLoanMonths) - scenario1DownPayment;
    const scenario1TotalInterest = scenario1MortgageInterest + scenario1ParentLoanInterest;
    
    // Calculate equity after 30 years
    const scenario1Equity = scenario1HomeValue - monthlyMortgagePayment * mortgageTerm *12 - monthlyParentPayment * 12 * analysisYears;
    
    // SCENARIO 2: Three for Thirty (Child saves for 3 years, then buys)
    // ==================================================================
    
    // Child saves for 3 years
    const scenario2Savings = currentSavings + (annualSavings * savingsYears);
    
    // Home price after 3 years of appreciation
    //const scenario2HomePrice = homePrice * Math.pow(1 + appreciationRate, savingsYears);
    
    // Check if savings meet down payment requirement
    const scenario2DownPayment = Math.min(scenario2Savings, homePrice * 0.2);
    const scenario2MortgageAmount =homePrice - scenario2DownPayment;
    
    // Calculate time child actually owns home
    const scenario2OwnershipYears = analysisYears - savingsYears; // 27 years
    
    // Calculate monthly mortgage payment for Scenario 2
    const scenario2MonthlyMortgagePayment = scenario2MortgageAmount * 
        (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, mortgageMonths)) / 
        (Math.pow(1 + monthlyMortgageRate, mortgageMonths) - 1);
    
    // Calculate home value after 27 years of ownership (30 years total)
    const scenario2HomeValue = homePrice * Math.pow(1 + appreciationRate, scenario2OwnershipYears);
    
    // Calculate remaining mortgage balance after 27 years of payments
    // (mortgage started 3 years later, so after 27 years, it's been paid for 27 years)
        const scenario2RemainingMortgage = 0;
    
    // Calculate mortgage interest paid in Scenario 2
    const scenario2MortgageInterest = (scenario2MonthlyMortgagePayment * mortgageMonths) - 
            (scenario2MortgageAmount);
    
    
    // Calculate equity after 27 years of ownership
    const scenario2Equity = scenario2HomeValue - scenario2MonthlyMortgagePayment * mortgageTerm * 12;
    
    // COMPARISON ANALYSIS
    // ===================
    
    // Net benefit: Compare equity values
    const netBenefit = scenario2Equity - scenario1Equity;
    
    // Calculate total costs
    const scenario1TotalCost = scenario1TotalInterest;
    const scenario2TotalCost = scenario2MortgageInterest;
    
    // Check if savings strategy meets goal
    const meetsGoal = scenario2Savings >= targetDownPayment;
    const successRate = meetsGoal ? 100 : Math.min(100, (scenario2Savings / targetDownPayment) * 100);
    
    // Calculate time to home purchase
    let timeToHome = savingsYears;
    if (!meetsGoal) {
        // Calculate additional years needed
        const annualDeficit = targetDownPayment - scenario2Savings;
        const additionalYears = Math.ceil(annualDeficit / annualSavings);
        timeToHome = savingsYears + additionalYears;
    }
    
    // Risk assessment (1-5 scale)
    let risk = 2; // Low risk for saving strategy
    
    // Higher risk if:
    // - Savings rate is unsustainable (>80%)
    if (savingsRate > 0.8) risk += 1;
    // - Down payment ratio is too low (<10%)
    if (scenario2DownPayment / homePrice < 0.1) risk += 1;
    // - Mortgage payment is high relative to income
    const mortgageToIncomeRatio = (scenario2MonthlyMortgagePayment * 12) / childIncome;
    if (mortgageToIncomeRatio > 0.32) risk += 1; // Above 32% is risky
    
    risk = Math.min(5, Math.max(1, risk));
    
    return {
        childBeneiftValue: Math.round(scenario2Equity),
        netBenefit: Math.round(netBenefit),
        risk: risk,
        timeToHome: timeToHome,
        successRate: successRate,
        
        // Scenario 1 details
        scenario1DownPayment: Math.round(scenario1DownPayment),
        scenario1MortgageAmount: Math.round(scenario1MortgageAmount),
        scenario1ParentLoanPayment: Math.round(monthlyParentPayment),
        scenario1Equity: Math.round(scenario1Equity),
        scenario1HomeValue: Math.round(scenario1HomeValue),
        scenario1TotalInterest: Math.round(scenario1TotalInterest),
        scenario1MonthlyPayment: Math.round(monthlyMortgagePayment + monthlyParentPayment),
        
        // Scenario 2 details
        scenario2Equity: Math.round(scenario2Equity),
        scenario2HomeValue: Math.round(scenario2HomeValue),
        scenario2MortgageAmount: Math.round(scenario2MortgageAmount),
        scenario2TotalInterest: Math.round(scenario2TotalCost),
        scenario2MonthlyPayment: Math.round(scenario2MonthlyMortgagePayment),
        scenario2SavingsAmount: Math.round(scenario2Savings),
        scenario2DownPayment: Math.round(scenario2DownPayment),
        scenario2DownPaymentPercent: Math.round((scenario2DownPayment / homePrice) * 100),
        
        // Comparison metrics
        equityDifference: Math.round(scenario2Equity - scenario1Equity),
        costDifference: Math.round(scenario1TotalCost - scenario2TotalCost),
        meetsDownPaymentGoal: meetsGoal
    };
}

// Enhanced Co-Investing Analysis (from pilot 1 logic)
function analyzeEnhancedCoInvesting(inputs, buyerDetails, helperDetails) {
    // Investment details
    const investment = parseFloat(inputs['ci-investment-amount']) || 200000;
    const stockReturn = (parseFloat(inputs['ci-stock-return']) || 6) / 100;
    const stockVolatility = (parseFloat(inputs['ci-stock-volatility']) || 10) / 100;
    const accountType = inputs['ci-account-type'] || 'non-registered';
    
    // Loan details
    const loanAmount = parseFloat(inputs['ci-loan-amount']) || 200000;
    const loanRate = (parseFloat(inputs['ci-loan-rate']) || 5) / 100;
    const repaymentType = inputs['ci-repayment-type'] || 'lump-sum';
    const taxAdvantage = inputs['ci-tax-advantage'] || 'no';
    
    // Home details
    const homePrice = parseFloat(inputs['ci-home-price']) || 400000;
    const downpaymentPercent = (parseFloat(inputs['ci-downpayment-percent']) || 20) / 100;
    const mortgageRate = (parseFloat(inputs['ci-mortgage-rate']) || 4.5) / 100;
    const appreciation = (parseFloat(inputs['ci-annual-appreciation']) || 4) / 100;
    
    // Tax details
    const parentTaxRate = (parseFloat(inputs['ci-marginal-tax']) || 25) / 100;
    const capitalGainsRate = (parseFloat(inputs['ci-capital-gain']) || 50) / 100;
    const timeHorizon = parseFloat(inputs['ci-time-horizon']) || 30;
    
    // Rental savings details
    const monthlyRent = parseFloat(inputs['ci-monthly-rent']) || 1500;
    const rentInflation = (parseFloat(inputs['ci-rent-inflation']) || 3) / 100;
    
    // Calculate Scenario 1: Keep in Stocks
    const stockFutureValue = investment * Math.pow(1 + stockReturn, timeHorizon);
    
    // Tax on stock gains
    let stockTax = 0;
    if (accountType === 'non-registered') {
        const stockGain = stockFutureValue - investment;
        const taxableGain = stockGain * capitalGainsRate;
        stockTax = taxableGain * parentTaxRate;
    }
    const stockAfterTax = stockFutureValue - stockTax;
    
    // Calculate Scenario 2: Lend to Child (with detailed mortgage calculations)
    // =========================================================================
    
    // 1. Child buys home with parent's loan as down payment
    const downpaymentAmount = Math.min(loanAmount, homePrice * downpaymentPercent);
    const mortgageAmount = homePrice - downpaymentAmount;
    
    // 2. Calculate child's mortgage payments (amortized over 25 years)
    const mortgageTerm = 25;
    const monthlyMortgageRate = mortgageRate / 12;
    const mortgageMonths = mortgageTerm * 12;
    const monthlyMortgagePayment = mortgageAmount * 
        (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, mortgageMonths)) / 
        (Math.pow(1 + monthlyMortgageRate, mortgageMonths) - 1);
    
    // 3. Calculate parent loan repayment based on type
    let monthlyParentPayment = 0;
    let totalParentInterest = 0;
    let parentLoanBalanceAtHorizon = 0;
    
    const monthlyLoanRate = loanRate / 12;
    const loanMonths = timeHorizon * 12;
    
    switch(repaymentType) {
        case 'lump-sum':
            // Child pays interest-only until end, then lump sum
            monthlyParentPayment = downpaymentAmount * monthlyLoanRate; // Interest only
            totalParentInterest = monthlyParentPayment * loanMonths;
            parentLoanBalanceAtHorizon = downpaymentAmount; // Still owes full principal
            break;
            
        case 'interest-only':
            // Interest only payments
            monthlyParentPayment = downpaymentAmount * monthlyLoanRate;
            totalParentInterest = monthlyParentPayment * loanMonths;
            parentLoanBalanceAtHorizon = downpaymentAmount; // Still owes full principal
            break;
            
        case 'principal+interest':
            // Amortized over timeHorizon
            monthlyParentPayment = downpaymentAmount * 
                (monthlyLoanRate * Math.pow(1 + monthlyLoanRate, loanMonths)) / 
                (Math.pow(1 + monthlyLoanRate, loanMonths) - 1);
            totalParentInterest = (monthlyParentPayment * loanMonths) - downpaymentAmount;
            parentLoanBalanceAtHorizon = 0; // Fully paid off
            break;
            
        case 'deferred':
            // No payments until sale or refinance
            monthlyParentPayment = 0;
            parentLoanBalanceAtHorizon = downpaymentAmount * Math.pow(1 + loanRate, timeHorizon);
            totalParentInterest = parentLoanBalanceAtHorizon - downpaymentAmount;
            break;
    }
    
    // 4. Calculate home future value
    const homeFutureValue = homePrice * Math.pow(1 + appreciation, timeHorizon);
    
    // 5. Calculate remaining mortgage balance after timeHorizon
    let remainingMortgage = 0;
    if (timeHorizon < mortgageTerm) {
        // Mortgage not fully paid off
        const paymentsMade = timeHorizon * 12;
        const futureValueFactor = Math.pow(1 + monthlyMortgageRate, mortgageMonths);
        const paymentFactor = (Math.pow(1 + monthlyMortgageRate, paymentsMade) - 1) / monthlyMortgageRate;
        
        remainingMortgage = mortgageAmount * futureValueFactor - 
                          monthlyMortgagePayment * paymentFactor * Math.pow(1 + monthlyMortgageRate, paymentsMade);
        remainingMortgage = Math.max(0, remainingMortgage);
    }
    // If timeHorizon >= mortgageTerm, mortgage is paid off (remainingMortgage = 0)
    
    // 6. Calculate child's total mortgage interest paid
    let totalMortgageInterest = 0;
    if (timeHorizon <= mortgageTerm) {
        const totalMortgagePayments = monthlyMortgagePayment * 12 * timeHorizon;
        const principalPaid = mortgageAmount - remainingMortgage;
        totalMortgageInterest = totalMortgagePayments - principalPaid;
    } else {
        // Mortgage paid off early, calculate interest for full term
        const totalMortgagePayments = monthlyMortgagePayment * 12 * mortgageTerm;
        totalMortgageInterest = totalMortgagePayments - mortgageAmount;
    }
    
    // 7. Calculate child's equity in home
    const childEquity = homeFutureValue - remainingMortgage - parentLoanBalanceAtHorizon;
    
    // 8. Calculate child's rental savings
    let totalRentPaid = 0;
    let currentRent = monthlyRent;
    for (let year = 0; year < timeHorizon; year++) {
        totalRentPaid += currentRent * 12;
        currentRent *= (1 + rentInflation);
    }
    
    // 9. Calculate child's total housing costs (mortgage + parent loan payments)
    let totalChildPayments = 0;
    if (repaymentType === 'deferred') {
        totalChildPayments = monthlyMortgagePayment * 12 * Math.min(timeHorizon, mortgageTerm);
    } else {
        totalChildPayments = (monthlyMortgagePayment + monthlyParentPayment) * 12 * timeHorizon;
    }
    
    // 10. Child's net benefit from buying vs renting
    const childRentSavings = totalRentPaid - totalChildPayments;
    
    // 11. Parent's interest income after tax
    let interestTax = 0;
    if (taxAdvantage === 'no') {
        interestTax = totalParentInterest * parentTaxRate;
    }
    const interestAfterTax = totalParentInterest - interestTax;
    
    // 12. Total lending scenario value
    // From family perspective: child's equity + child's rent savings + parent's interest after tax
    const lendingScenarioValue = childEquity + childRentSavings + interestAfterTax;
    
    // Net benefit comparison (family perspective)
    const netBenefit = lendingScenarioValue - stockAfterTax;
    
    // Risk assessment
    let riskLevel = 3; // Medium
    if (stockVolatility > 0.15) riskLevel = 4;
    if (appreciation < 0.02) riskLevel = 4; // Low appreciation increases risk
    if (loanRate > 0.07) riskLevel += 1; // High interest rate increases risk
    
    // Success probability
    let successProbability = 70;
    const mortgageToIncomeRatio = (monthlyMortgagePayment * 12) / (parseFloat(inputs['ci-child-income']) || 60000);
    if (mortgageToIncomeRatio > 0.32) successProbability -= 10;
    if (childRentSavings > 0) successProbability += 10;
    if (netBenefit > 100000) successProbability = 85;
    if (netBenefit < -50000) successProbability = 40;
    
    return {
        childBeneiftValue: Math.round(childEquity),
        netBenefit: Math.round(netBenefit),
        risk: riskLevel,
        timeToHome: 0, // Immediate with this model
        successProbability: Math.min(100, Math.max(0, successProbability)),
        
        // Detailed breakdown
        stockAfterTax: Math.round(stockAfterTax),
        lendingScenarioValue: Math.round(lendingScenarioValue),
        
        // Child's position
        childEquity: Math.round(childEquity),
        childRentSavings: Math.round(childRentSavings),
        totalRentPaid: Math.round(totalRentPaid),
        totalChildPayments: Math.round(totalChildPayments),
        monthlyTotalPayment: Math.round(monthlyMortgagePayment + monthlyParentPayment),
        remainingMortgage: Math.round(remainingMortgage),
        parentLoanBalanceAtHorizon: Math.round(parentLoanBalanceAtHorizon),
        
        // Parent's position
        parentInterestAfterTax: Math.round(interestAfterTax),
        totalParentInterest: Math.round(totalParentInterest),
        
        // Property details
        homeFutureValue: Math.round(homeFutureValue),
        homePrice: Math.round(homePrice),
        downpaymentAmount: Math.round(downpaymentAmount),
        
        // Mortgage details
        monthlyMortgagePayment: Math.round(monthlyMortgagePayment),
        totalMortgageInterest: Math.round(totalMortgageInterest),
        
        // Financial metrics
        mortgageToIncomeRatio: (mortgageToIncomeRatio * 100).toFixed(1) + '%',
        debtServiceRatio: (((monthlyMortgagePayment + monthlyParentPayment) * 12) / 
                          (parseFloat(inputs['ci-child-income']) || 60000) * 100).toFixed(1) + '%',
        
        // Comparison
        opportunityCost: Math.round(stockAfterTax - interestAfterTax),
        netFamilyBenefit: Math.round(childEquity + childRentSavings + interestAfterTax - stockAfterTax)
    };
}

function analyzeCoInvesting(inputs) {
    // Use the enhanced analysis function
    return analyzeEnhancedCoInvesting(inputs, {}, {});
}
function analyzeMultiGen(inputs) {
    console.log("mul gen inputs: " + inputs)
     // Construction details
    const buildType = inputs['mg-build-type'] || 'laneway';
    let buildCost = 0;
    
    if (buildType === 'laneway') {
        buildCost = 500000;
    } else if (buildType === 'suite') {
        buildCost = 100000;
    } else {
        buildCost = parseFloat(inputs['mg-custom-cost']) || 500000;
    }
    
    const childEquityShare = (parseFloat(inputs['mg-child-equity']) || 15) / 100;
    const livingYears = parseFloat(inputs['mg-living-years']) || 10;
    
    // Additional financial parameters needed
    const propertyValue = parseFloat(inputs['mg-property-value']) || 1000000; // Parent's current property value
    const constructionLoanRate = (parseFloat(inputs['mg-loan-rate']) || 5.5) / 100; // Construction loan interest rate
    const constructionLoanTerm = parseFloat(inputs['mg-loan-term']) || 25; // Construction loan term
    const appreciationRate = 0.04; // 4% annual appreciation
    const analysisYears = 30; // 30-year analysis period
    
    // SCENARIO CALCULATION: Child Builds Equity by Servicing Construction Loan
    // ========================================================================
    
    // 1. Calculate construction loan details
    const monthlyLoanRate = constructionLoanRate / 12;
    const loanMonths = constructionLoanTerm * 12;
    
    // Monthly construction loan payment (amortized over loan term)
    const monthlyConstructionPayment = buildCost * 
        (monthlyLoanRate * Math.pow(1 + monthlyLoanRate, loanMonths)) / 
        (Math.pow(1 + monthlyLoanRate, loanMonths) - 1);
    
    // 2. Calculate child's total cost (service payments for livingYears)
    const childTotalPayments = monthlyConstructionPayment * 12 * livingYears;
    
    // 3. Calculate property value with addition
    const initialPropertyValue = propertyValue;
    const propertyValueWithAddition = propertyValue + buildCost; // Addition adds to property value
    
    // 4. Calculate future property value after 30 years
    const futurePropertyValue = propertyValueWithAddition * Math.pow(1 + appreciationRate, constructionLoanTerm);
    
    // 5. Calculate child's equity value
    const childEquityValue = futurePropertyValue * childEquityShare;
    
    // 6. Alternative: Child rents instead (for comparison)
    // Assuming market rent for similar accommodation
    const monthlyMarketRent = parseFloat(inputs['mg-rent-if-not-living']) || 1500;
    const totalRentCostIfRenting = monthlyMarketRent * 12 * livingYears;
    
    // 7. Calculate child's net benefit
    const childNetBenefit = childEquityValue - childTotalPayments + totalRentCostIfRenting;
    
    // 8. Calculate parent's benefit
    // Parent gets: Remaining equity + Appreciation on original property - Opportunity cost of equity
    const parentEquityShare = 1 - childEquityShare;
    const parentFutureEquity = futurePropertyValue * parentEquityShare;
    const parentNetBenefit = parentFutureEquity - propertyValue;
    const rentSavings = totalRentCostIfRenting - childTotalPayments

    // 9. Calculate property value increase from addition
    const valueAddedByConstruction = buildCost * Math.pow(1 + appreciationRate, analysisYears);
    
    // Risk assessment (1-5 scale)
    let risk = 4; // High risk due to construction complexities
    
    // Lower risk if:
    // - Construction is minor (suite vs laneway)
    if (buildType === 'suite') risk -= 1;
    // - Short construction period
    if (livingYears < 5) risk += 1; // Shorter term increases risk of not building enough equity
    
    // Higher risk if:
    // - Construction cost is high relative to property value
    if (buildCost / propertyValue > 0.5) risk += 1;
    // - Property doesn't support construction
    const propertySupport = inputs['mg-property-support'] || 'unsure';
    if (propertySupport === 'no') risk = 5; // Maximum risk
    
    risk = Math.min(5, Math.max(1, risk));
    
    // Time to benefit for child (when they can access equity)
    const timeToBenefit = analysisYears; // Typically when property is sold/refinanced
    
    // Success probability based on equity vs payments
    let successProbability = 70;
    const benefitToCostRatio = childNetBenefit / childTotalPayments;
    if (benefitToCostRatio > 0.2) successProbability = 90;
    if (benefitToCostRatio < 0) successProbability = 40;
    if (benefitToCostRatio < -0.2) successProbability = 20;
    
    return {
        childBeneiftValue: Math.round(futurePropertyValue*childEquityShare),
        netBenefit: Math.round(childNetBenefit), // Primary metric: child's net benefit
        risk: risk,
        timeToHome: timeToBenefit,
        successProbability: successProbability,
        
        // Child's details
        childNetBenefit: Math.round(childNetBenefit),
        childEquityValue: Math.round(childEquityValue),
        childTotalPayments: Math.round(childTotalPayments),
        monthlyConstructionPayment: Math.round(monthlyConstructionPayment),
        childEquityPercentage: Math.round(childEquityShare * 100),
        
        // Parent's details
        parentNetBenefit: Math.round(parentNetBenefit),
        parentFutureEquity: Math.round(parentFutureEquity),
        parentEquityPercentage: Math.round(parentEquityShare * 100),
        
        // Property details
        futurePropertyValue: Math.round(futurePropertyValue),
        valueAddedByConstruction: Math.round(valueAddedByConstruction),
        buildCost: Math.round(buildCost),
        
        // Comparison metrics
        rentSavingsVsLoanPayments: Math.round(rentSavings),
        benefitToCostRatio: benefitToCostRatio.toFixed(2),
        annualReturnOnInvestment: Math.round((childNetBenefit / childTotalPayments) * 100 / analysisYears),
        
        // Construction details
        buildType: buildType,
        constructionLoanTerm: constructionLoanTerm,
        livingYears: livingYears
    };
}

function analyzeEarlyInheritance(inputs) {
    // ===== INPUT COLLECTION =====
    const earlyAmount = parseFloat(inputs['ei-early-amount']) || 100000;
    const lateAmount = parseFloat(inputs['ei-late-amount']) || 750000;
    const yearsUntilLate = parseFloat(inputs['ei-years-until-late']) || 30;
    const investmentReturn = (parseFloat(inputs['ei-investment-return']) || 6) / 100;
    
    // Rental details
    const monthlyRent = parseFloat(inputs['ei-monthly-rent']) || 1500;
    const rentInflation = (parseFloat(inputs['ei-rent-inflation']) || 3) / 100;
    
    // Home details
    const homePrice = parseFloat(inputs['ei-home-price']) || 500000;
    const homeAppreciation = (parseFloat(inputs['ei-home-appreciation']) || 4) / 100;
    const mortgageRate = (parseFloat(inputs['ei-mortgage-rate']) || 4.5) / 100;
    const downPaymentPercent = 0.2; // 20% down payment
    
    // Other factors
    const retirementImpact = inputs['ei-retirement-impact'] || 'no';
    const childIncome = parseFloat(inputs['ei-child-income']) || 60000;
    
    // Analysis period: Use years until late inheritance (e.g., 30 years)
    const analysisYears = yearsUntilLate;
    
    // ===== SCENARIO 1: EARLY INHERITANCE =====
    function calculateEarlyInheritanceScenario() {
        // Child receives early inheritance as down payment
        const downPayment = Math.min(earlyAmount, homePrice * downPaymentPercent);
        const mortgageAmount = homePrice - downPayment;
        const mortgageTerm = 25; // Standard 25-year mortgage
        
        // Calculate monthly mortgage payment
        const monthlyMortgageRate = mortgageRate / 12;
        const mortgageMonths = mortgageTerm * 12;
        const monthlyMortgagePayment = mortgageAmount * 
            (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, mortgageMonths)) / 
            (Math.pow(1 + monthlyMortgageRate, mortgageMonths) - 1);
        
        // Calculate home value after analysis years
        const futureHomeValue = homePrice * Math.pow(1 + homeAppreciation, analysisYears);
        
        // Calculate remaining mortgage after analysis years
        let remainingMortgage = 0;
        const yearsPaid = Math.min(analysisYears, mortgageTerm);
        if (yearsPaid < mortgageTerm) {
            // Calculate remaining balance
            const paymentsMade = yearsPaid * 12;
            const remainingBalance = mortgageAmount * 
                Math.pow(1 + monthlyMortgageRate, mortgageMonths) - 
                monthlyMortgagePayment * 
                ((Math.pow(1 + monthlyMortgageRate, mortgageMonths) - 1) / monthlyMortgageRate);
            remainingMortgage = Math.max(0, remainingBalance);
        }
        
        // Calculate total mortgage payments made
        const totalMortgagePayments = monthlyMortgagePayment * 12 * yearsPaid;
        const totalMortgageInterest = totalMortgagePayments - (mortgageAmount - remainingMortgage);
       
        // Calculate child's equity
        const childEquity = futureHomeValue - remainingMortgage - totalMortgagePayments;
        
        // Calculate debt service ratio
        const debtServiceRatio = (monthlyMortgagePayment * 12) / childIncome;
        
        return {
            childEquity: Math.round(childEquity),
            futureHomeValue: Math.round(futureHomeValue),
            remainingMortgage: Math.round(remainingMortgage),
            totalMortgagePayments: Math.round(totalMortgagePayments),
            monthlyMortgagePayment: Math.round(monthlyMortgagePayment),
            debtServiceRatio: debtServiceRatio.toFixed(2)
        };
    }
    
    // ===== SCENARIO 2: LATE INHERITANCE (RENTING) =====
    function calculateLateInheritanceScenario() {
        // Child rents for the entire period until receiving inheritance
        let totalRentCost = 0;
        let rentHistory = [];
        let currentRent = monthlyRent * 12; // Annual rent
        
        // Calculate total rent cost with inflation
        for (let year = 1; year <= analysisYears; year++) {
            if (year > 1) {
                currentRent *= (1 + rentInflation);
            }
            totalRentCost += currentRent;
            rentHistory.push({
                year: year,
                annualRent: Math.round(currentRent),
                cumulativeRent: Math.round(totalRentCost)
            });
        }
        
        // Late inheritance grows if received now and invested (parents keep it)
        // But in reality, it's with the parents who might invest it
        const lateInheritanceValue = lateAmount; // Received at the end
        
        // Calculate what the early amount would be worth if invested by parents
        const earlyAmountIfInvested = earlyAmount * Math.pow(1 + investmentReturn, analysisYears);
        
        // Child's total wealth at end of period = Late inheritance - Total rent paid
        // This assumes child has been renting and not saving for home
        const childNetWealth = lateInheritanceValue - totalRentCost;
        
        // Calculate rent-to-income ratio
        const firstYearRentRatio = (monthlyRent * 12) / childIncome;
        const lastYearRent = monthlyRent * Math.pow(1 + rentInflation, analysisYears - 1) * 12;
        const lastYearRentRatio = lastYearRent / (childIncome * Math.pow(1 + rentInflation, analysisYears - 1));
        
        return {
            childNetWealth: Math.round(childNetWealth),
            totalRentCost: Math.round(totalRentCost),
            lateInheritanceValue: Math.round(lateInheritanceValue),
            earlyAmountIfInvested: Math.round(earlyAmountIfInvested),
            firstYearRentRatio: firstYearRentRatio.toFixed(2),
            lastYearRentRatio: lastYearRentRatio.toFixed(2),
            rentHistory: rentHistory
        };
    }
    
    // ===== CALCULATE BOTH SCENARIOS =====
    const earlyScenario = calculateEarlyInheritanceScenario();
    const lateScenario = calculateLateInheritanceScenario();
    
    // ===== COMPARISON CALCULATION =====
    // Net benefit = Early inheritance scenario equity - Late inheritance scenario net wealth
    const netBenefit = earlyScenario.childEquity - lateScenario.childNetWealth;
    console.log("Early Inher: "+ earlyScenario.childEquity + "-" + lateScenario.childNetWealth + "=" +netBenefit) 
    // ===== RETIREMENT IMPACT ADJUSTMENT =====
    let risk = 2; // Base risk (low)
    
    if (retirementImpact === 'moderate') {
        risk = 3;
    } else if (retirementImpact === 'significant') {
        risk = 4;
    }
    
    // Additional risk factors:
    // - High debt service ratio
    if (parseFloat(earlyScenario.debtServiceRatio) > 0.32) {
        risk += 1;
    }
    // - High rent-to-income ratio in late scenario
    if (parseFloat(lateScenario.firstYearRentRatio) > 0.3) {
        risk = Math.max(risk, 3);
    }
    
    risk = Math.min(5, Math.max(1, risk));
    
    // ===== SUCCESS PROBABILITY =====
    let successProbability = 75;
    if (netBenefit > 100000) successProbability = 90;
    if (netBenefit < 0) successProbability = 40;
    if (retirementImpact === 'significant') successProbability = 30;
    
    // ===== TIME TO HOME =====
    // Early inheritance: Immediate
    // Late inheritance: After analysis years
    const timeToHome = 0; // For early inheritance scenario
    
    // ===== FINAL RETURN =====
    return {
        childBeneiftValue: Math.round(earlyScenario.childEquity),
        netBenefit: Math.round(netBenefit),
        risk: risk,
        timeToHome: timeToHome,
        successProbability: successProbability,
        
        // Early inheritance scenario details
        earlyScenario: {
            childEquity: earlyScenario.childEquity,
            futureHomeValue: earlyScenario.futureHomeValue,
            monthlyMortgagePayment: earlyScenario.monthlyMortgagePayment,
            totalMortgagePayments: earlyScenario.totalMortgagePayments,
            debtServiceRatio: earlyScenario.debtServiceRatio,
            remainingMortgage: earlyScenario.remainingMortgage
        },
        
        // Late inheritance scenario details
        lateScenario: {
            childNetWealth: lateScenario.childNetWealth,
            totalRentCost: lateScenario.totalRentCost,
            lateInheritanceValue: lateScenario.lateInheritanceValue,
            earlyAmountIfInvested: lateScenario.earlyAmountIfInvested,
            firstYearRentRatio: lateScenario.firstYearRentRatio,
            lastYearRentRatio: lateScenario.lastYearRentRatio
        },
        
        // Comparison metrics
        equityVsRentDifference: Math.round(earlyScenario.childEquity - lateScenario.totalRentCost),
        inheritanceTimingImpact: Math.round(lateScenario.lateInheritanceValue - earlyScenario.childEquity),
        rentHistory: lateScenario.rentHistory,
        
        // Non-financial factors
        retirementImpact: retirementImpact,
        recommendation: netBenefit > 0 ? 'Early inheritance beneficial' : 'Consider keeping inheritance for later'
    };
}

// =============================================
// ENHANCED HOME EQUITY ANALYSIS FUNCTIONS
// =============================================

function analyzeHomeEquity(inputs) {
    console.log("Starting enhanced home equity analysis...");
    
    // ===== INPUT VALIDATION AND PROCESSING =====
    const method = inputs['he-method'] || 'heloc';
    const parentHomeValue = parseFloat(inputs['he-home-value']) || 750000;
    const currentMortgage = parseFloat(inputs['he-current-mortgage']) || 200000;
    const amountNeeded = parseFloat(inputs['he-amount-needed']) || 100000;
    const newRate = (parseFloat(inputs['he-new-rate']) || 5.5) / 100;
    const repayment = inputs['he-repayment'] || 'parents';
    const parentAge = parseFloat(inputs['he-parent-age']) || 58;
    const parentIncome = parseFloat(inputs['he-parent-income']) || 120000;
    const yearsToRetirement = parseFloat(inputs['he-retirement-timeline']) || 7;
    const childIncome = parseFloat(inputs['he-child-income']) || 
                       parseFloat(inputs['tt-child-income']) || 60000;
    
    // ===== SHARED PARAMETERS =====
    const analysisYears = 30;  // 30-year analysis period
    const homeAppreciation = 0.04;  // 4% annual appreciation
    const childMortgageRate = 0.045;  // 4.5% child mortgage rate
    const childMortgageTerm = 25;  // 25-year mortgage
    const downPaymentPercent = 0.20;  // 20% down payment
    const propertyTaxRate = 0.01;  // 1% annual property tax
    const insuranceRate = 0.0035;  // 0.35% annual insurance
    const maintenanceRate = 0.015;  // 1.5% annual maintenance
    
    if (!inputs || Object.keys(inputs).length === 0) {
        console.error("ERROR: No inputs provided to analyzeHomeEquity!");
        return {
            netBenefit: 0,
            risk: 5,
            timeToHome: 0,
            error: "No input data provided",
            successProbability: 0
        };
    }

    // ===== QUALIFICATION CHECK =====
    const reverseMortgageQualification = checkReverseMortgageQualification();

        // ===== CALCULATE BOTH SCENARIOS (ALWAYS) =====
        console.log("Calculating reverse mortgage scenario...");
        const reverseMortgageScenario = calculateReverseMortgageScenario(
            parentHomeValue, currentMortgage, amountNeeded, newRate, parentAge,
            childIncome, homeAppreciation, childMortgageRate, childMortgageTerm,
            downPaymentPercent, analysisYears, reverseMortgageQualification, 
            propertyTaxRate, insuranceRate, maintenanceRate
        );
        
        console.log("Calculating traditional loan scenario...");
        const traditionalLoanScenario = calculateTraditionalLoanScenario(
            parentHomeValue, currentMortgage, amountNeeded, newRate, repayment,
            parentAge, childIncome, homeAppreciation, childMortgageRate, 
            childMortgageTerm, downPaymentPercent, analysisYears, method, 
            propertyTaxRate, insuranceRate, maintenanceRate
        );
        
        // ===== COMPREHENSIVE COMPARISON =====
        console.log("Performing comprehensive comparison...");
        const comparison = compareScenarios(
            reverseMortgageScenario,
            traditionalLoanScenario,
            parentAge,
            yearsToRetirement,
            reverseMortgageQualification,
            method  // Pass method to know if reverse mortgage was selected
        );
        
        // ===== RISK ASSESSMENT =====
        console.log("Assessing risks...");
        const riskAssessment = calculateRiskAssessment(
            reverseMortgageScenario,
            traditionalLoanScenario,
            method,
            repayment,
            parentAge,
            yearsToRetirement,
            reverseMortgageQualification
        );
        
        // ===== FINAL RESULTS =====
        const finalResults = {
            childBeneiftValue: Math.round(reverseMortgageScenario.familyNetBenefit),
            // Summary metrics
            netBenefit: comparison.familyWealthDifference || 0,
            risk: riskAssessment.overallRisk || 3,
            timeToBenefit: comparison.timeToBenefit || 0,
            recommendedScenario: comparison.recommendedScenario || 'traditional',
            recommendationStrength: comparison.recommendationStrength || 'neutral',
            
            // Comparison metrics
            comparison: comparison,
            
            // Detailed scenarios
            reverseMortgage: {
                ...reverseMortgageScenario,
                qualification: reverseMortgageQualification
            },
            traditionalLoan: {
                ...traditionalLoanScenario,
                method: method,
                repaymentStructure: repayment
            },
            
            // Risk assessment
            risks: riskAssessment,
            
            // Inputs used
            inputs: {
                method: method,
                parentHomeValue: parentHomeValue,
                currentMortgage: currentMortgage,
                amountNeeded: amountNeeded,
                newRate: newRate,
                repayment: repayment,
                parentAge: parentAge,
                parentIncome: parentIncome,
                childIncome: childIncome,
                yearsToRetirement: yearsToRetirement
            },
            
            // Key takeaways
            keyTakeaways: generateKeyTakeaways(
                reverseMortgageScenario,
                traditionalLoanScenario,
                comparison,
                riskAssessment,
                method
            )
        };
        
        console.log("Home equity analysis complete:", finalResults);
        return finalResults;
    
}

// =============================================
// SCENARIO CALCULATION FUNCTIONS
// =============================================

function calculateReverseMortgageScenario(
    parentHomeValue, currentMortgage, amountNeeded, baseRate, parentAge,
    childIncome, appreciationRate, childMortgageRate, childMortgageTerm,
    downPaymentPercent, analysisYears, qualification, propertyTaxRate, insuranceRate, maintenanceRate
) {
    console.log("Calculating reverse mortgage scenario...");
    // If qualification indicates reverse mortgage wasn't selected, return baseline
    if (qualification.status === 'not_applicable') {
        console.log("Reverse mortgage not selected, returning baseline scenario");
        return getBaselineReverseMortgageScenario(
            parentHomeValue, currentMortgage, amountNeeded, baseRate, parentAge,
            childIncome, appreciationRate, childMortgageRate, childMortgageTerm,
            downPaymentPercent, analysisYears, propertyTaxRate, insuranceRate, maintenanceRate
        );
    }
    
    // ===== REVERSE MORTGAGE SPECIFIC PARAMETERS =====
    const reverseMortgageRate = baseRate + 0.015;  // Typically 1.5% higher than traditional
    const maxAge = 95;  // Maximum age for reverse mortgage analysis
    const yearsUntilMaxAge = Math.max(0, maxAge - parentAge);
    const effectiveAnalysisYears = Math.min(analysisYears, yearsUntilMaxAge);
    
    // ===== CHILD'S HOME PURCHASE =====
    const childHomePrice = amountNeeded / downPaymentPercent;
    const childMortgageAmount = childHomePrice - amountNeeded;
    
    // Child's mortgage calculations
    const monthlyChildRate = childMortgageRate / 12;
    const childMortgageMonths = childMortgageTerm * 12;
    const childMonthlyPayment = calculateMonthlyPayment(
        childMortgageAmount, monthlyChildRate, childMortgageMonths
    );


    // ===== REVERSE MORTGAGE DEBT ACCUMULATION =====
    let reverseMortgageBalance = amountNeeded;
    let reverseMortgageDebtHistory = [];
    let equityHistory = [];
    let totalInterestAccrued = 0;
    
    // Parent's starting equity
    const startingParentEquity = parentHomeValue - currentMortgage;
    
    for (let year = 1; year <= effectiveAnalysisYears; year++) {
        // Reverse mortgage debt grows (compound interest)
        const annualInterest = reverseMortgageBalance * reverseMortgageRate;
        totalInterestAccrued += annualInterest;
        reverseMortgageBalance *= (1 + reverseMortgageRate);
        
        // Parent's home appreciates
        const parentHomeAppreciated = parentHomeValue * Math.pow(1 + appreciationRate, year);
        const currentParentEquity = parentHomeAppreciated - currentMortgage;
        
        // Track history
        reverseMortgageDebtHistory.push({
            year: year,
            age: parentAge + year,
            debtBalance: reverseMortgageBalance,
            annualInterest: annualInterest,
            homeValue: parentHomeAppreciated,
            equity: currentParentEquity,
            loanToValue: (reverseMortgageBalance / parentHomeAppreciated) * 100
        });
        
        equityHistory.push(currentParentEquity);
    }
    
    // ===== CHILD'S HOME APPRECIATION =====
    const childHomeFutureValue = childHomePrice * Math.pow(1 + appreciationRate, analysisYears);
    
    // Calculate remaining mortgage after analysis years
    const yearsPaid = Math.min(analysisYears, childMortgageTerm);
    const childRemainingMortgage = calculateRemainingBalance(
        childMortgageAmount, monthlyChildRate, childMortgageMonths,
        childMonthlyPayment, yearsPaid * 12
    );
    
    // Child's equity in home
    const childEquity = childHomeFutureValue - childRemainingMortgage;
    
    // ===== TOTAL MORTGAGE PAYMENTS =====
    const totalChildPayments = childMonthlyPayment * 12 * yearsPaid;
    const totalChildInterest = totalChildPayments - (childMortgageAmount - childRemainingMortgage);
    
    // ===== PARENT'S FINAL SITUATION =====
    const finalParentHomeValue = parentHomeValue * Math.pow(1 + appreciationRate, effectiveAnalysisYears);
    const finalParentEquity = finalParentHomeValue - currentMortgage;
    const finalDebt = reverseMortgageBalance;
    const parentNetEquity = Math.max(0, finalParentEquity - finalDebt);
    
    // ===== CASH FLOW ANALYSIS =====
    const monthlyPropertyCosts = calculateMonthlyPropertyCosts(
        childHomePrice, propertyTaxRate, insuranceRate, maintenanceRate
    );
    const totalPropertyCosts = monthlyPropertyCosts * 12 * analysisYears;
    
    // ===== ALTERNATIVE SCENARIO (RENTING) =====
    const monthlyRent = childHomePrice * 0.005;  // 0.5% of home value per month
    const rentInflation = 0.03;
    let totalRentPaid = 0;
    let currentRent = monthlyRent * 12;
    
    for (let year = 1; year <= analysisYears; year++) {
        if (year > 1) currentRent *= (1 + rentInflation);
        totalRentPaid += currentRent;
    }
    
    // ===== NET BENEFIT CALCULATIONS =====
    // Child's perspective
    const childNetBenefit = childEquity - totalChildPayments - totalPropertyCosts;
    
    // Family perspective (child equity + parent equity - total costs)
    const familyNetBenefit = childEquity + parentNetEquity - totalChildPayments - totalPropertyCosts;
    
    // Opportunity cost (if money was invested instead)
    const investmentReturn = 0.06;
    const amountInvestedValue = amountNeeded * Math.pow(1 + investmentReturn, analysisYears);
    
    return {
        scenario: 'reverse_mortgage',
        
        // Financial metrics
        childNetBenefit: Math.round(childNetBenefit),
        familyNetBenefit: Math.round(familyNetBenefit),
        childEquity: Math.round(childEquity),
        parentNetEquity: Math.round(parentNetEquity),
        
        // Property values
        childHome: {
            purchasePrice: Math.round(childHomePrice),
            futureValue: Math.round(childHomeFutureValue),
            appreciation: Math.round(childHomeFutureValue - childHomePrice)
        },
        
        // Mortgage details
        childMortgage: {
            amount: Math.round(childMortgageAmount),
            monthlyPayment: Math.round(childMonthlyPayment),
            totalPayments: Math.round(totalChildPayments),
            totalInterest: Math.round(totalChildInterest),
            remainingBalance: Math.round(childRemainingMortgage)
        },
        
        // Reverse mortgage details
        reverseMortgage: {
            startingBalance: Math.round(amountNeeded),
            endingBalance: Math.round(finalDebt),
            totalInterestAccrued: Math.round(totalInterestAccrued),
            interestRate: (reverseMortgageRate * 100).toFixed(2) + '%',
            loanToValueEnd: (finalDebt / finalParentHomeValue * 100).toFixed(1) + '%'
        },
        
        // Parent's situation
        parentHome: {
            startingValue: Math.round(parentHomeValue),
            futureValue: Math.round(finalParentHomeValue),
            startingEquity: Math.round(startingParentEquity),
            futureEquity: Math.round(finalParentEquity),
            netEquityAfterDebt: Math.round(parentNetEquity)
        },
        
        // Costs and comparisons
        monthlyCosts: {
            mortgage: Math.round(childMonthlyPayment),
            propertyCosts: Math.round(monthlyPropertyCosts),
            totalMonthly: Math.round(childMonthlyPayment + monthlyPropertyCosts)
        },
        
        comparisonToRenting: {
            totalRentPaid: Math.round(totalRentPaid),
            netBenefitVsRenting: Math.round(childEquity - totalChildPayments - totalRentPaid),
            rentVsOwnCost: Math.round(totalRentPaid - totalChildPayments)
        },
        
        // Historical data for charts
        debtHistory: reverseMortgageDebtHistory,
        equityHistory: equityHistory,
        
        // Qualification status
        qualificationEligible: qualification.status === 'likely_qualified',
        qualificationNotes: qualification.notes || []
    };
}

function getBaselineReverseMortgageScenario(
    parentHomeValue, currentMortgage, amountNeeded, baseRate, parentAge,
    childIncome, appreciationRate, childMortgageRate, childMortgageTerm,
    downPaymentPercent, analysisYears, propertyTaxRate, insuranceRate, maintenanceRate
) {
    // Calculate what would happen if reverse mortgage WAS used (for comparison)
    // Even though user didn't select it, we still calculate for comparison purposes
    
    // ... same calculation logic as calculateReverseMortgageScenario but without qualification checks ...
    
    return {
        scenario: 'reverse_mortgage_baseline',
        childNetBenefit: 0,
        familyNetBenefit: 0,
        childEquity: 0,
        parentNetEquity: 0,
        childHome: {
            purchasePrice: 0,
            futureValue: 0,
            appreciation: 0
        },
        // ... other properties with default or calculated values ...
        qualificationEligible: false,
        qualificationNotes: ['Reverse mortgage not selected by user']
    };
}

function calculateTraditionalLoanScenario(
    parentHomeValue, currentMortgage, amountNeeded, loanRate, repayment,
    parentAge, childIncome, appreciationRate, childMortgageRate,
    childMortgageTerm, downPaymentPercent, analysisYears, method,  propertyTaxRate, insuranceRate, maintenanceRate
) {
    console.log("Calculating traditional loan scenario...");
    
    // ===== TRADITIONAL LOAN PARAMETERS =====
    let loanTerm = 25;  // Standard loan term
    let interestOnlyPeriod = (method === 'heloc') ? 10 : 0;
    
    // ===== CHILD'S HOME PURCHASE =====
    const childHomePrice = amountNeeded / downPaymentPercent;
    const childMortgageAmount = childHomePrice - amountNeeded;
    
    // Child's mortgage calculations
    const monthlyChildRate = childMortgageRate / 12;
    const childMortgageMonths = childMortgageTerm * 12;
    const childMonthlyPayment = calculateMonthlyPayment(
        childMortgageAmount, monthlyChildRate, childMortgageMonths
    );
    
    // ===== PARENT LOAN CALCULATIONS =====
    let monthlyParentPayment = 0;
    let totalParentInterest = 0;
    let parentLoanBalanceAtHorizon = 0;
    let parentPaymentHistory = [];
    
    const monthlyLoanRate = loanRate / 12;
    const loanMonths = loanTerm * 12;
    
    // Determine repayment type based on method and inputs
    let repaymentType = 'principal+interest'; // Default
    if (method === 'heloc') {
        // For HELOC, typically interest-only or variable
        repaymentType = 'interest-only';
    }
    
    // Calculate based on repayment type
    switch(repaymentType) {
        case 'interest-only':
            // Interest-only payments for entire term
            monthlyParentPayment = amountNeeded * monthlyLoanRate;
            
            // Calculate total interest paid over the analysis period
            const monthsToAnalyze = Math.min(analysisYears * 12, loanMonths);
            totalParentInterest = monthlyParentPayment * monthsToAnalyze;
            parentLoanBalanceAtHorizon = amountNeeded; // Still owe principal
            
            // Payment history
            for (let year = 1; year <= Math.ceil(monthsToAnalyze / 12); year++) {
                parentPaymentHistory.push({
                    year: year,
                    principal: 0,
                    interest: amountNeeded * loanRate,
                    remainingBalance: amountNeeded
                });
            }
            break;
            
        case 'principal+interest':
            // Fully amortized loan
            monthlyParentPayment = calculateMonthlyPayment(
                amountNeeded, monthlyLoanRate, loanMonths
            );
            
            // Calculate payments over analysis period
            const totalPaymentsMade = Math.min(analysisYears * 12, loanMonths);
            totalParentInterest = calculateTotalInterest(
                amountNeeded, monthlyLoanRate, monthlyParentPayment, totalPaymentsMade
            );
            
            // Calculate remaining balance at end of analysis period
            if (analysisYears < loanTerm) {
                parentLoanBalanceAtHorizon = calculateRemainingBalance(
                    amountNeeded, monthlyLoanRate, loanMonths,
                    monthlyParentPayment, totalPaymentsMade
                );
            } else {
                parentLoanBalanceAtHorizon = 0; // Fully paid off
            }
            
            // Amortization schedule for the analysis period
            let remainingBalance = amountNeeded;
            const maxMonths = Math.min(analysisYears * 12, loanMonths);
            
            for (let month = 1; month <= maxMonths; month++) {
                const interestPayment = remainingBalance * monthlyLoanRate;
                const principalPayment = monthlyParentPayment - interestPayment;
                remainingBalance -= principalPayment;
                
                if (month % 12 === 0) {
                    parentPaymentHistory.push({
                        year: month / 12,
                        principal: principalPayment * 12, // Annual principal
                        interest: interestPayment * 12,   // Annual interest
                        remainingBalance: Math.max(0, remainingBalance)
                    });
                }
            }
            break;
            
        case 'deferred':
            // No payments until end - interest compounds
            monthlyParentPayment = 0;
            
            // Calculate accumulated balance at the end of analysis period
            const compoundingPeriods = Math.min(analysisYears, loanTerm);
            parentLoanBalanceAtHorizon = amountNeeded * Math.pow(1 + loanRate, compoundingPeriods);
            totalParentInterest = parentLoanBalanceAtHorizon - amountNeeded;
            
            // No payment history for deferred payments
            parentPaymentHistory.push({
                year: analysisYears,
                principal: 0,
                interest: totalParentInterest,
                remainingBalance: parentLoanBalanceAtHorizon
            });
            break;
    }
    
    // ===== CHILD'S HOME APPRECIATION =====
    const childHomeFutureValue = childHomePrice * Math.pow(1 + appreciationRate, analysisYears);
    
    // Calculate remaining mortgage after analysis years
    const yearsPaid = Math.min(analysisYears, childMortgageTerm);
    const childRemainingMortgage = calculateRemainingBalance(
        childMortgageAmount, monthlyChildRate, childMortgageMonths,
        childMonthlyPayment, yearsPaid * 12
    );
    
    // ===== CALCULATE CHILD'S TOTAL ADDITIONAL PAYMENTS =====
    let childTotalAdditionalPayments = 0;
    let parentTotalPayments = 0;
    
    // Calculate based on repayment structure (who pays) and repayment type
    if (repayment === 'child') {
        // Child makes all parent loan payments
        switch(repaymentType) {
            case 'interest-only':
            case 'principal+interest':
                // Child makes monthly payments for the analysis period
                childTotalAdditionalPayments = monthlyParentPayment * 12 * Math.min(analysisYears, loanTerm);
                break;
            case 'deferred':
                // Child pays lump sum at end - captured in equity calculation
                childTotalAdditionalPayments = 0; // No monthly payments, lump sum at end
                break;
        }
    } else if (repayment === 'parents') {
        // Parents make all payments
        switch(repaymentType) {
            case 'interest-only':
            case 'principal+interest':
                parentTotalPayments = monthlyParentPayment * 12 * Math.min(analysisYears, loanTerm);
                break;
            case 'deferred':
                // Parents pay lump sum at end
                parentTotalPayments = parentLoanBalanceAtHorizon;
                break;
        }
    } else if (repayment === 'shared') {
        // Shared payments
        switch(repaymentType) {
            case 'interest-only':
            case 'principal+interest':
                childTotalAdditionalPayments = (monthlyParentPayment * 12 * Math.min(analysisYears, loanTerm)) / 2;
                parentTotalPayments = (monthlyParentPayment * 12 * Math.min(analysisYears, loanTerm)) / 2;
                break;
            case 'deferred':
                // Shared lump sum at end
                childTotalAdditionalPayments = parentLoanBalanceAtHorizon / 2;
                parentTotalPayments = parentLoanBalanceAtHorizon / 2;
                break;
        }
    }
    
    // ===== CALCULATE CHILD'S EQUITY =====
    let childEquity = childHomeFutureValue - childRemainingMortgage;
    
    // Subtract child's portion of parent loan if not fully paid
    if (repaymentType === 'deferred' && repayment !== 'parents') {
        // For deferred loans, subtract the portion the child owes from equity
        if (repayment === 'child') {
            childEquity -= parentLoanBalanceAtHorizon;
        } else if (repayment === 'shared') {
            childEquity -= (parentLoanBalanceAtHorizon / 2);
        }
    } else if (repaymentType === 'interest-only' && analysisYears >= loanTerm) {
        // If loan term ended and principal is still owed
        if (repayment === 'child') {
            childEquity -= amountNeeded; // Still owe principal
        } else if (repayment === 'shared') {
            childEquity -= (amountNeeded / 2);
        }
    }
    
    // ===== TOTAL COSTS =====
    const totalChildMortgagePayments = childMonthlyPayment * 12 * yearsPaid;
    const totalChildMortgageInterest = totalChildMortgagePayments - (childMortgageAmount - childRemainingMortgage);
    
    // Child's total payments = mortgage payments + parent loan payments
    const totalChildPayments = totalChildMortgagePayments + childTotalAdditionalPayments;
    
    // ===== PARENT'S FINANCIAL SITUATION =====
    const parentHomeFutureValue = parentHomeValue * Math.pow(1 + appreciationRate, analysisYears);
    const parentEquity = parentHomeFutureValue - currentMortgage;
    
    // Adjust parent equity by payments made
    let parentNetEquity = parentEquity;
    if (parentTotalPayments > 0) {
        parentNetEquity -= parentTotalPayments;
    }
    
    // ===== CASH FLOW ANALYSIS =====
    const monthlyPropertyCosts = calculateMonthlyPropertyCosts(
        childHomePrice, propertyTaxRate, insuranceRate, maintenanceRate
    );
    const totalPropertyCosts = monthlyPropertyCosts * 12 * analysisYears;
    
    // ===== ALTERNATIVE SCENARIO =====
    const monthlyRent = childHomePrice * 0.005;
    const rentInflation = 0.03;
    let totalRentPaid = 0;
    let currentRent = monthlyRent * 12;
    
    for (let year = 1; year <= analysisYears; year++) {
        if (year > 1) currentRent *= (1 + rentInflation);
        totalRentPaid += currentRent;
    }
    
    // ===== NET BENEFIT CALCULATIONS =====
    const childNetBenefit = childEquity - totalChildPayments - totalPropertyCosts;
    const familyNetBenefit = childEquity + parentNetEquity - totalChildPayments - totalPropertyCosts;
    
    // ===== DEBT SERVICE RATIOS =====
    // Calculate child's monthly burden
    let childMonthlyParentPayment = 0;
    if (repayment === 'child' || repayment === 'shared') {
        switch(repaymentType) {
            case 'interest-only':
            case 'principal+interest':
                childMonthlyParentPayment = repayment === 'child' ? 
                    monthlyParentPayment : monthlyParentPayment / 2;
                break;
            case 'deferred':
                // No monthly payments for deferred
                childMonthlyParentPayment = 0;
                break;
        }
    }
    
    const totalMonthlyForChild = childMonthlyPayment + monthlyPropertyCosts + childMonthlyParentPayment;
    const debtServiceRatio = (totalMonthlyForChild * 12) / childIncome;
    
    return {
        scenario: 'traditional_loan',
        
        // Financial metrics
        childNetBenefit: Math.round(childNetBenefit),
        familyNetBenefit: Math.round(familyNetBenefit),
        childEquity: Math.round(childEquity),
        parentNetEquity: Math.round(parentNetEquity),
        
        // Property values
        childHome: {
            purchasePrice: Math.round(childHomePrice),
            futureValue: Math.round(childHomeFutureValue),
            appreciation: Math.round(childHomeFutureValue - childHomePrice)
        },
        
        // Child mortgage details
        childMortgage: {
            amount: Math.round(childMortgageAmount),
            monthlyPayment: Math.round(childMonthlyPayment),
            totalPayments: Math.round(totalChildMortgagePayments),
            totalInterest: Math.round(totalChildMortgageInterest),
            remainingBalance: Math.round(childRemainingMortgage)
        },
        
        // Parent loan details
        parentLoan: {
            amount: Math.round(amountNeeded),
            interestRate: (loanRate * 100).toFixed(2) + '%',
            monthlyPayment: Math.round(monthlyParentPayment),
            totalInterest: Math.round(totalParentInterest),
            remainingBalance: Math.round(parentLoanBalanceAtHorizon),
            repaymentStructure: repayment,
            repaymentType: repaymentType,
            term: loanTerm
        },
        
        // Payment responsibility
        payments: {
            childTotalAdditional: Math.round(childTotalAdditionalPayments),
            parentTotal: Math.round(parentTotalPayments),
            childMonthlyAdditional: childMonthlyParentPayment > 0 ? 
                Math.round(childMonthlyParentPayment) : 0
        },
        
        // Parent's situation
        parentHome: {
            futureValue: Math.round(parentHomeFutureValue),
            equity: Math.round(parentEquity)
        },
        
        // Costs and affordability
        monthlyCosts: {
            mortgage: Math.round(childMonthlyPayment),
            propertyCosts: Math.round(monthlyPropertyCosts),
            parentLoan: Math.round(childMonthlyParentPayment),
            totalMonthly: Math.round(childMonthlyPayment + monthlyPropertyCosts + childMonthlyParentPayment)
        },
        
        affordability: {
            debtServiceRatio: (debtServiceRatio * 100).toFixed(1) + '%',
            mortgageToIncome: ((childMonthlyPayment * 12) / childIncome * 100).toFixed(1) + '%',
            totalHousingToIncome: (totalMonthlyForChild * 12 / childIncome * 100).toFixed(1) + '%'
        },
        
        comparisonToRenting: {
            totalRentPaid: Math.round(totalRentPaid),
            netBenefitVsRenting: Math.round(childEquity - totalChildPayments - totalRentPaid)
        },
        
        // Historical data
        paymentHistory: parentPaymentHistory,
        
        // Method details
        method: method,
        repaymentType: repaymentType
    };
}

// Add this helper function to calculate total interest
function calculateTotalInterest(principal, monthlyRate, monthlyPayment, totalPayments) {
    let remaining = principal;
    let totalInterest = 0;
    
    for (let i = 0; i < totalPayments; i++) {
        const interestPayment = remaining * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remaining -= principalPayment;
        totalInterest += interestPayment;
    }
    
    return totalInterest;
}

// =============================================
// COMPARISON AND ANALYSIS FUNCTIONS
// =============================================

function compareScenarios(reverseMortgage, traditionalLoan, parentAge, yearsToRetirement, qualification, method) {
    console.log("Comparing scenarios...");
    
    // ===== FINANCIAL COMPARISON =====
    const familyWealthDifference = traditionalLoan.familyNetBenefit - (reverseMortgage.familyNetBenefit);
    const childWealthDifference = traditionalLoan.childNetBenefit - (reverseMortgage.childNetBenefit);
    const parentWealthDifference = traditionalLoan.parentNetEquity - (reverseMortgage.parentNetEquity);

    // ===== RISK COMPARISON =====
    const riskComparison = {
        reverseMortgageRisks: [
            "Debt accumulation reduces inheritance",
            "Potential equity exhaustion",
            qualification.status !== 'likely_qualified' ? "Qualification uncertainty" : null
        ].filter(Boolean),
        
        traditionalLoanRisks: [
            "Monthly payment burden",
            "Interest rate risk",
            "Affordability concerns during retirement"
        ].filter(Boolean)
    };
    
    // ===== CASH FLOW COMPARISON =====
    const cashFlowComparison = {
        reverseMortgage: {
            monthlyOutflow: reverseMortgage.monthlyCosts.totalMonthly,
            noParentPayments: true
        },
        traditionalLoan: {
            monthlyOutflow: traditionalLoan.monthlyCosts.totalMonthly,
            parentPayments: traditionalLoan.payments.parentTotal > 0
        }
    };
    
    // ===== TIME HORIZON CONSIDERATIONS =====
    let recommendedScenario = 'traditional';
    let recommendationStrength = 'neutral';
    let recommendationReasons = [];
    let timeToBenefit = 0;
    
     // If user didn't select reverse mortgage, recommend traditional loan
    if (method !== 'reverse') {
        recommendationReasons.push("Traditional loan selected by user");
        recommendationStrength = 'user_choice';
    } else {
        // User selected reverse mortgage, check qualification
        if (qualification.status !== 'likely_qualified') {
            recommendedScenario = 'traditional';
            recommendationStrength = 'required';
            recommendationReasons.push("Reverse mortgage qualification uncertain");
        } else if (familyWealthDifference > 0) {
            // Traditional loan is better financially
            recommendedScenario = 'traditional';
            recommendationReasons.push("Higher total family wealth accumulation");
            recommendationStrength = familyWealthDifference > 100000 ? 'strong' : 'moderate';
        } else {
            // Reverse mortgage is better financially
            recommendedScenario = 'reverse';
            recommendationReasons.push("Better preservation of parent equity");
            recommendationStrength = familyWealthDifference < -50000 ? 'strong' : 'moderate';
        }
    }
    
    // Consider retirement timing for benefit timeline
    if (parentAge + 10 > 80) {
        timeToBenefit = 10;
        if (recommendedScenario === 'reverse') {
            recommendationReasons.push("Reverse mortgage provides better liquidity in later years");
        }
    }
    
    return {
        
        // Financial comparison
        familyWealthDifference: Math.round(familyWealthDifference),
        childWealthDifference: Math.round(childWealthDifference),
        parentWealthDifference: Math.round(parentWealthDifference),
        
        // Scenario metrics
        reverseMortgageFamilyWealth: reverseMortgage.familyNetBenefit || 0,
        traditionalLoanFamilyWealth: traditionalLoan.familyNetBenefit,
        
        // Recommendation
        recommendedScenario: recommendedScenario,
        recommendationStrength: recommendationStrength,
        recommendationReasons: recommendationReasons,
        
        // Time considerations
        timeToBenefit: timeToBenefit,
        
        // Risk comparison
        risks: riskComparison,
        
        // Cash flow comparison
        cashFlow: cashFlowComparison,
        
        // Method context
        methodSelected: method,

        // Key differentiators
        keyDifferentiators: {
            reverseMortgageAdvantages: [
                "No monthly payments required from parents",
                "Debt doesn't need to be repaid until home is sold",
                "Protects retirement income"
            ],
            traditionalLoanAdvantages: [
                "Clear repayment schedule",
                "Builds equity through payments",
                "More flexible terms"
            ]
        }
    };
}

function calculateRiskAssessment(reverseMortgage, traditionalLoan, method, repayment, parentAge, yearsToRetirement, qualification) {
    console.log("Calculating risk assessment...");
    
    let overallRisk = 3;  // Medium base risk
    let riskFactors = [];
    let mitigationStrategies = [];
    
    // ===== REVERSE MORTGAGE RISKS =====
    if (method === 'reverse') {
        overallRisk = 4;  // Higher base risk for reverse mortgage
        
        // Check equity exhaustion
        const finalLTV = parseFloat(reverseMortgage.reverseMortgage.loanToValueEnd);
        if (finalLTV > 60) {
            overallRisk += 1;
            riskFactors.push(`High loan-to-value ratio at end: ${finalLTV}%`);
            mitigationStrategies.push("Consider smaller loan amount or shorter term");
        }
        
        if (finalLTV > 80) {
            overallRisk = 5;  // Maximum risk
            riskFactors.push("Risk of equity exhaustion");
            mitigationStrategies.push("Strongly consider traditional loan instead");
        }
        
        // Age considerations
        if (parentAge < 62) {
            riskFactors.push("Below typical reverse mortgage age minimum");
            mitigationStrategies.push("Wait until age 62 or consider traditional loan");
        }
        
        if (parentAge > 75) {
            riskFactors.push("Advanced age increases compounding risk");
            mitigationStrategies.push("Consider shorter-term or smaller reverse mortgage");
        }
        
        // Qualification risk
        if (qualification.status !== 'likely_qualified') {
            overallRisk += 1;
            riskFactors.push("Qualification uncertain");
            mitigationStrategies.push("Consult with reverse mortgage specialist");
        }
    }
    
    // ===== TRADITIONAL LOAN RISKS =====
    if (method !== 'reverse') {
        // Debt service ratio risk
        const dsi = parseFloat(traditionalLoan.affordability.debtServiceRatio);
        if (dsi > 40) {
            overallRisk += 1;
            riskFactors.push(`High debt service ratio: ${dsi}%`);
            mitigationStrategies.push("Consider reducing loan amount or extending term");
        }
        
        if (dsi > 50) {
            overallRisk = 5;
            riskFactors.push("Very high debt burden");
            mitigationStrategies.push("Re-evaluate affordability or consider smaller purchase");
        }
        
        // Retirement risk
        if (yearsToRetirement < 5 && repayment === 'parents') {
            overallRisk += 1;
            riskFactors.push("Loan payments extend into retirement");
            mitigationStrategies.push("Consider child-responsible repayment or reverse mortgage");
        }
        
        // Interest rate risk
        if (traditionalLoan.parentLoan.interestRate > '7%') {
            riskFactors.push("High interest rate increases cost");
            mitigationStrategies.push("Shop for better rates or consider fixed-rate option");
        }
    }
    
    // ===== SHARED RISKS =====
    const appreciationAssumption = 0.04;  // 4% assumed
    if (appreciationAssumption > 0.05) {
        riskFactors.push("Optimistic home appreciation assumption");
        mitigationStrategies.push("Consider conservative 3% appreciation scenario");
    }
    
    // Cap overall risk at 1-5 scale
    overallRisk = Math.min(5, Math.max(1, overallRisk));
    
    // Determine risk level text
    let riskLevel = '';
    if (overallRisk <= 2) riskLevel = 'Low';
    else if (overallRisk <= 3) riskLevel = 'Moderate';
    else if (overallRisk <= 4) riskLevel = 'High';
    else riskLevel = 'Very High';
    
    return {
        overallRisk: overallRisk,
        riskLevel: riskLevel,
        riskFactors: riskFactors,
        mitigationStrategies: mitigationStrategies,
        
        // Specific risk metrics
        metrics: {
            reverseMortgageLTV: method === 'reverse' ? 
                reverseMortgage.reverseMortgage.loanToValueEnd : 'N/A',
            traditionalDSI: method !== 'reverse' ? 
                traditionalLoan.affordability.debtServiceRatio : 'N/A',
            retirementImpact: yearsToRetirement < 10 ? 'High' : 'Low'
        }
    };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function calculateMonthlyPayment(principal, monthlyRate, months) {
    if (monthlyRate === 0) return principal / months;
    
    const factor = Math.pow(1 + monthlyRate, months);
    return principal * monthlyRate * factor / (factor - 1);
}

function calculateRemainingBalance(principal, monthlyRate, totalMonths, monthlyPayment, paymentsMade) {
    if (monthlyRate === 0) {
        return Math.max(0, principal - (monthlyPayment * paymentsMade));
    }
    
    const futureValueFactor = Math.pow(1 + monthlyRate, totalMonths);
    const paymentFactor = (Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate;
    
    const remaining = principal * futureValueFactor - 
                     monthlyPayment * paymentFactor * Math.pow(1 + monthlyRate, paymentsMade);
    
    return Math.max(0, remaining);
}

function calculateMonthlyPropertyCosts(homeValue, taxRate, insuranceRate, maintenanceRate) {
    const annualTax = homeValue * taxRate;
    const annualInsurance = homeValue * insuranceRate;
    const annualMaintenance = homeValue * maintenanceRate;
    
    return (annualTax + annualInsurance + annualMaintenance) / 12;
}

function checkReverseMortgageQualification() {
    const savedRMQ = localStorage.getItem('reverseMortgageQuestionnaire');
    console.log("checked reverse mortgag qualification: " + savedRMQ)
    if (!savedRMQ) {
        return {
            status: 'not_assessed',
            notes: ['Reverse mortgage questionnaire not completed'],
            eligible: false
        };
    }
    
    try {
        const rmqData = JSON.parse(savedRMQ);
        return {
            status: rmqData.qualificationStatus || 'not_assessed',
            details: rmqData.details || {},
            notes: generateQualificationNotes(rmqData),
            eligible: rmqData.qualificationStatus === 'likely_qualified'
        };
    } catch (e) {
        return {
            status: 'error',
            notes: ['Error assessing qualification'],
            eligible: false
        };
    }
}

function generateQualificationNotes(rmqData) {
    const notes = [];
    
    if (rmqData.qualificationStatus === 'likely_qualified') {
        notes.push("✅ Likely qualifies for reverse mortgage");
    } else if (rmqData.qualificationStatus === 'insufficient_equity') {
        notes.push("⚠️ May not qualify: Insufficient home equity");
    } else if (rmqData.qualificationStatus === 'property_type_ineligible') {
        notes.push("⚠️ May not qualify: Property type may be ineligible");
    } else if (rmqData.qualificationStatus === 'further_review_needed') {
        notes.push("⚠️ Further review needed with specialist");
    }
    
    if (rmqData.details) {
        if (rmqData.details.age && rmqData.details.age < 55) {
            notes.push("Note: Below typical reverse mortgage age minimum (55+)");
        }
        if (rmqData.details.equityPercentage && rmqData.details.equityPercentage < 20) {
            notes.push("Note: Low equity may limit borrowing capacity");
        }
    }
    
    return notes;
}

function generateKeyTakeaways(reverseMortgage, traditionalLoan, comparison, riskAssessment) {
    const takeaways = [];
    
    // Financial takeaways
    if (comparison.familyWealthDifference > 0) {
        takeaways.push(`Traditional loan creates $${Math.abs(comparison.familyWealthDifference).toLocaleString()} more family wealth`);
    } else {
        takeaways.push(`Reverse mortgage preserves $${Math.abs(comparison.familyWealthDifference).toLocaleString()} more parent equity`);
    }
    
    // Cash flow takeaways
    if (reverseMortgage.monthlyCosts.totalMonthly < traditionalLoan.monthlyCosts.totalMonthly * 0.8) {
        takeaways.push("Reverse mortgage provides significantly better monthly cash flow");
    }
    
    // Risk takeaways
    if (riskAssessment.overallRisk >= 4) {
        takeaways.push(`High risk scenario (${riskAssessment.riskLevel} risk) - consider mitigation strategies`);
    }
    
    // Qualification takeaways
    if (!reverseMortgage.qualificationEligible && comparison.recommendedScenario === 'reverse') {
        takeaways.push("Reverse mortgage qualification uncertain - specialist consultation recommended");
    }
    
    // Retirement timing
    if (reverseMortgage.parentHome && reverseMortgage.parentHome.netEquityAfterDebt < 100000) {
        takeaways.push("Limited remaining equity after reverse mortgage - consider inheritance implications");
    }
    
    return takeaways;
}

// =============================================
// DISPLAY FUNCTIONS FOR COMPARISON PAGE
// =============================================

function displayHomeEquityComparison(results) {
    // This function would be called from the comparison page
    const container = document.getElementById('home-equity-comparison-container');
    if (!container) return;
    
    container.innerHTML = generateHomeEquityComparisonHTML(results);
}

function generateHomeEquityComparisonHTML(results) {
    // If reverse mortgage scenario doesn't exist (user didn't select reverse), create a dummy one
    if (!results.reverseMortgage) {
        results.reverseMortgage = {
            scenario: 'reverse_mortgage',
            childNetBenefit: 0,
            familyNetBenefit: 0,
            qualificationEligible: false,
            qualificationNotes: ['Not selected by user']
        };
    }

    const comparison = results.comparison;
    const reverse = results.reverseMortgage;
    const traditional = results.traditionalLoan;
    const risks = results.risks;
    
    return `
        <div class="-comparison">
            <!-- Summary Header -->
            <div class="comparison-summary" style="
                background: ${comparison.recommendedScenario === 'traditional' ? '#e8f7e8' : '#e8f4fc'};
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 5px solid ${comparison.recommendedScenario === 'traditional' ? '#2ecc71' : '#3498db'};
            ">
                <h3>🏆 Recommended Strategy: ${comparison.recommendedScenario === 'traditional' ? 'Traditional Loan' : 'Reverse Mortgage'}</h3>
                <p><strong>${comparison.recommendationStrength.toUpperCase()} RECOMMENDATION</strong></p>
                <ul>
                    ${comparison.recommendationReasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
                <div class="wealth-comparison" style="
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-top: 20px;
                ">
                    <div class="wealth-item">
                        <div class="wealth-label">Family Wealth Difference</div>
                        <div class="wealth-value" style="
                            font-size: 1.5rem;
                            font-weight: bold;
                            color: ${comparison.familyWealthDifference > 0 ? '#27ae60' : '#e74c3c'};
                        ">
                            $${Math.abs(comparison.familyWealthDifference).toLocaleString()}
                            ${comparison.familyWealthDifference > 0 ? 'more with Traditional' : 'more with Reverse'}
                        </div>
                    </div>
                    <div class="wealth-item">
                        <div class="wealth-label">Risk Level</div>
                        <div class="wealth-value" style="
                            font-size: 1.5rem;
                            font-weight: bold;
                            color: ${risks.overallRisk <= 2 ? '#27ae60' : risks.overallRisk <= 3 ? '#f39c12' : '#e74c3c'};
                        ">
                            ${risks.riskLevel}
                        </div>
                    </div>
                    <div class="wealth-item">
                        <div class="wealth-label">Monthly Cash Flow</div>
                        <div class="wealth-value" style="font-size: 1.5rem; font-weight: bold;">
                            $${Math.min(reverse.monthlyCosts.totalMonthly, traditional.monthlyCosts.totalMonthly).toLocaleString()}/mo
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Detailed Scenario Comparison -->
            <div class="scenario-comparison-grid" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            ">
                <!-- Reverse Mortgage Scenario -->
                <div class="scenario-card" style="
                    border: 2px solid ${comparison.recommendedScenario === 'reverse' ? '#3498db' : '#ddd'};
                    padding: 20px;
                    border-radius: 8px;
                    background: ${comparison.recommendedScenario === 'reverse' ? '#f8fbff' : '#fff'};
                ">
                    <h4>🏠 Reverse Mortgage Scenario</h4>
                    
                    <div class="scenario-metrics" style="margin: 15px 0;">
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Family Net Benefit:</span>
                            <strong>$${reverse.familyNetBenefit.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Child Equity:</span>
                            <strong>$${reverse.childEquity.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Parent Net Equity:</span>
                            <strong>$${reverse.parentNetEquity.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Monthly Payment:</span>
                            <strong>$${reverse.monthlyCosts.totalMonthly.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Final LTV:</span>
                            <strong>${reverse.reverseMortgage.loanToValueEnd}</strong>
                        </div>
                    </div>
                    
                    <div class="scenario-advantages" style="margin-top: 15px;">
                        <h5>Advantages:</h5>
                        <ul style="color: #27ae60;">
                            <li>No monthly payments from parents</li>
                            <li>Protects retirement income</li>
                            <li>Debt repayment deferred</li>
                        </ul>
                    </div>
                    
                    <div class="scenario-risks" style="margin-top: 15px;">
                        <h5>Risks:</h5>
                        <ul style="color: #e74c3c;">
                            ${risks.riskFactors.filter(f => f.toLowerCase().includes('reverse') || f.toLowerCase().includes('equity')).map(risk => `<li>${risk}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <!-- Traditional Loan Scenario -->
                <div class="scenario-card" style="
                    border: 2px solid ${comparison.recommendedScenario === 'traditional' ? '#2ecc71' : '#ddd'};
                    padding: 20px;
                    border-radius: 8px;
                    background: ${comparison.recommendedScenario === 'traditional' ? '#f8fff8' : '#fff'};
                ">
                    <h4>💰 Traditional Loan Scenario</h4>
                    
                    <div class="scenario-metrics" style="margin: 15px 0;">
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Family Net Benefit:</span>
                            <strong>$${traditional.familyNetBenefit.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Child Equity:</span>
                            <strong>$${traditional.childEquity.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Parent Net Equity:</span>
                            <strong>$${traditional.parentNetEquity.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Monthly Payment:</span>
                            <strong>$${traditional.monthlyCosts.totalMonthly.toLocaleString()}</strong>
                        </div>
                        <div class="metric-row" style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Debt Service Ratio:</span>
                            <strong>${traditional.affordability.debtServiceRatio}</strong>
                        </div>
                    </div>
                    
                    <div class="scenario-advantages" style="margin-top: 15px;">
                        <h5>Advantages:</h5>
                        <ul style="color: #27ae60;">
                            <li>Clear repayment schedule</li>
                            <li>Builds equity through payments</li>
                            <li>More flexible terms available</li>
                        </ul>
                    </div>
                    
                    <div class="scenario-risks" style="margin-top: 15px;">
                        <h5>Risks:</h5>
                        <ul style="color: #e74c3c;">
                            ${risks.riskFactors.filter(f => f.toLowerCase().includes('debt') || f.toLowerCase().includes('affordability')).map(risk => `<li>${risk}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Detailed Calculation Breakdown -->
            <div class="calculation-breakdown" style="
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            ">
                <h4>📊 Detailed Calculation Breakdown</h4>
                
                <div class="breakdown-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Assumptions -->
                    <div class="breakdown-section">
                        <h5>Key Assumptions:</h5>
                        <ul>
                            <li>30-year analysis period</li>
                            <li>4% annual home appreciation</li>
                            <li>4.5% child mortgage rate</li>
                            <li>${(reverse.reverseMortgage.interestRate || traditional.parentLoan.interestRate)} parent loan rate</li>
                            <li>20% down payment required</li>
                        </ul>
                    </div>
                    
                    <!-- Wealth Projection -->
                    <div class="breakdown-section">
                        <h5>30-Year Wealth Projection:</h5>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <th style="text-align: left; padding: 5px;">Metric</th>
                                <th style="text-align: right; padding: 5px;">Reverse</th>
                                <th style="text-align: right; padding: 5px;">Traditional</th>
                            </tr>
                            <tr>
                                <td style="padding: 5px;">Child Home Value</td>
                                <td style="text-align: right; padding: 5px;">$${reverse.childHome.futureValue.toLocaleString()}</td>
                                <td style="text-align: right; padding: 5px;">$${traditional.childHome.futureValue.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px;">Child Equity</td>
                                <td style="text-align: right; padding: 5px;">$${reverse.childEquity.toLocaleString()}</td>
                                <td style="text-align: right; padding: 5px;">$${traditional.childEquity.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px;">Parent Equity</td>
                                <td style="text-align: right; padding: 5px;">$${reverse.parentNetEquity.toLocaleString()}</td>
                                <td style="text-align: right; padding: 5px;">$${traditional.parentNetEquity.toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <!-- Cost Comparison -->
                <div class="cost-comparison" style="margin-top: 20px;">
                    <h5>Total Cost Comparison:</h5>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th style="text-align: left; padding: 5px;">Cost Category</th>
                            <th style="text-align: right; padding: 5px;">Reverse Mortgage</th>
                            <th style="text-align: right; padding: 5px;">Traditional Loan</th>
                            <th style="text-align: right; padding: 5px;">Difference</th>
                        </tr>
                        <tr>
                            <td style="padding: 5px;">Total Mortgage Payments</td>
                            <td style="text-align: right; padding: 5px;">$${reverse.childMortgage.totalPayments.toLocaleString()}</td>
                            <td style="text-align: right; padding: 5px;">$${traditional.childMortgage.totalPayments.toLocaleString()}</td>
                            <td style="text-align: right; padding: 5px; color: ${traditional.childMortgage.totalPayments - reverse.childMortgage.totalPayments > 0 ? '#e74c3c' : '#27ae60'}">
                                $${(traditional.childMortgage.totalPayments - reverse.childMortgage.totalPayments).toLocaleString()}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px;">Total Interest</td>
                            <td style="text-align: right; padding: 5px;">$${reverse.reverseMortgage.totalInterestAccrued.toLocaleString()}</td>
                            <td style="text-align: right; padding: 5px;">$${traditional.parentLoan.totalInterest.toLocaleString()}</td>
                            <td style="text-align: right; padding: 5px; color: ${traditional.parentLoan.totalInterest - reverse.reverseMortgage.totalInterestAccrued > 0 ? '#e74c3c' : '#27ae60'}">
                                $${(traditional.parentLoan.totalInterest - reverse.reverseMortgage.totalInterestAccrued).toLocaleString()}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <!-- Risk Mitigation & Next Steps -->
            <div class="risk-mitigation" style="
                background: #fff8e1;
                padding: 20px;
                border-radius: 8px;
            ">
                <h4>⚠️ Risk Mitigation Strategies</h4>
                
                <div class="mitigation-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h5>Identified Risks:</h5>
                        <ul style="color: #e74c3c;">
                            ${risks.riskFactors.map(risk => `<li>${risk}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div>
                        <h5>Recommended Mitigations:</h5>
                        <ul style="color: #27ae60;">
                            ${risks.mitigationStrategies.map(strategy => `<li>${strategy}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="next-steps" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <h5>Next Steps:</h5>
                    <ol>
                        <li>Consult with a mortgage specialist to confirm qualification</li>
                        <li>Review the detailed amortization schedule</li>
                        <li>Consider a hybrid approach if available</li>
                        <li>Re-evaluate in 5 years based on changing circumstances</li>
                    </ol>
                </div>
            </div>
            
            <!-- Key Takeaways -->
            <div class="key-takeaways" style="
                margin-top: 30px;
                padding: 20px;
                background: #e8f4fc;
                border-radius: 8px;
            ">
                <h4>🎯 Key Takeaways</h4>
                <ul>
                    ${results.keyTakeaways.map(takeaway => `<li>${takeaway}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function useDefault(inputId, defaultValue) {
    const input = document.getElementById(inputId);
    const feedback = document.getElementById(inputId + '-feedback');
    
    if (!input) return;
    
    input.value = defaultValue;
    input.style.backgroundColor = '#f0f8ff';
    
    if (feedback) {
        feedback.textContent = `Using default: ${defaultValue}${inputId.includes('rate') || inputId.includes('return') ? '%' : ''}`;
        feedback.style.display = 'block';
    }
    
    // Re-enable on click
    input.addEventListener('click', function enableInput() {
        this.disabled = false;
        this.style.backgroundColor = '';
        if (feedback) feedback.style.display = 'none';
        this.removeEventListener('click', enableInput);
    });
}

function useDefaultSelect(selectId, defaultValue) {
    const select = document.getElementById(selectId);
    const feedback = document.getElementById(selectId + '-feedback');
    
    if (!select) return;
    
    select.value = defaultValue;
    select.style.backgroundColor = '#f0f8ff';
    
    if (feedback) {
        const selectedOption = select.options[select.selectedIndex].text;
        feedback.textContent = `Using default: ${selectedOption}`;
        feedback.style.display = 'block';
    }
    
    // Re-enable on change
    select.addEventListener('mousedown', function enableSelect() {
        this.disabled = false;
        this.style.backgroundColor = '';
        if (feedback) feedback.style.display = 'none';
        this.removeEventListener('mousedown', enableSelect);
    });
}

function showPage(pageId, show = true) {
    const page = document.getElementById(pageId);
    if (page) {
        if (show) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    }
}

// ============================================
// COMPARISON PAGE FUNCTIONS
// ============================================

function updatePrintButtonState() {
    const printBtn = document.getElementById('print-btn');
    if (!printBtn) return;
    
    const savedPA = localStorage.getItem('postAnalysisData');
    if (savedPA) {
        try {
            const paData = JSON.parse(savedPA);
            if (paData.completed) {
                printBtn.disabled = false;
                printBtn.textContent = '📄 Print Final Report';
                printBtn.style.backgroundColor = '#2ecc71';
                printBtn.style.cursor = 'pointer';
            } else {
                printBtn.disabled = true;
                printBtn.textContent = '📄 Print Final Report (Complete Full Check First)';
                printBtn.style.backgroundColor = '#95a5a6';
                printBtn.style.cursor = 'not-allowed';
            }
        } catch (e) {
            console.error('Error checking post-analysis status:', e);
            printBtn.disabled = true;
        }
    } else {
        printBtn.disabled = true;
        printBtn.textContent = '📄 Print Final Report (Complete Full Check First)';
        printBtn.style.backgroundColor = '#95a5a6';
        printBtn.style.cursor = 'not-allowed';
    }
}

function updateComparisonWithReverseMortgageStatus() {
    console.log('Updating comparison with reverse mortgage status...');
    
    // Check if home equity is in the models
    const models = feasibleModels.length > 0 ? feasibleModels : JSON.parse(localStorage.getItem('selectedModels') || '[]');
    if (!models.includes('home-equity')) {
        console.log('Home equity model not in comparison');
        return;
    }
    
    // Check if reverse mortgage was used
    const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
    const heInputs = modelInputs['home-equity'] || {};
    const method = heInputs['he-method'];
    
    if (method !== 'reverse') {
        console.log('Reverse mortgage not used in home equity model');
        return;
    }
    
    // Get qualification data
    const savedRMQ = localStorage.getItem('reverseMortgageQuestionnaire');
    if (!savedRMQ) {
        console.log('No reverse mortgage questionnaire data found');
        return;
    }
    
    try {
        const rmqData = JSON.parse(savedRMQ);
        if (!rmqData.completed) {
            console.log('Reverse mortgage questionnaire not completed');
            return;
        }
        
        console.log('Adding reverse mortgage status to comparison page');
        
        // Create status indicator
        const container = document.querySelector('.comparison-container');
        if (!container) return;
        
        // Remove existing indicator if any
        const existingIndicator = document.querySelector('.reverse-mortgage-status-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'reverse-mortgage-status-indicator';
        indicator.style.cssText = `
            background: #e8f4fc;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        `;
        
        let statusHTML = '';
        if (rmqData.qualificationStatus === 'likely_qualified') {
            indicator.style.background = '#d4edda';
            indicator.style.borderLeftColor = '#28a745';
            statusHTML = `
                <strong style="color: #155724;">✅ Reverse Mortgage Qualification</strong>
                <p style="margin: 5px 0; color: #155724;">Based on your assessment, you appear to meet the basic requirements for a reverse mortgage.</p>
            `;
        } else {
            indicator.style.background = '#fff3cd';
            indicator.style.borderLeftColor = '#ffc107';
            statusHTML = `
                <strong style="color: #856404;">⚠️ Reverse Mortgage Qualification Note</strong>
                <p style="margin: 5px 0; color: #856404;">${getQualificationMessage(rmqData.qualificationStatus)}</p>
            `;
        }
        
        indicator.innerHTML = `
            <div style="font-size: 0.9rem;">
                ${statusHTML}
                <div style="margin-top: 10px; font-size: 0.8rem; color: #666;">
                    <strong>Assessment Details:</strong><br>
                    • Age: ${rmqData.details?.age || 'N/A'} years<br>
                    • Home Equity: $${rmqData.details?.equity?.toLocaleString() || '0'} (${rmqData.details?.equityPercentage?.toFixed(1) || '0'}%)<br>
                    • Property Type: ${rmqData.details?.propertyType || 'N/A'}
                </div>
            </div>
        `;
        
        // Insert after the comparison table or charts
        const comparisonTable = document.querySelector('.comparison-table');
        if (comparisonTable) {
            comparisonTable.parentNode.insertBefore(indicator, comparisonTable.nextSibling);
        } else {
            container.insertBefore(indicator, container.firstChild);
        }
        
    } catch (e) {
        console.error('Error adding reverse mortgage status:', e);
    }
}

function getQualificationMessage(status) {
    switch(status) {
        case 'insufficient_equity':
            return 'Your home equity is below the typical minimum requirement of 20% for a reverse mortgage.';
        case 'property_type_ineligible':
            return 'Reverse mortgages are typically only available for primary residences.';
        case 'further_review_needed':
            return 'Additional review with a mortgage specialist is recommended.';
        default:
            return 'Qualification assessment completed.';
    }
}

// ============================================
// MATCHMAKER QUESTIONNAIRE FUNCTIONS
// ============================================

let currentStep = 1;
let questionnaireData = {
    clientType: '',
    answers: {},
    strategyRatings: {},  //strategyRatings: {},
    modelScores: {}
};

function nextStep(stepNumber) {
    console.log(`Moving to step ${stepNumber} from step ${currentStep}`);
    
    // Save current step progress
    saveQuestionnaireProgress();
    
    // Validate current step before moving
    if (!validateCurrentStep(currentStep)) {
        alert('Please complete all required questions in this section.');
        console.log(`Step ${currentStep} validation failed, cannot proceed`);
        return;
    }
    
    // Hide current step with fade out
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    if (currentStepElement) {
        currentStepElement.style.opacity = '0';
        currentStepElement.style.transition = 'opacity 0.3s';
        
        setTimeout(() => {
            currentStepElement.classList.remove('active');
            currentStepElement.style.opacity = '1';
            
            // Show next step
            const nextStepElement = document.getElementById(`step-${stepNumber}`);
            if (nextStepElement) {
                nextStepElement.classList.add('active');
                
                // Scroll to the top of the next step
                scrollToStep(stepNumber);
            }
        }, 300);
    }
    
    // Update progress bar
    updateProgressBar(stepNumber);
    
    // Update step indicators
    updateStepIndicators(stepNumber);
    
    // Update current step
    currentStep = stepNumber;
    
    // Update continue button state for the new step
    setTimeout(() => {
        updateContinueButtonState();
    }, 100);
}

// Enhanced prevStep function with auto-scroll
function prevStep(stepNumber) {
    console.log(`Going back to step ${stepNumber} from step ${currentStep}`);
    
    // Hide current step
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    if (currentStepElement) {
        currentStepElement.style.opacity = '0';
        currentStepElement.style.transition = 'opacity 0.3s';
        
        setTimeout(() => {
            currentStepElement.classList.remove('active');
            currentStepElement.style.opacity = '1';
            
            // Show previous step
            const prevStepElement = document.getElementById(`step-${stepNumber}`);
            if (prevStepElement) {
                prevStepElement.classList.add('active');
                
                // Scroll to the top of the previous step
                scrollToStep(stepNumber);
            }
        }, 300);
    }
    
    // Update progress bar
    updateProgressBar(stepNumber);
    
    // Update step indicators
    updateStepIndicators(stepNumber);
    
    // Update current step
    currentStep = stepNumber;
}

// Function to scroll to step
function scrollToStep(stepNumber) {
    // Get the step element
    const stepElement = document.getElementById(`step-${stepNumber}`);
    if (!stepElement) return;
    
    // Calculate offset for header (fixed header height)
    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
    
    // Smooth scroll to step
    window.scrollTo({
        top: stepElement.offsetTop - headerHeight - 20,
        behavior: 'smooth'
    });
    
    // Focus on first input element for accessibility
    setTimeout(() => {
        const firstInput = stepElement.querySelector('input, select, button');
        if (firstInput && stepNumber !== 1) { // Don't auto-focus step 1
            firstInput.focus();
        }
    }, 500);
}

// Add CSS for smooth transitions
const style = document.createElement('style');
style.textContent = `
    .questionnaire-step {
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
    }
    
    .questionnaire-step:not(.active) {
        display: none;
        opacity: 0;
    }
    
    .questionnaire-step.active {
        display: block;
        opacity: 1;
        animation: fadeIn 0.5s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .step-actions {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #eee;
        text-align: center;
    }
    
    .step-actions button {
        min-width: 200px;
        font-size: 1.1rem;
        padding: 1rem 2rem;
    }
`;
document.head.appendChild(style);

// Update Progress Bar
function updateProgressBar(step) {
    const progressPercentage = (step / 5) * 100;
    const progressFill = document.getElementById('matchmaker-progress');
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
}

// Update Step Indicators
function updateStepIndicators(activeStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === activeStep) {
            step.classList.add('active');
        }
    });
}

// Add this function to initialize select event listeners
function initializeSelectEventListeners() {
    console.log('Initializing select event listeners...');
    
    // Step 2 select elements
    const step2Selects = document.querySelectorAll('#step-2 select');
    step2Selects.forEach(select => {
        select.addEventListener('change', function() {
            handleSelectChange(this);
        });
        
        // Restore saved value if it exists
        if (questionnaireData.answers[select.id]) {
            select.value = questionnaireData.answers[select.id];
            console.log(`Restored ${select.id}: ${select.value}`);
        }
    });
    
    // Step 3 select elements
    const step3Selects = document.querySelectorAll('#step-3 select');
    step3Selects.forEach(select => {
        select.addEventListener('change', function() {
            handleSelectChange(this);
        });
        
        // Restore saved value if it exists
        if (questionnaireData.answers[select.id]) {
            select.value = questionnaireData.answers[select.id];
            console.log(`Restored ${select.id}: ${select.value}`);
        }
    });
    
    console.log('Select event listeners initialized');
}

function handleSelectChange(selectElement) {
    console.log(`Selected ${selectElement.id}: ${selectElement.value}`);
    
    // Store the selected value - ensure it's not "undefined" string
    const value = selectElement.value;
    if (value === "undefined" || value === undefined || value === null) {
        questionnaireData.answers[selectElement.id] = "";
    } else {
        questionnaireData.answers[selectElement.id] = value;
    }
    
    console.log(`Saved ${selectElement.id} as: "${questionnaireData.answers[selectElement.id]}"`);
    
    // Enable/disable continue button based on validation
    updateContinueButtonState();
}

// Add this function to update continue button state
function updateContinueButtonState() {
    const currentStepNumber = getCurrentStepNumber();
    console.log(`Updating continue button for step ${currentStepNumber}`);
    
    const isValid = validateCurrentStep(currentStepNumber);
    console.log(`Step ${currentStepNumber} is valid: ${isValid}`);
    
    // Find the continue button for this step
    const continueBtn = document.querySelector(`#step-${currentStepNumber} .step-actions button:not(.secondary-btn)`);
    if (continueBtn) {
        continueBtn.disabled = !isValid;
        console.log(`Continue button ${continueBtn.id || continueBtn.textContent} disabled: ${continueBtn.disabled}`);
    }
}

// Helper function to get current step number
function getCurrentStepNumber() {
    const activeStep = document.querySelector('.questionnaire-step.active');
    if (activeStep) {
        const match = activeStep.id.match(/step-(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }
    return currentStep;
}

// Validate Current Step
function validateCurrentStep(step) {
    console.log(`Validating step ${step}`);
    
    switch(step) {
        case 1:
            const clientTypeValid = questionnaireData.clientType !== '';
            console.log(`Step 1 validation: clientTypeValid = ${clientTypeValid}`);
            return clientTypeValid;
            
        case 2:
            const requiredStep2 = ['child-age-range', 'parent-age', 'financial-health', 'proximity', 'home-equity'];
            console.log('Step 2 validation checking fields:', requiredStep2);
            
            let allStep2Valid = true;
            requiredStep2.forEach(field => {
                const value = questionnaireData.answers[field];
                const hasValue = value !== undefined && 
                                 value !== null && 
                                 value !== "" && 
                                 value !== "undefined" && 
                                 value.toString().trim() !== '';
                console.log(`Field ${field}: value="${value}", type=${typeof value}, hasValue=${hasValue}`);
                if (!hasValue) allStep2Valid = false;
            });
            
            console.log(`Step 2 overall validation: ${allStep2Valid}`);
            return allStep2Valid;
            
        case 3:
            const requiredStep3 = ['downpayment-saved', 'timeline', 'credit', 'gifting'];
            console.log('Step 3 validation checking fields:', requiredStep3);
            
            let allStep3Valid = true;
            requiredStep3.forEach(field => {
                const value = questionnaireData.answers[field];
                const hasValue = value !== undefined && 
                                 value !== null && 
                                 value !== "" && 
                                 value !== "undefined" && 
                                 value.toString().trim() !== '';
                console.log(`Field ${field}: value="${value}", type=${typeof value}, hasValue=${hasValue}`);
                if (!hasValue) allStep3Valid = false;
            });
            
            console.log(`Step 3 overall validation: ${allStep3Valid}`);
            return allStep3Valid;
            
        case 4:
            const models = ['three-thirty', 'co-investing', 'multi-gen', 'early-inheritance', 'home-equity'];
            let allStep4Valid = true;
            
            models.forEach(model => {
                const preference = questionnaireData.strategyRatings[model];
                const hasPreference = preference !== undefined && 
                                     preference !== null && 
                                     preference !== "" && 
                                     preference !== "undefined";
                console.log(`Model ${model} preference: "${preference}", hasPreference=${hasPreference}`);
                if (!hasPreference) allStep4Valid = false;
            });
            
            console.log(`Step 4 overall validation: ${allStep4Valid}`);
            return allStep4Valid;
            
        default:
            return true;
    }
}

// Select Client Type
function selectClientType(type) {
    console.log(`Client type selected: ${type}`);
    
    // Remove selection from all options
    document.querySelectorAll('.client-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked option
     const selectedOption = document.querySelector(`.client-option[data-type="${type}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');

        // Store client type
        questionnaireData.clientType = type;

        // Update child age group visibility
        const childAgeGroup = document.getElementById('child-age-group');
        if (childAgeGroup) {
            if (type === 'child') {
                childAgeGroup.style.display = 'none';
                questionnaireData.answers['child-age-range'] = 0;
                
            } else {
                childAgeGroup.style.display = 'block';
            }
        }      

        // Enable continue button (still needs validation)
        updateContinueButtonState();
        

    }
    // Enable continue button
    const continueBtn = document.getElementById('next-step-1');
    if (continueBtn) {
        continueBtn.disabled = false;
    }
        // Store client type
        questionnaireData.clientType = type;
    
}

// Function to update strategy ratings
function updateStrategyRating(modelId, rating) {
    console.log(`Strategy rating for ${modelId}: ${rating}`);
    questionnaireData.strategyRatings[modelId] = parseInt(rating);
    updateContinueButtonState();
}

// Select Option from Button Group
function selectOption(button, fieldName) {
    console.log(`Selected ${fieldName}: ${button.dataset.value}`);
    
    // Get the button group
    const buttonGroup = button.parentElement;
    
    // Remove 'selected' class from all buttons in group
    buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add 'selected' class to clicked button
    button.classList.add('selected');
    
    // Store the selected value
    questionnaireData.answers[fieldName] = button.dataset.value;
    
    // Update hidden input if exists
    const hiddenInput = document.getElementById(fieldName);
    if (hiddenInput) {
        hiddenInput.value = button.dataset.value;
    }
    
    // Update validation state
    updateContinueButtonState();
}

function selectOption2(button, fieldName) {
    console.log(`Selected ${fieldName}: ${button}`);
    
    // Store the selected value
    questionnaireData.answers[fieldName] = button;
    
    // Update hidden input if exists
    const hiddenInput = document.getElementById(fieldName);
    if (hiddenInput) {
        hiddenInput.value = button;
    }
    
    // Update validation state
    updateContinueButtonState();
}

// Set Model Preference
function setPreference(modelId, button) {
    console.log(`Preference for ${modelId}: ${button.dataset.value}`);
    
    // Get the preference card
    const card = button.closest('.preference-card');
    
    // Remove 'selected' from all buttons in this card
    card.querySelectorAll('.pref-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add 'selected' to clicked button
    button.classList.add('selected');
    
    // Store the preference
    questionnaireData.strategyRatings[modelId] = button.dataset.value;
    
    // Update validation state for step 4
    if (currentStep === 4) {
        updateContinueButtonState();
    }
}

// Calculate Matches
function calculateMatches() {
    console.log('Calculating matches...');
    
    const matchResults = document.getElementById('match-results');
    if (!matchResults) return;
    
    // Show loading
    matchResults.innerHTML = `
        <div class="loading-message">
            <div class="spinner"></div>
            <p>Analyzing your responses...</p>
        </div>
    `;
    
    // Simulate calculation delay
    setTimeout(() => {
        const scores = calculateModelScores();
        displayMatchResults(scores);
    }, 1500);
}

// Calculate Model Scores
function calculateModelScores() {
    const scores = {};
    const allModels = ['three-thirty', 'co-investing', 'multi-gen', 'early-inheritance', 'home-equity'];
    
    // Base scoring based on questionnaire answers
    allModels.forEach(modelId => {
        let score = 0;
        
        // 1. Eligibility scoring (0-40 points)
        score += calculateEligibilityScore(modelId);
        
        // 2. Preference scoring (0-40 points)
        score += calculatePreferenceScore(modelId);
        
        // 3. Client-type bonus (0-20 points)
        //score += calculateClientTypeBonus(modelId);
        
        scores[modelId] = Math.min(100, Math.max(0, score));
    });
    
    questionnaireData.modelScores = scores;
    return scores;
}

// Calculate Eligibility Score
function calculateEligibilityScore(modelId) {
    let score = 0;
    const answers = questionnaireData.answers;
    
    switch(modelId) {
        case 'three-thirty':
            if (answers['child-age-range'] === 'under18') score = score-40;
            if (answers['child-age-range'] === '18-25') score +=15
            if (answers.timeline === '3yr') score += 10;
            if (answers.credit === 'poor' || answers.credit === 'average') score += 15;
            break;
            
        case 'co-investing':
            if (answers['financial-health'] === 'excellent' || answers['financial-health'] === 'good') score += 20;
            if (answers.gifting === 'yes' || answers.gifting === 'maybe') score += 20;
            break;
            
        case 'multi-gen':
            if (answers['child-age-range'] === 'under18') score = score-40;
            if (answers.proximity === 'critical' || answers.proximity === 'important') score += 20;
            if (answers['home-equity'] === 'yes') score += 20;
            break;
            
        case 'early-inheritance':
            if (answers['financial-health'] === 'excellent') score += 30;
            if (answers.gifting === 'yes') score += 10;
            break;
            
        case 'home-equity':
            if (answers['home-equity'] === 'yes') score += 30;
            if (answers['financial-health'] === 'excellent' || answers['financial-health'] === 'good') score += 10;
            break;
    }
    
    return score;
}

// Calculate Preference Score
function calculatePreferenceScore(modelId) {
    const preference = questionnaireData.strategyRatings[modelId];
    if (!preference) return 0;
    
    switch(preference) {
        case '5': return 40;
        case '4': return 20;
        case '3': return 0;
        case '2': return -20;
        case '1': return -30;
        default: return 0;
    }
}

// Display Match Results
function displayMatchResults(scores) {
    const matchResults = document.getElementById('match-results');
    if (!matchResults) return;
    
    // Sort models by score (highest first)
    const sortedModels = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    // Clear loading message
    matchResults.innerHTML = '';
    
    // Create result cards
    sortedModels.forEach(([modelId, score], index) => {
        const model = MODELS[modelId];
        if (!model) return;
        
        const resultCard = document.createElement('div');
        resultCard.className = `match-card ${getMatchClass(score)}`;
        
        const rank = index + 1;
        const matchText = getMatchText(score);
        
        resultCard.innerHTML = `
            <div class="match-rank">${rank}</div>
            <div class="match-details">
                <h3>${model.name}</h3>
                <p class="model-subtitle">${model.subtitle}</p>
                <p>${model.description}</p>
            </div>
            <div class="match-score">
                <div class="score-circle" style="background: ${getScoreColor(score)}">
                    <div class="score-value">${score}%</div>
                    <div class="score-label">${matchText}</div>
                </div>
            </div>
        `;
        
        matchResults.appendChild(resultCard);
    });
}

// Helper functions for match results
function getMatchClass(score) {
    if (score >= 80) return 'high-match';
    if (score >= 60) return 'medium-match';
    return 'low-match';
}

function getMatchText(score) {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Possible Option';
    return 'Not Recommended';
}

function getScoreColor(score) {
    if (score >= 80) return '#2ecc71';  // Green
    if (score >= 60) return '#f39c12';  // Orange
    if (score >= 40) return '#e74c3c';  // Red
    return '#95a5a6';  // Gray
}

// Proceed to Selected Strategies
function proceedToSelectedStrategies() {
    console.log('Proceeding with top strategies...');
    
    // Get top 3 scoring models
    const scores = questionnaireData.modelScores;
    const topModels = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([modelId]) => modelId);
    
    // Save to localStorage for CoverPage
    localStorage.setItem('questionnaireCompleted', 'true');
    localStorage.setItem('recommendedModels', JSON.stringify(topModels));
    localStorage.setItem('questionnaireData', JSON.stringify(questionnaireData));
    
    // Navigate to CoverPage
    window.location.href = 'CoverPage.html';
}

// View All Strategies
function viewAllStrategies() {
    console.log('Viewing all strategies...');
    
    // Just mark questionnaire as completed
    localStorage.setItem('questionnaireCompleted', 'true');
    localStorage.setItem('questionnaireData', JSON.stringify(questionnaireData));
    
    // Navigate to CoverPage
    window.location.href = 'CoverPage.html';
}

// Initialize Matchmaker
function initializeMatchmaker() {
    initializeSession();
    console.log('Initializing matchmaker...');

    // Clear previous questionnaire data only if starting fresh
    const fromCoverPage = document.referrer && document.referrer.includes('CoverPage.html');
    
    if (!fromCoverPage) {
        // Starting fresh, clear questionnaire data
        localStorage.removeItem('questionnaireData');
        localStorage.removeItem('recommendedModels');
        console.log('Starting fresh questionnaire');
    }
        
    // Reset state
    currentStep = 1;
    questionnaireData = {
        clientType: '',
        answers: {},
        strategyRatings: {},
        modelScores: {}
    };
    
    // Add child age tracking
    if (!questionnaireData.answers['child-age-range']) {
        questionnaireData.answers['child-age-range'] = '';
    }

    // Restore from localStorage if exists (for back navigation)
    const savedQuestionnaire = localStorage.getItem('questionnaireData');
    if (savedQuestionnaire) {
        try {
            const parsedData = JSON.parse(savedQuestionnaire);
            
            // Clean up any "undefined" string values in the parsed data
            Object.keys(parsedData.answers || {}).forEach(key => {
                if (parsedData.answers[key] === "undefined") {
                    parsedData.answers[key] = "";
                }
            });
            
            Object.keys(parsedData.strategyRatings || {}).forEach(key => {
                if (parsedData.strategyRatings[key] === "undefined") {
                    parsedData.strategyRatings[key] = "";
                }
            });
            
            if (parsedData.clientType === "undefined") {
                parsedData.clientType = "";
            }
            
            questionnaireData = parsedData;
            console.log('Restored and cleaned questionnaire data:', questionnaireData);
        } catch (error) {
            console.error('Error restoring questionnaire:', error);
        }
    }

    // Update progress bar
    updateProgressBar(1);
    updateStepIndicators(1);
    
    // Initialize all event listeners after a short delay to ensure DOM is ready
    setTimeout(() => {
        const childAgeGroup = document.getElementById('child-age-group');
        if (childAgeGroup) {
            if (childAgeGroup && questionnaireData.clientType === 'child') {
                childAgeGroup.style.display = 'none';
            } 
        }

        // Initialize select event listeners
        initializeSelectEventListeners();
        
        // Initialize button group listeners
        initializeButtonGroupListeners();
        
        // Initialize preference button listeners
        initializePreferenceListeners();
        
        // Restore UI
        restoreQuestionnaireUI();
        
        // Force update of continue button state
        updateContinueButtonState();
    }, 200);
}

function selectChildAge(ageRange) {
    questionnaireData.answers['child-age-range'] = ageRange;
    console.log(`Child age range selected: ${ageRange}`);
    updateContinueButtonState();
}

// Add these new initialization functions
function initializeSelectEventListeners() {
    console.log('Initializing select event listeners...');
    
    document.querySelectorAll('#step-2 select, #step-3 select').forEach(select => {
        // Remove any existing listeners
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
        
        // Add new listener
        newSelect.addEventListener('change', function() {
            handleSelectChange(this);
        });
        
        console.log(`Added listener for select: ${newSelect.id}`);
    });
}

function initializeButtonGroupListeners() {
    console.log('Initializing button group listeners...');
    
    document.querySelectorAll('.button-group').forEach(group => {
        const buttons = group.querySelectorAll('.toggle-btn');
        buttons.forEach(button => {
            // Remove any existing onclick handlers
            button.onclick = null;
            
            // Add new handler
            const fieldName = button.closest('.input-group').querySelector('input[type="hidden"]').id;
            button.addEventListener('click', function() {
                selectOption(this, fieldName);
            });
        });
    });
}

function initializePreferenceListeners() {
    console.log('Initializing preference listeners...');
    
    document.querySelectorAll('.pref-btn').forEach(button => {
        // Remove any existing onclick handlers
        button.onclick = null;
        
        // Add new handler
        const modelId = button.closest('.preference-card').dataset.model;
        button.addEventListener('click', function() {
            setPreference(modelId, this);
        });
    });
}

// Add a function to clean "undefined" string values
function cleanUndefinedValues(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    Object.keys(obj).forEach(key => {
        if (obj[key] === "undefined") {
            obj[key] = "";
        } else if (typeof obj[key] === 'object') {
            cleanUndefinedValues(obj[key]);
        }
    });
    
    return obj;
}

function restoreQuestionnaireUI() {
    console.log('Restoring questionnaire UI...');
    console.log('Current questionnaireData:', questionnaireData);
    
    // Restore client type
    if (questionnaireData.clientType && questionnaireData.clientType !== "undefined") {
        console.log(`Restoring client type: ${questionnaireData.clientType}`);
        selectClientType(questionnaireData.clientType);
    }
    
    // Restore all answers - handle "undefined" string values
    Object.keys(questionnaireData.answers).forEach(field => {
        let value = questionnaireData.answers[field];
        
        // Clean up "undefined" string values
        if (value === "undefined" || value === undefined || value === null) {
            value = "";
            questionnaireData.answers[field] = "";
        }
        
        const element = document.getElementById(field);
        if (element) {
            if (element.tagName === 'SELECT') {
                // Set the select value
                element.value = value;
                console.log(`Restored select ${field}: "${value}"`);
                
                // Trigger change event to update validation
                setTimeout(() => {
                    const event = new Event('change');
                    element.dispatchEvent(event);
                }, 50);
            } else if (element.type === 'hidden') {
                // For button groups
                if (value && value !== "undefined") {
                    element.value = value;
                    
                    // Find and select the corresponding button
                    const buttonGroup = element.parentElement.querySelector('.button-group');
                    if (buttonGroup && value) {
                        buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
                            btn.classList.remove('selected');
                            if (btn.dataset.value === value) {
                                btn.classList.add('selected');
                            }
                        });
                    }
                    console.log(`Restored button group ${field}: "${value}"`);
                }
            }
        }
    });
    
    // Restore model preferences
    Object.keys(questionnaireData.strategyRatings).forEach(modelId => {
        let preference = questionnaireData.strategyRatings[modelId];
        
        // Clean up "undefined" string values
        if (preference === "undefined" || preference === undefined || preference === null) {
            preference = "";
            questionnaireData.strategyRatings[modelId] = "";
        }
        
        if (preference && preference !== "") {
            const card = document.querySelector(`.preference-card[data-model="${modelId}"]`);
            if (card) {
                card.querySelectorAll('.pref-btn').forEach(btn => {
                    btn.classList.remove('selected');
                    if (btn.dataset.value === preference) {
                        btn.classList.add('selected');
                    }
                });
                console.log(`Restored preference for ${modelId}: "${preference}"`);
            }
        }
    });
    
    // Update validation state
    setTimeout(() => {
        updateContinueButtonState();
    }, 100);
}

function saveQuestionnaireProgress() {
    // Clean up any "undefined" string values before saving
    cleanUndefinedValues(questionnaireData);
    
    // Save questionnaire progress to localStorage
    localStorage.setItem('questionnaireData', JSON.stringify(questionnaireData));
    console.log('Saved questionnaire data:', questionnaireData);
}

// ============================================
// SESSION MANAGEMENT & LOCAL STORAGE HANDLING
// ============================================

// Session tracking to distinguish new sessions from navigation
let currentSession = {
    id: null,
    startTime: null,
    pagesVisited: []
};

function initializeSession() {
    // Check if we have an existing session
    const existingSession = localStorage.getItem('currentSession');
    
    if (existingSession) {
        // We have an existing session
        currentSession = JSON.parse(existingSession);
        
        // Check if session is expired (older than 2 hours)
        const sessionAge = Date.now() - currentSession.startTime;
        const sessionExpired = sessionAge > 7200000; // 2 hours in milliseconds
        
        if (sessionExpired) {
            // Start fresh session
            startNewSession();
        } else {
            // Continue existing session
            currentSession.startTime = Date.now(); // Refresh session
        }
    } else {
        // Start fresh session
        startNewSession();
    }
    
    // Track this page visit
    trackPageVisit();
    saveSession();
}

function startNewSession() {
    // Generate a unique session ID
    currentSession = {
        id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        startTime: Date.now(),
        pagesVisited: []
    };
    
    // Clear ALL local storage for a fresh start
    clearAllLocalStorage();
    // Also clear any in-memory financial check data
    clearAllFinancialCheckData();
}

function trackPageVisit() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (!currentSession.pagesVisited.includes(currentPage)) {
        currentSession.pagesVisited.push(currentPage);
    }
}

function saveSession() {
    localStorage.setItem('currentSession', JSON.stringify(currentSession));
}

function clearAllLocalStorage() {
    console.log('Clearing ALL local storage for fresh start');
    
    // List all possible keys to clear
    const allKeys = [
        'selectedModels',
        'modelResults',
        'feasibleModels',
        'modelInputs',
        'questionnaireData',
        'questionnaireCompleted',
        'recommendedModels',
        'postAnalysisData',
        'enhancedModelResults',
        'enhancedModelInputs',
        'completeQuestionnaireAnswers',
        'fromQuestionnaire',
        'reverseMortgageCallbackAction',
        'reverseMortgageQuestionnaire',
    ];
    
    // Clear each key
    allKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleared: ${key}`);
    });
    // Don't clear currentSession which is managed separately.
}

// ============================================
// RESET FUNCTION FOR FRESH STARTS
// ============================================

function resetAllSelections() {
    if (confirm('Are you sure you want to start over? This will clear all your selections.')) {
        // Clear all local storage
        clearAllLocalStorage();
        
        // Start new session
        startNewSession();
        
        // Reload current page
        window.location.href = 'index.html';
        //window.location.reload();
    }
}

// ============================================
// ENHANCED START NEW COMPARISON BUTTON
// ============================================

function startNewComparison() {
 if (confirm('Are you sure you want to start a completely new comparison? This will clear ALL your data and start fresh.')) {
        // Clear ALL local storage for a fresh start
        clearAllLocalStorage();
        
        // Start a brand new session
        startNewSession();
        
        // Navigate to Matchmaker page for fresh start
        window.location.href = 'index.html';
        window.location.reload();
    }
}


// ============================================
// PAGE-SPECIFIC BACK BUTTON BEHAVIOR
// ============================================

// Back button handlers for each page
function goBackToCoverPage() {
    // When going back to Cover Page from Models page
    // Clear Models page data but keep selections
    localStorage.removeItem('feasibleModels');
    localStorage.removeItem('modelInputs');
    
    window.location.href = 'CoverPage.html';
}

function goBackToFeasibility() {
    // When going back to Feasibility page from Input page
    // Clear input data but keep feasible models
    const feasibleModels = localStorage.getItem('feasibleModels');
    const selectedModels = localStorage.getItem('selectedModels');
    
    localStorage.removeItem('modelInputs');
    
    // Preserve the path
    if (feasibleModels && selectedModels) {
        localStorage.setItem('feasibleModels', feasibleModels);
        localStorage.setItem('selectedModels', selectedModels);
    }
    
    window.location.href = 'Models.html';
}


// ============================================
// POST-ANALYSIS QUESTIONNAIRE FUNCTIONS
// ============================================

let postAnalysisData = {
    primarySponsor: {},
    otherSponsors: [],
    financialDetails: {},
    modelSpecificAnswers: {},
    completed: false
};

let currentPAStep = 1;

/*function showPostAnalysisQuestionnaire() {
    console.log('Opening Post Analysis Questionnaire');
    
    // Show modal
    document.getElementById('post-analysis-modal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Load existing data if available
    const savedPA = localStorage.getItem('postAnalysisData');
    if (savedPA) {
        try {
            postAnalysisData = JSON.parse(savedPA);
            console.log('Loaded existing post-analysis data');
        } catch (e) {
            console.error('Error loading post-analysis data:', e);
        }
    }
    
    // Get client type from matchmaker
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const clientType = questionnaireData.clientType || '';
    
    // Initialize the questionnaire
    initializePostAnalysisQuestionnaire(clientType);
}*/

function closePostAnalysisModal() {
    const modal = document.getElementById('post-analysis-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Save progress if completed
    savePostAnalysisProgress();
    
    // If not completed, clear the data for fresh start next time
    if (!postAnalysisData.completed) {
        console.log('Closing modal without completion - clearing incomplete data');
        clearPostAnalysisData();
        
        // Update print button state
        updatePrintButtonState();
    }
}

// Clear all financial check related data (comprehensive)
function clearAllFinancialCheckData() {
    console.log('Clearing all financial check data...');
    
    // Clear localStorage items
    localStorage.removeItem('postAnalysisData');
    localStorage.removeItem('enhancedModelResults');
    localStorage.removeItem('enhancedModelInputs');
    
    // Reset in-memory objects
    postAnalysisData = {
        primarySponsor: {},
        otherSponsors: [],
        financialDetails: {},
        modelSpecificAnswers: {},
        completed: false
    };
    
    // Reset step
    currentPAStep = 1;
    
    console.log('Financial check data cleared');
}

// Clear only post-analysis data
function clearPostAnalysisData() {
    console.log('Clearing post-analysis data...');
    localStorage.removeItem('postAnalysisData');
    
    // Reset in-memory object
    postAnalysisData = {
        primarySponsor: {},
        otherSponsors: [],
        financialDetails: {},
        modelSpecificAnswers: {},
        completed: false
    };
    
    // Reset step
    currentPAStep = 1;
}


function initializePrimarySponsorForm() {
    console.log('InitializePrimarySponsorForm...')
    // Restore primary sponsor data
    const sponsor = postAnalysisData.primarySponsor;
    
    const fields = ['name', 'dob', 'role', 'relationship', 'living', 'marital', 'dependents'];
    fields.forEach(field => {
        const element = document.getElementById(`pa-primary-${field}`);
        if (element && sponsor[field]) {
            element.value = sponsor[field];
        }
    });
}

function initializeOtherSponsorsStep() {
    console.log('Initializing other sponsors step...');
    
    const container = document.getElementById('other-sponsors-container');
    if (!container) {
        console.warn('other-sponsors-container not found');
        return;
    }
    
    container.innerHTML = '';
    
    // Check if we have other sponsors to restore
    if (postAnalysisData.otherSponsors && Array.isArray(postAnalysisData.otherSponsors)) {
        console.log(`Restoring ${postAnalysisData.otherSponsors.length} other sponsors`);
        postAnalysisData.otherSponsors.forEach((sponsor, index) => {
            addOtherSponsorToUI(sponsor);
        });
    } else {
        console.log('No other sponsors to restore');
        // Initialize empty array
        postAnalysisData.otherSponsors = [];
    }
}


// Helper function to add existing sponsor to UI
function addOtherSponsorToUI(sponsor) {
    const container = document.getElementById('other-sponsors-container');
    if (!container) return;
    
    const sponsorDiv = document.createElement('div');
    sponsorDiv.className = 'sponsor-card';
    sponsorDiv.dataset.id = sponsor.id;
    
    sponsorDiv.innerHTML = `
        <div class="sponsor-card-header">
            <h4>Additional Sponsor ${postAnalysisData.otherSponsors.findIndex(s => s.id === sponsor.id) + 1}</h4>
            <button class="remove-btn" onclick="removeOtherSponsor('${sponsor.id}')">×</button>
        </div>
        
        <div class="sponsor-form">
            <div class="input-group">
                <label>Full Legal Name</label>
                <input type="text" class="sponsor-name" data-id="${sponsor.id}" 
                       value="${sponsor.name || ''}"
                       onchange="updateOtherSponsor('${sponsor.id}', 'name', this.value)"
                       placeholder="Full legal name">
            </div>
            
            <div class="input-group">
                <label>Date of Birth</label>
                <input type="date" class="sponsor-dob" data-id="${sponsor.id}"
                       value="${sponsor.dob || ''}"
                       onchange="updateOtherSponsor('${sponsor.id}', 'dob', this.value)">
            </div>
            
            <div class="input-group">
                <label>Relationship to Primary Sponsor</label>
                <select class="sponsor-relationship" data-id="${sponsor.id}"
                        onchange="updateOtherSponsor('${sponsor.id}', 'relationship', this.value)">
                    <option value="">Select...</option>
                    <option value="spouse" ${sponsor.relationship === 'spouse' ? 'selected' : ''}>Spouse/Partner</option>
                    <option value="parent" ${sponsor.relationship === 'parent' ? 'selected' : ''}>Parent</option>
                    <option value="child" ${sponsor.relationship === 'child' ? 'selected' : ''}>Child</option>
                    <option value="sibling" ${sponsor.relationship === 'sibling' ? 'selected' : ''}>Sibling</option>
                    <option value="other-relative" ${sponsor.relationship === 'other-relative' ? 'selected' : ''}>Other Relative</option>
                    <option value="non-relative" ${sponsor.relationship === 'non-relative' ? 'selected' : ''}>Non-Relative</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Role in Project</label>
                <select class="sponsor-role" data-id="${sponsor.id}"
                        onchange="updateOtherSponsor('${sponsor.id}', 'role', this.value)">
                    <option value="">Select...</option>
                    <option value="co-buyer" ${sponsor.role === 'co-buyer' ? 'selected' : ''}>Co-Buyer</option>
                    <option value="financial-supporter" ${sponsor.role === 'financial-supporter' ? 'selected' : ''}>Financial Supporter</option>
                    <option value="co-signer" ${sponsor.role === 'co-signer' ? 'selected' : ''}>Co-Signer</option>
                    <option value="beneficiary" ${sponsor.role === 'beneficiary' ? 'selected' : ''}>Beneficiary</option>
                    <option value="advisor" ${sponsor.role === 'advisor' ? 'selected' : ''}>Family Advisor</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Current Living Situation</label>
                <select class="sponsor-living" data-id="${sponsor.id}"
                        onchange="updateOtherSponsor('${sponsor.id}', 'living', this.value)">
                    <option value="">Select...</option>
                    <option value="renting" ${sponsor.living === 'renting' ? 'selected' : ''}>Renting</option>
                    <option value="owns-primary" ${sponsor.living === 'owns-primary' ? 'selected' : ''}>Owns Primary Residence</option>
                    <option value="owns-investment" ${sponsor.living === 'owns-investment' ? 'selected' : ''}>Owns Investment Property</option>
                    <option value="lives-with-family" ${sponsor.living === 'lives-with-family' ? 'selected' : ''}>Lives with Family</option>
                    <option value="other" ${sponsor.living === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Marital Status</label>
                <select class="sponsor-marital" data-id="${sponsor.id}"
                        onchange="updateOtherSponsor('${sponsor.id}', 'marital', this.value)">
                    <option value="">Select...</option>
                    <option value="single" ${sponsor.marital === 'single' ? 'selected' : ''}>Single</option>
                    <option value="married" ${sponsor.marital === 'married' ? 'selected' : ''}>Married</option>
                    <option value="common-law" ${sponsor.marital === 'common-law' ? 'selected' : ''}>Common-Law</option>
                    <option value="divorced" ${sponsor.marital === 'divorced' ? 'selected' : ''}>Divorced</option>
                    <option value="widowed" ${sponsor.marital === 'widowed' ? 'selected' : ''}>Widowed</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Number of Dependents</label>
                <input type="number" class="sponsor-dependents" data-id="${sponsor.id}" min="0"
                       value="${sponsor.dependents || ''}"
                       onchange="updateOtherSponsor('${sponsor.id}', 'dependents', this.value)">
            </div>
        </div>
    `;
    
    container.appendChild(sponsorDiv);
}

function updatePrimarySponsor(field, value) {
    postAnalysisData.primarySponsor[field] = value;
    savePostAnalysisProgress();
}

function addOtherSponsor() {
    console.log('Adding other sponsor...');
    
    // Ensure postAnalysisData is initialized
    if (!postAnalysisData) {
        console.warn('postAnalysisData not initialized, initializing now...');
        postAnalysisData = {
            primarySponsor: {},
            otherSponsors: [],
            financialDetails: {},
            modelSpecificAnswers: {},
            completed: false
        };
    }
    
    // Ensure otherSponsors array exists
    if (!Array.isArray(postAnalysisData.otherSponsors)) {
        console.warn('otherSponsors is not an array, initializing...');
        postAnalysisData.otherSponsors = [];
    }
    
    const sponsorId = 'sponsor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newSponsor = {
        id: sponsorId,
        name: '',
        dob: '',
        relationship: '',
        role: '',
        living: '',
        marital: '',
        dependents: ''
    };
    
    console.log('New sponsor created:', newSponsor);
    console.log('Current otherSponsors before push:', postAnalysisData.otherSponsors);
    
    // Add the new sponsor
    postAnalysisData.otherSponsors.push(newSponsor);
    
    console.log('Current otherSponsors after push:', postAnalysisData.otherSponsors);
    
    // Add to UI using the helper function
    addOtherSponsorToUI(newSponsor);
    
    savePostAnalysisProgress();
}


function updateOtherSponsor(sponsorId, field, value) {
    const sponsor = postAnalysisData.otherSponsors.find(s => s.id === sponsorId);
    if (sponsor) {
        sponsor[field] = value;
        savePostAnalysisProgress();
    }
}

function removeOtherSponsor(sponsorId) {
    postAnalysisData.otherSponsors = postAnalysisData.otherSponsors.filter(s => s.id !== sponsorId);
    
    // Remove from UI
    const element = document.querySelector(`.sponsor-card[data-id="${sponsorId}"]`);
    if (element) {
        element.remove();
    }
    
    // Re-number remaining sponsors
    const container = document.getElementById('other-sponsors-container');
    if (container) {
        const cards = container.querySelectorAll('.sponsor-card');
        cards.forEach((card, index) => {
            const header = card.querySelector('.sponsor-card-header h4');
            if (header) {
                header.textContent = `Additional Sponsor ${index + 1}`;
            }
        });
    }
    
    savePostAnalysisProgress();
}

function initializeFinancialDetailsStep() {
    console.log('Initializing financial details step...');
    
    console.log('Current sponsors:', {
        primary: postAnalysisData.primarySponsor,
        others: postAnalysisData.otherSponsors
    });

    const container = document.getElementById('financial-details-cards');
    if (!container) {
        console.warn('Financial details container not found yet');
        return;
    }
    
    container.innerHTML = '';
    
    // Check if we have any sponsors - FIXED: Check properly
    const hasPrimarySponsor = postAnalysisData.primarySponsor && 
                             Object.keys(postAnalysisData.primarySponsor).length > 0 &&
                             (postAnalysisData.primarySponsor.name || 
                              postAnalysisData.primarySponsor.role || 
                              postAnalysisData.primarySponsor.relationship);
    
    const hasOtherSponsors = postAnalysisData.otherSponsors && 
                            Array.isArray(postAnalysisData.otherSponsors) && 
                            postAnalysisData.otherSponsors.length > 0;
    
    console.log('Sponsor check:', { hasPrimarySponsor, hasOtherSponsors, primarySponsor: postAnalysisData.primarySponsor, otherSponsors: postAnalysisData.otherSponsors });
    
    if (!hasPrimarySponsor && !hasOtherSponsors) {
        container.innerHTML = `
            <div class="notice-card">
                <p>Please add sponsor information in Step 1 and 2 before providing financial details.</p>
                <button class="secondary-btn" onclick="prevPAStep(1)">← Go Back to Add Sponsors</button>
            </div>
        `;
        return;
    }
    
    // Create financial card for primary sponsor
    if (hasPrimarySponsor) {
        console.log('Creating financial card for primary sponsor');
        const primaryCard = createFinancialCard(postAnalysisData.primarySponsor, 'primary');
        if (primaryCard) {
            container.appendChild(primaryCard);
        }
    }
    
    // Create financial cards for other sponsors
    if (hasOtherSponsors) {
        console.log(`Creating financial cards for ${postAnalysisData.otherSponsors.length} other sponsors`);
        postAnalysisData.otherSponsors.forEach((sponsor, index) => {
            const card = createFinancialCard(sponsor, `other-${index}`);
            if (card) {
                container.appendChild(card);
            }
        });
    }

    // Initialize event listeners for the newly created financial inputs
    initializeFinancialInputListeners();
}

// Helper function to initialize event listeners for financial inputs
function initializeFinancialInputListeners() {
    console.log('Initializing financial input listeners...');
    
    // Add change event listeners to all financial inputs
    document.querySelectorAll('.financial-input').forEach(input => {
        // Remove existing listeners first
        input.removeEventListener('change', handleFinancialInputChange);
        
        // Add new listener
        input.addEventListener('change', handleFinancialInputChange);
    });
}

function handleFinancialInputChange(event) {
    const input = event.target;
    const type = input.dataset.type;
    const field = input.dataset.field;
    const value = input.value;
    
    console.log(`Financial input changed: ${type}.${field} = ${value}`);
    
    if (postAnalysisData.financialDetails && postAnalysisData.financialDetails[type]) {
        postAnalysisData.financialDetails[type][field] = value;
        
        // Handle showing/hiding other input for future changes
        if (field === 'futureChanges') {
            const otherDiv = input.parentElement.querySelector('.future-change-other');
            if (otherDiv) {
                otherDiv.style.display = (value === 'other') ? 'block' : 'none';
            }
        }
        
        savePostAnalysisProgress();
    }
}

function createFinancialCard(sponsor, type) {
    console.log(`Creating financial card for ${type}:`, sponsor);
    
    try {
        // Ensure sponsor is valid
        if (!sponsor || typeof sponsor !== 'object') {
            console.warn('Invalid sponsor data:', sponsor);
            return null;
        }
        
        // Ensure financialDetails exists
        if (!postAnalysisData.financialDetails) {
            postAnalysisData.financialDetails = {};
        }
        
        // Get existing details or create empty ones
        let details = postAnalysisData.financialDetails[type];
        if (!details) {
            details = createEmptyFinancialDetails();
            postAnalysisData.financialDetails[type] = details;
        }
        
        const sponsorName = sponsor.name || sponsor.firstName || 'Sponsor';
        
        const financialCard = document.createElement('div');
        financialCard.className = 'financial-card';
        financialCard.dataset.type = type;
        financialCard.dataset.sponsorId = sponsor.id || sponsorName;
        
        financialCard.innerHTML = `
            <h4>💰 Financial Details: ${sponsorName} (${sponsor.role || sponsor.relationship || 'Sponsor'})</h4>
            
            <div class="financial-grid">
                <div class="input-group">
                    <label>Occupation</label>
                    <input type="text" class="financial-input" data-type="${type}" data-field="occupation"
                           value="${details.occupation || ''}" placeholder="e.g., Engineer, Teacher, Retired">
                </div>
                
                <div class="input-group">
                    <label>Annual Income ($)</label>
                    <input type="number" class="financial-input" data-type="${type}" data-field="income"
                           value="${details.income || ''}" placeholder="Annual income before tax">
                </div>
                
                <div class="input-group">
                    <label>Credit Rating</label>
                    <select class="financial-input" data-type="${type}" data-field="creditRating">
                        <option value="">Select...</option>
                        <option value="excellent" ${details.creditRating === 'excellent' ? 'selected' : ''}>Excellent (750+)</option>
                        <option value="good" ${details.creditRating === 'good' ? 'selected' : ''}>Good (680-749)</option>
                        <option value="average" ${details.creditRating === 'average' ? 'selected' : ''}>Average (620-679)</option>
                        <option value="poor" ${details.creditRating === 'poor' ? 'selected' : ''}>Poor/Repairing</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>Current Assets ($)</label>
                    <input type="text" class="financial-input" data-type="${type}" data-field="assets"
                           value="${details.assets || ''}" 
                           placeholder="Savings, investments, RRSPs/TFSAs">
                </div>
                
                <div class="input-group">
                    <label>Current Debts ($)</label>
                    <input type="text" class="financial-input" data-type="${type}" data-field="debts"
                           value="${details.debts || ''}" 
                           placeholder="Student loans, car payments, credit cards">
                </div>
                
                <div class="input-group">
                    <label>Down Payment Saved ($)</label>
                    <input type="number" class="financial-input" data-type="${type}" data-field="downPaymentSaved"
                           value="${details.downPaymentSaved || ''}" 
                           placeholder="Amount saved for down payment">
                </div>
                
                <div class="input-group">
                    <label>Monthly Savings ($)</label>
                    <input type="number" class="financial-input" data-type="${type}" data-field="monthlySavings"
                           value="${details.monthlySavings || ''}" 
                           placeholder="Amount saved monthly">
                </div>
            </div>
            
            <div class="input-group">
                <label>Mortgage Pre-Approval Amount ($)</label>
                <input type="number" class="financial-input" data-type="${type}" data-field="mortgagePreApproval"
                       value="${details.mortgagePreApproval || ''}" 
                       placeholder="If pre-approved, amount">
            </div>
            
            <div class="input-group">
                <label>Expected Future Changes (Next 5 Years)</label>
                <select class="financial-input" data-type="${type}" data-field="futureChanges">
                    <option value="">Select...</option>
                    <option value="promotion" ${details.futureChanges === 'promotion' ? 'selected' : ''}>Promotion (20% salary increase at once)</option>
                    <option value="salary-up" ${details.futureChanges === 'salary-up' ? 'selected' : ''}>Salary up (2% annually)</option>
                    <option value="salary-down" ${details.futureChanges === 'salary-down' ? 'selected' : ''}>Salary down (2% annually)</option>
                    <option value="time-off" ${details.futureChanges === 'time-off' ? 'selected' : ''}>Time off (no income for 5 years)</option>
                    <option value="no-change" ${details.futureChanges === 'no-change' ? 'selected' : ''}>No significant changes</option>
                    <option value="other" ${details.futureChanges === 'other' ? 'selected' : ''}>Other (specify below)</option>
                </select>
                <div class="future-change-other" style="${details.futureChanges === 'other' ? 'display: block;' : 'display: none;'} margin-top: 0.5rem;">
                    <input type="text" class="financial-input" data-type="${type}" data-field="futureChangesOther"
                        value="${details.futureChangesOther || ''}" 
                        placeholder="Describe other expected changes">
                </div>
            </div>
        `;
        
        // Add event listener for future changes dropdown
        const futureChangesSelect = financialCard.querySelector('select[data-field="futureChanges"]');
        if (futureChangesSelect) {
            futureChangesSelect.addEventListener('change', function() {
                const otherDiv = this.parentElement.querySelector('.future-change-other');
                if (otherDiv) {
                    otherDiv.style.display = this.value === 'other' ? 'block' : 'none';
                }
            });
        }
        
        return financialCard;
    } catch (error) {
        console.error('Error creating financial card:', error);
        return null;
    }
}

// Add this helper function
function createEmptyFinancialDetails() {
    return {
        occupation: '',
        income: '',
        creditRating: '',
        assets: '',
        debts: '',
        downPaymentSaved: '',
        monthlySavings: '',
        mortgagePreApproval: '',
        futureChanges: '',
        futureChangesOther: ''
    };
}

// Add this helper to check if elements exist
function checkPostAnalysisElements() {
    const elements = [
        'pa-step-1', 'pa-step-2', 'pa-step-3', 'pa-step-4', 'pa-step-5',
        'financial-details-cards', 'other-sponsors-container', 'model-specific-questions'
    ];
    
    console.log('Checking post-analysis elements:');
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'FOUND' : 'NOT FOUND'}`);
    });
}

// Add this function to restore client type
function restoreClientTypeFromQuestionnaire() {
    const clientTypeDisplay = document.getElementById('pa-client-type-display');
    if (!clientTypeDisplay) return;
    
    // Get client type from questionnaire data
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const clientType = questionnaireData.clientType || '';
    
    console.log('Restoring client type from questionnaire:', clientType);
    
    let displayText = '';
    switch(clientType) {
        case 'child': 
            displayText = 'Adult Child/First-Time Buyer';
            break;
        case 'parent': 
            displayText = 'Parent/Family Helper';
            break;
        case 'both': 
            displayText = 'Parents and Children Planning Together';
            break;
        default: 
            displayText = 'Not Specified - Please select in Step 1';
    }
    
    clientTypeDisplay.textContent = displayText;
    
    // Also update the hidden input if it exists
    const sponsorTypeInput = document.getElementById('pa-sponsor-type');
    if (sponsorTypeInput) {
        // Map client type to sponsor type
        let sponsorType = '';
        switch(clientType) {
            case 'child': sponsorType = 'sole'; break;
            case 'parent': sponsorType = 'joint'; break;
            case 'both': sponsorType = 'joint'; break;
            default: sponsorType = '';
        }
        sponsorTypeInput.value = sponsorType;

        // Also update the UI buttons if they exist
        const buttonGroup = sponsorTypeInput.parentElement.querySelector('.button-group');
        if (buttonGroup) {
            buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.remove('selected');
                if (btn.dataset.value === sponsorType) {
                    btn.classList.add('selected');
                }
            });
        }
    }
}

// Update the modal opening sequence
function showPostAnalysisQuestionnaire() {
    console.log('Opening Post Analysis Questionnaire');
    
    // First, show the modal
    const modal = document.getElementById('post-analysis-modal');
    if (!modal) {
        console.error('Post-analysis modal not found!');
        alert('Error: Cannot load financial check. Please refresh the page.');
        return;
    }
    
    // Check if there's existing incomplete data
    const savedPA = localStorage.getItem('postAnalysisData');
    if (savedPA) {
        try {
            const paData = JSON.parse(savedPA);
            
            // Ask user if they want to continue or start fresh
            if (!paData.completed && (paData.primarySponsor && Object.keys(paData.primarySponsor).length > 0)) {
                const userChoice = confirm(
                    'We found an incomplete financial check.\n\n' +
                    'Click "OK" to continue where you left off.\n' +
                    'Click "Cancel" to start a fresh financial check.'
                );
                
                if (!userChoice) {
                    // User wants to start fresh
                    clearAllFinancialCheckData();
                }
            }
        } catch (e) {
            console.error('Error checking existing post-analysis data:', e);
            clearAllFinancialCheckData();
        }
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Load or initialize data
    const savedData = localStorage.getItem('postAnalysisData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            postAnalysisData = {
                primarySponsor: parsed.primarySponsor || {},
                otherSponsors: Array.isArray(parsed.otherSponsors) ? parsed.otherSponsors : [],
                financialDetails: parsed.financialDetails || {},
                modelSpecificAnswers: parsed.modelSpecificAnswers || {},
                completed: parsed.completed || false
            };
            console.log('Loaded existing post-analysis data:', postAnalysisData);
        } catch (e) {
            console.error('Error loading post-analysis data:', e);
            clearAllFinancialCheckData();
        }
    } else {
        clearAllFinancialCheckData();
    }
    
    // Get client type
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const clientType = questionnaireData.clientType || '';
    
    // Initialize steps after a short delay
    setTimeout(() => {
        // Restore client type from questionnaire
        restoreClientTypeFromQuestionnaire();

        // Start at step 1
        currentPAStep = 1;
        updatePAProgressBar(1);
        updatePAStepIndicators(1);
      
        // Hide all steps except step 1
        document.querySelectorAll('.questionnaire-step').forEach(step => {
            step.classList.remove('active');
        });
        const firstStep = document.getElementById(`pa-step-${currentPAStep}`);
        if (firstStep) {
            firstStep.classList.add('active');
        }

        // Initialize step 1 content
        initializeStepContent(1);

    }, 200);
}

// Ensure modal elements are ready when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Pre-load modal elements if they exist
    const modal = document.getElementById('post-analysis-modal');
    if (modal) {
        console.log('Post-analysis modal found in DOM');
        
        // Ensure modal is hidden initially
        modal.style.display = 'none';
        
        // Initialize any modal-specific event listeners
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = closePostAnalysisModal;
        }
    }
    
    // Also check for print button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        // Check if post-analysis was completed
        const savedPA = localStorage.getItem('postAnalysisData');
        if (savedPA) {
            try {
                const paData = JSON.parse(savedPA);
                if (paData.completed) {
                    printBtn.disabled = false;
                    printBtn.textContent = '📄 Print Final Report';
                }
            } catch (e) {
                console.error('Error checking post-analysis status:', e);
            }
        }
    }
});

function updateFinancialDetail(element) {
    const type = element.dataset.type;
    const field = element.dataset.field;
    const value = element.value;
    
    if (postAnalysisData.financialDetails[type]) {
        postAnalysisData.financialDetails[type][field] = value;
        
        // Handle showing/hiding other input for future changes
        if (field === 'futureChanges') {
            const otherDiv = element.parentElement.querySelector('.future-change-other');
            if (otherDiv) {
                otherDiv.style.display = (value === 'other') ? 'block' : 'none';
            }
        }
        
        savePostAnalysisProgress();
    }
}

// Determine if sole sponsor
function determineIfSoleSponsor(clientType) {
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
    
    // Analyze existing data to determine if sole sponsor
    if (clientType === 'child') {
        // If child is buying and no parent financial involvement indicated
        const hasParentInvolvement = questionnaireData.answers['financial-health'] && 
                                    questionnaireData.answers['financial-health'] !== 'poor';
        return !hasParentInvolvement;
    }
    
    return false; // Default to joint if uncertain
}

function selectPASponsorType(button, value) {
    const buttonGroup = button.parentElement;
    buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    button.classList.add('selected');
    
    document.getElementById('pa-sponsor-type').value = value;
    postAnalysisData.primarySponsor.sponsorType = value;
    
    // Show/hide joint sponsor info
    const jointInfo = document.getElementById('joint-sponsor-info');
    if (jointInfo) {
        jointInfo.style.display = value === 'joint' ? 'block' : 'none';
    }
}

function selectPABeneficiary(button, value) {
    const buttonGroup = button.parentElement;
    buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    button.classList.add('selected');
    
    document.getElementById('pa-has-beneficiaries').value = value;
    postAnalysisData.primarySponsor.hasBeneficiaries = value;
    
    // Show/hide beneficiary info
    const beneficiaryInfo = document.getElementById('beneficiary-info');
    if (beneficiaryInfo) {
        beneficiaryInfo.style.display = value === 'yes' ? 'block' : 'none';
    }
}

function restorePASelections() {
    // Restore toggle button selections
    const toggles = {
        'pa-sponsor-type': postAnalysisData.primarySponsor.sponsorType,
        'pa-has-beneficiaries': postAnalysisData.primarySponsor.hasBeneficiaries
    };
    
    Object.entries(toggles).forEach(([id, value]) => {
        if (value) {
            const hiddenInput = document.getElementById(id);
            if (hiddenInput) {
                const buttonGroup = hiddenInput.parentElement.querySelector('.button-group');
                if (buttonGroup) {
                    buttonGroup.querySelectorAll('.toggle-btn').forEach(btn => {
                        if (btn.dataset.value === value) {
                            btn.classList.add('selected');
                        }
                    });
                }
            }
        }
    });
}

// initializeFamilyMembersStep function
function initializeFamilyMembersStep(isSoleSponsor) {
    const container = document.getElementById('family-members-container');
    
    // Clear existing content
    container.innerHTML = '';
    
    // If sole sponsor, only ask for their information
    if (isSoleSponsor) {
        const soleMember = {
            id: generateId(),
            name: '',
            relationship: 'sole_sponsor',
            age: '',
            role: 'Primary'
        };
        
        postAnalysisData.familyMembers = [soleMember];
        const memberCard = createFamilyMemberCard(soleMember, 0);
        container.appendChild(memberCard);
        
        // Add note about sole sponsorship
        const note = document.createElement('div');
        note.className = 'info-note';
        note.innerHTML = '<p>✅ As sole sponsor, only your information is required.</p>';
        container.appendChild(note);
        
        return;
    }
    
    // Joint sponsorship - initialize with existing data
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const clientType = questionnaireData.clientType;
    
    if (postAnalysisData.familyMembers.length === 0) {
        // Add default members based on client type
        let defaultMembers = [];
        
        switch(clientType) {
            case 'child':
                defaultMembers = [
                    { id: generateId(), name: '', relationship: 'child', age: '', role: 'Primary' },
                    { id: generateId(), name: '', relationship: 'parent', age: questionnaireData.answers['parent-age'] || '', role: 'Financial' }
                ];
                break;
                
            case 'parent':
                defaultMembers = [
                    { id: generateId(), name: '', relationship: 'parent', age: questionnaireData.answers['parent-age'] || '', role: 'Primary' },
                    { id: generateId(), name: '', relationship: 'child', age: '', role: 'Beneficiary' }
                ];
                break;
                
            case 'both':
                defaultMembers = [
                    { id: generateId(), name: '', relationship: 'parent', age: questionnaireData.answers['parent-age'] || '', role: 'Financial' },
                    { id: generateId(), name: '', relationship: 'child', age: '', role: 'Primary' }
                ];
                break;
        }
        
        postAnalysisData.familyMembers = defaultMembers;
    }
    
    // Render all family members
    postAnalysisData.familyMembers.forEach((member, index) => {
        const memberCard = createFamilyMemberCard(member, index);
        container.appendChild(memberCard);
    });
}

function createFamilyMemberCard(member, index) {
    const div = document.createElement('div');
    div.className = 'family-member-card';
    div.dataset.id = member.id;
    
    div.innerHTML = `
        <div class="family-member-header">
            <h4 style="margin: 0;">Family Member ${index + 1}</h4>
            <button type="button" class="remove-member" onclick="removeFamilyMember('${member.id}')">×</button>
        </div>
        
        <div class="input-group">
            <label>Full Name</label>
            <input type="text" class="member-name" value="${member.name || ''}" 
                   onchange="updateFamilyMember('${member.id}', 'name', this.value)" 
                   placeholder="Full legal name">
        </div>
        
        <div class="input-group">
            <label>Relationship to Project</label>
            <select class="member-relationship" onchange="updateFamilyMember('${member.id}', 'relationship', this.value)">
                <option value="">Select...</option>
                <option value="child" ${member.relationship === 'child' ? 'selected' : ''}>Child/Buyer</option>
                <option value="parent" ${member.relationship === 'parent' ? 'selected' : ''}>Parent/Helper</option>
                <option value="spouse" ${member.relationship === 'spouse' ? 'selected' : ''}>Spouse/Partner</option>
                <option value="sibling" ${member.relationship === 'sibling' ? 'selected' : ''}>Sibling</option>
                <option value="other" ${member.relationship === 'other' ? 'selected' : ''}>Other Family</option>
            </select>
        </div>
        
        <div class="input-group">
            <label>Age</label>
            <input type="number" class="member-age" value="${member.age || ''}" min="18" max="100"
                   onchange="updateFamilyMember('${member.id}', 'age', this.value)" 
                   placeholder="Age">
        </div>
        
        <div class="input-group">
            <label>Role in Project</label>
            <select class="member-role" onchange="updateFamilyMember('${member.id}', 'role', this.value)">
                <option value="primary" ${member.role === 'primary' ? 'selected' : ''}>Primary Decision Maker</option>
                <option value="financial" ${member.role === 'financial' ? 'selected' : ''}>Financial Contributor</option>
                <option value="beneficiary" ${member.role === 'beneficiary' ? 'selected' : ''}>Beneficiary</option>
        </div>
    `;
    
    return div;
}

function addFamilyMember() {
    const newMember = {
        id: generateId(),
        name: '',
        relationship: '',
        age: '',
        role: 'financial'
    };
    
    postAnalysisData.familyMembers.push(newMember);
    initializeFamilyMembersStep();
}

function removeFamilyMember(id) {
    postAnalysisData.familyMembers = postAnalysisData.familyMembers.filter(member => member.id !== id);
    initializeFamilyMembersStep();
}

function updateFamilyMember(id, field, value) {
    const member = postAnalysisData.familyMembers.find(m => m.id === id);
    if (member) {
        member[field] = value;
        savePostAnalysisProgress();
    }
}

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}


// Determine which financial questions are needed
function determineNeededFinancialQuestions(isSoleSponsor, selectedModels) {
    const needed = new Set();
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    
    // Basic financial questions for all
    needed.add('occupation-income');
    needed.add('current-assets');
    needed.add('existing-debt');
    needed.add('credit-rating');
    
    // Check which models are selected
    selectedModels.forEach(modelId => {
        switch(modelId) {
            case 'three-thirty':
                needed.add('current-living');
                needed.add('downpayment-saved');
                break;
                
            case 'co-investing':
                needed.add('liquid-assets');
                break;
                
            case 'multi-gen':
                needed.add('home-equity-amount');
                if (!isSoleSponsor) needed.add('liquid-assets');
                break;
                
            case 'early-inheritance':
                needed.add('liquid-assets');
                break;
                
            case 'home-equity':
                needed.add('home-equity-amount');
                break;
                
            case 'starting-early':
                needed.add('liquid-assets');
                needed.add('home-equity-amount');
                break;
        }
    });
    
    // Remove already answered questions
    needed.forEach(question => {
        if (answeredQuestions.has(question)) {
            needed.delete(question);
        }
    });
    
    console.log('Needed financial questions:', Array.from(needed));
    return Array.from(needed);
}

// Create smart financial section with only needed questions
function createSmartFinancialSection(member, index, neededQuestions) {
    const section = document.createElement('div');
    section.className = 'financial-section';
    
    // Initialize financial details for this member if not exists
    if (!postAnalysisData.financialDetails[member.id]) {
        postAnalysisData.financialDetails[member.id] = {};
    }
    
    const details = postAnalysisData.financialDetails[member.id];
    const isParent = member.relationship === 'parent' || member.relationship === 'sole_sponsor';
    
    let html = `<h4>💼 Financial Details: ${member.name || `Family Member ${index + 1}`} (${member.role})</h4>`;
    
    html += '<div class="financial-grid">';
    
    // Add all needed questions
    neededQuestions.forEach(question => {
        switch(question) {
            case 'occupation-income':
                html += `
                    <div class="input-group">
                        <label>Occupation</label>
                        <input type="text" class="financial-input" data-member="${member.id}" data-field="occupation"
                               value="${details.occupation || ''}" onchange="updateFinancialDetail(this)">
                    </div>
                    
                    <div class="input-group">
                        <label>Annual Income ($)</label>
                        <input type="number" class="financial-input" data-member="${member.id}" data-field="income"
                               value="${details.income || ''}" onchange="updateFinancialDetail(this)">
                    </div>
                `;
                break;
                
            case 'current-assets':
                html += `
                    <div class="input-group">
                        <label>Current Assets ($)</label>
                        <input type="text" class="financial-input" data-member="${member.id}" data-field="assets"
                               value="${details.assets || ''}" onchange="updateFinancialDetail(this)"
                               placeholder="Savings, investments, RRSPs/TFSAs">
                    </div>
                `;
                break;
                
            case 'existing-debt':
                html += `
                    <div class="input-group">
                        <label>Current Debts ($)</label>
                        <input type="text" class="financial-input" data-member="${member.id}" data-field="debts"
                               value="${details.debts || ''}" onchange="updateFinancialDetail(this)"
                               placeholder="Student loans, car payments, credit cards">
                    </div>
                `;
                break;
                
            case 'liquid-assets':
                if (isParent) {
                    html += `
                        <div class="input-group">
                            <label>Liquid Assets Available ($)</label>
                            <input type="number" class="financial-input" data-member="${member.id}" data-field="liquidAssets"
                                   value="${details.liquidAssets || ''}" onchange="updateFinancialDetail(this)"
                                   placeholder="Cash, stocks, accessible equity">
                        </div>
                    `;
                }
                break;
                
            case 'home-equity-amount':
                if (isParent) {
                    html += `
                        <div class="input-group">
                            <label>Home Equity Available ($)</label>
                            <input type="number" class="financial-input" data-member="${member.id}" data-field="homeEquity"
                                   value="${details.homeEquity || ''}" onchange="updateFinancialDetail(this)"
                                   placeholder="Current home equity">
                        </div>
                    `;
                }
                break;
                
            case 'current-living':
                if (!isParent) {
                    html += `
                        <div class="input-group">
                            <label>Current Monthly Rent ($)</label>
                            <input type="number" class="financial-input" data-member="${member.id}" data-field="currentRent"
                                   value="${details.currentRent || ''}" onchange="updateFinancialDetail(this)"
                                   placeholder="Monthly rent payment">
                        </div>
                    `;
                }
                break;
        }
    });
    
    html += '</div>';
    
    // Additional fields outside the grid
    if (neededQuestions.includes('credit-rating')) {
        html += `
            <div class="input-group">
                <label>Credit Rating</label>
                <select class="financial-input" data-member="${member.id}" data-field="creditRating" 
                        onchange="updateFinancialDetail(this)">
                    <option value="">Select...</option>
                    <option value="excellent" ${details.creditRating === 'excellent' ? 'selected' : ''}>Excellent (750+)</option>
                    <option value="good" ${details.creditRating === 'good' ? 'selected' : ''}>Good (680-749)</option>
                    <option value="average" ${details.creditRating === 'average' ? 'selected' : ''}>Average (620-679)</option>
                    <option value="poor" ${details.creditRating === 'poor' ? 'selected' : ''}>Poor/Repairing</option>
                </select>
            </div>
        `;
    }
    
    if (neededQuestions.includes('downpayment-saved')) {
        html += `
            <div class="input-group">
                <label>Down Payment Saved ($)</label>
                <input type="number" class="financial-input" data-member="${member.id}" data-field="downPaymentSaved"
                       value="${details.downPaymentSaved || ''}" onchange="updateFinancialDetail(this)">
            </div>
        `;
    }
    
    section.innerHTML = html;
    return section;
}

/*function createFinancialSection(member, index) {
//    const section = document.createElement('div');
//    section.className = 'financial-section';
//    
    // Initialize financial details for this member if not exists
//    if (!postAnalysisData.financialDetails[member.id]) {
//        postAnalysisData.financialDetails[member.id] = {
 //           income: '',
 //           occupation: '',
 //           creditRating: '',
  //          assets: '',
  //          debts: '',
  //          downPaymentSaved: '',
  //          monthlySavings: '',
  //          mortgagePreApproval: '',
  //          futureChanges: ''
  //      };
  //  }
    
    const details = postAnalysisData.financialDetails[member.id];
    
    section.innerHTML = `
        <h4>💼 Financial Details: ${member.name || `Family Member ${index + 1}`}</h4>
        
        <div class="financial-grid">
            <div class="input-group">
                <label>Occupation</label>
                <input type="text" class="financial-input" data-member="${member.id}" data-field="occupation"
                       value="${details.occupation || ''}" onchange="updateFinancialDetail(this)">
            </div>
            
            <div class="input-group">
                <label>Annual Income ($)</label>
                <input type="number" class="financial-input" data-member="${member.id}" data-field="income"
                       value="${details.income || ''}" onchange="updateFinancialDetail(this)">
            </div>
            
            <div class="input-group">
                <label>Credit Rating</label>
                <select class="financial-input" data-member="${member.id}" data-field="creditRating" 
                        onchange="updateFinancialDetail(this)">
                    <option value="">Select...</option>
                    <option value="excellent" ${details.creditRating === 'excellent' ? 'selected' : ''}>Excellent (750+)</option>
                    <option value="good" ${details.creditRating === 'good' ? 'selected' : ''}>Good (680-749)</option>
                    <option value="average" ${details.creditRating === 'average' ? 'selected' : ''}>Average (620-679)</option>
                    <option value="poor" ${details.creditRating === 'poor' ? 'selected' : ''}>Poor/Repairing</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Current Assets ($)</label>
                <input type="text" class="financial-input" data-member="${member.id}" data-field="assets"
                       value="${details.assets || ''}" onchange="updateFinancialDetail(this)"
                       placeholder="Savings, investments, RRSPs/TFSAs">
            </div>
            
            <div class="input-group">
                <label>Current Debts ($)</label>
                <input type="text" class="financial-input" data-member="${member.id}" data-field="debts"
                       value="${details.debts || ''}" onchange="updateFinancialDetail(this)"
                       placeholder="Student loans, car payments, credit cards">
            </div>
            
            <div class="input-group">
                <label>Down Payment Saved ($)</label>
                <input type="number" class="financial-input" data-member="${member.id}" data-field="downPaymentSaved"
                       value="${details.downPaymentSaved || ''}" onchange="updateFinancialDetail(this)">
            </div>
            
            <div class="input-group">
                <label>Monthly Savings ($)</label>
                <input type="number" class="financial-input" data-member="${member.id}" data-field="monthlySavings"
                       value="${details.monthlySavings || ''}" onchange="updateFinancialDetail(this)">
            </div>
        </div>
        
        <div class="input-group">
            <label>Mortgage Pre-Approval Amount ($)</label>
            <input type="number" class="financial-input" data-member="${member.id}" data-field="mortgagePreApproval"
                   value="${details.mortgagePreApproval || ''}" onchange="updateFinancialDetail(this)">
        </div>
        
        // In createFinancialSection function, replace the futureChanges textarea with:
        <div class="input-group">
            <label>Expected Future Changes (Next 5 Years)</label>
            <select class="financial-input" data-member="${member.id}" data-field="futureChanges" 
                    onchange="updateFinancialDetail(this)">
                <option value="">Select...</option>
                <option value="promotion" ${details.futureChanges === 'promotion' ? 'selected' : ''}>Promotion (20% salary increase at once)</option>
                <option value="salary-up" ${details.futureChanges === 'salary-up' ? 'selected' : ''}>Salary up (2% annually)</option>
                <option value="salary-down" ${details.futureChanges === 'salary-down' ? 'selected' : ''}>Salary down (2% annually)</option>
                <option value="time-off" ${details.futureChanges === 'time-off' ? 'selected' : ''}>Time off (no income for 5 years)</option>
                <option value="no-change" ${details.futureChanges === 'no-change' ? 'selected' : ''}>No significant changes</option>
                <option value="other" ${details.futureChanges === 'other' ? 'selected' : ''}>Other (specify below)</option>
            </select>
            <div id="future-change-other-${member.id}" style="${details.futureChanges === 'other' ? 'display: block;' : 'display: none;'} margin-top: 0.5rem;">
                <input type="text" class="financial-input" data-member="${member.id}" data-field="futureChangesOther"
                    value="${details.futureChangesOther || ''}" onchange="updateFinancialDetail(this)"
                    placeholder="Describe other expected changes">
            </div>
        </div>
         `;  
    
    return section;
}
        // Add this script to handle the dropdown change:
        document.querySelectorAll('select[data-field="futureChanges"]').forEach(select => {
            select.addEventListener('change', function() {
                const memberId = this.dataset.member;
                const otherDiv = document.getElementById(`future-change-other-${memberId}`);
                if (otherDiv) {
                    otherDiv.style.display = this.value === 'other' ? 'block' : 'none';
                }
            });
        });

*/
function updateFinancialDetail(element) {
    const memberId = element.dataset.member;
    const field = element.dataset.field;
    const value = element.value;
    
    if (postAnalysisData.financialDetails[memberId]) {
        postAnalysisData.financialDetails[memberId][field] = value;
        savePostAnalysisProgress();
    }
}

function initializeModelSpecificsStep() {
    console.log("InitializeModelSpecificsStep...")
    const container = document.getElementById('model-specific-questions');
    if (!container) {
        console.error('Model specific questions container not found');
        return;
    }
    container.innerHTML = '';
    
    // Get selected models from localStorage with proper validation
    let feasibleModels = [];
    let selectedModels = [];
    
    // Helper function to safely parse localStorage data
    function safelyParseLocalStorage(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            console.log(`Loading ${key} from localStorage:`, item);
            
            // If item is null or undefined, return default
            if (item === null || item === undefined || item === 'undefined' || item === 'null') {
                console.log(`${key} is null/undefined, returning default`);
                return defaultValue;
            }
            
            // If item is already an array (shouldn't happen but just in case)
            if (Array.isArray(item)) {
                console.log(`${key} is already an array`);
                return item;
            }
            
            // Try to parse as JSON
            const parsed = JSON.parse(item);
            console.log(`Parsed ${key}:`, parsed);
            
            // If parsed is null or not an array, return default
            if (!parsed || !Array.isArray(parsed)) {
                console.warn(`${key} is not an array after parsing:`, parsed);
                return defaultValue;
            }
            
            return parsed;
        } catch (error) {
            console.error(`Error parsing ${key} from localStorage:`, error);
            console.log(`Raw value was:`, localStorage.getItem(key));
            return defaultValue;
        }
    }
    
    // Load models safely
    feasibleModels = safelyParseLocalStorage('feasibleModels', []);
    selectedModels = safelyParseLocalStorage('selectedModels', []);
    
    console.log('Feasible models loaded:', feasibleModels, 'Type:', typeof feasibleModels);
    console.log('Selected models loaded:', selectedModels, 'Type:', typeof selectedModels);
    
    if (feasibleModels.length === 0 && selectedModels.length === 0) {
        container.innerHTML = '<p>No strategies selected for detailed analysis.</p>';
        return;
    }
    
    // Use feasible models if available, otherwise selected models
    const modelsToAnalyze = (feasibleModels.length > 0) ? feasibleModels : selectedModels;
    
    // Ensure it's an array
    if (!Array.isArray(modelsToAnalyze)) {
        console.error('modelsToAnalyze is not an array:', modelsToAnalyze);
        console.log('Converting to array...');
        // Try to convert to array if it's a string
        if (typeof modelsToAnalyze === 'string') {
            try {
                // Try to parse as JSON first
                const parsed = JSON.parse(modelsToAnalyze);
                modelsToAnalyze = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                // If it's a comma-separated string, split it
                modelsToAnalyze = modelsToAnalyze.split(',').map(s => s.trim()).filter(s => s);
            }
        } else if (modelsToAnalyze && typeof modelsToAnalyze === 'object') {
            // Try to convert object to array
            modelsToAnalyze = Object.keys(modelsToAnalyze);
        } else {
            // Fallback to empty array
            modelsToAnalyze = [];
        }
    }
    
    console.log("modelsToAnalyze (final):", modelsToAnalyze);
    
    // Get model-specific questions
    const modelQuestions = getModelSpecificQuestionsFromQuestionnaireMap(modelsToAnalyze);
    
    console.log('Model questions returned:', modelQuestions);
    
    if (!modelQuestions || Object.keys(modelQuestions).length === 0) {
        container.innerHTML = '<p>✅ All model-specific questions have already been answered.</p>';
        return;
    }
    
    // Create sections for each model with unanswered questions
    Object.entries(modelQuestions).forEach(([modelId, questions]) => {
        if (questions && questions.length > 0) {
            const model = MODELS[modelId];
            if (!model) return;
            
            const section = document.createElement('div');
            section.className = 'model-questions-section';
            section.innerHTML = `<h4>${model.name} - Additional Details</h4>`;
            
            questions.forEach((questionData, qIndex) => {
                if (!questionData || !questionData.question) {
                    console.warn('Invalid question data for model:', modelId, questionData);
                    return;
                }
                
                const questionDiv = document.createElement('div');
                questionDiv.className = 'pa-question-item';
                
                // Generate a unique key
                const questionKey = `model_${modelId}_q${qIndex + 1}`;
                
                // Get existing answer if any
                const existingAnswer = postAnalysisData.modelSpecificAnswers[questionKey] || 
                                      (questionData.answer ? questionData.answer.toString() : '');
                
                questionDiv.innerHTML = `
                    <div style="display: flex; align-items: start; margin-bottom: 0.5rem;">
                        <span class="question-number">${qIndex + 1}</span>
                        <strong style="flex: 1;">${questionData.question}</strong>
                    </div>
                    ${renderModelQuestionInput(questionData, questionKey, existingAnswer)}
                `;
                
                section.appendChild(questionDiv);
            });
            
            container.appendChild(section);
        }
    });
    
    // Update the instruction text
    const instruction = document.getElementById('model-specifics-instruction');
    if (instruction) {
        const totalQuestions = Object.values(modelQuestions).reduce((sum, q) => sum + (q ? q.length : 0), 0);
        instruction.textContent = `Please answer the following ${totalQuestions} model-specific questions for more accurate analysis.`;
    }
    
    console.log('Model specifics initialized:', modelQuestions);
}

function getModelSpecificQuestionsFromQuestionnaireMap(modelsInput) {
    console.log('Getting model specific questions for input:', modelsInput, 'Type:', typeof modelsInput);
    
    // Convert input to array if it's not already
    let selectedModels = [];
    
    if (Array.isArray(modelsInput)) {
        selectedModels = modelsInput;
    } else if (typeof modelsInput === 'string') {
        // If it's a single model ID string, wrap it in an array
        selectedModels = [modelsInput];
    } else if (modelsInput !== null && modelsInput !== undefined) {
        // Try to convert to array for other types
        console.warn('Unexpected input type, attempting to convert to array:', typeof modelsInput, modelsInput);
        if (typeof modelsInput === 'object') {
            selectedModels = Object.keys(modelsInput);
        } else {
            selectedModels = [String(modelsInput)];
        }
    }
    
    console.log('Processed selectedModels array:', selectedModels);
    
    // If empty array, return empty object
    if (selectedModels.length === 0) {
        console.log('No models to analyze, returning empty object');
        return {};
    }
    
    // Map of model IDs to their specific question keys from QUESTIONNAIRE_MAP
    const modelQuestionMap = {
        'three-thirty': [
            'current-living-situation' // Q16: Current living situation and rent payment
        ],
        'co-investing': [
            'gifting-repayment',        // Q18: Gifting with repayment expectation
            'formal-agreement',         // Q19: Formal agreement preparation
            'discussed-amount',         // Q20: Discussed amount
            'interest-expectation',     // Q21: Interest rate expectation
            'no-repayment-possibility'  // Q22: No repayment possibility
        ],
        'multi-gen': [
            'existing-rental-suite',    // Q35: Existing rental suite
            'laneway-possibility',      // Q36: Laneway possibility
            'living-together-openness', // Q37: Openness to living together
            'willing-add-suite',        // Q38: Willingness to add suite
            'living-timeframe',         // Q39: Living timeframe
            'current-occupants',        // Q40: Current occupants
            'renovation-contribution',  // Q41: Renovation contribution
            'renovation-payment',       // Q42: Renovation payment
            'potential-conflicts'       // Q43: Potential conflicts
        ],
        'early-inheritance': [
            'early-inheritance-openness',   // Q30: Early inheritance openness
            'siblings-early-inheritance',   // Q31: Siblings early inheritance
            'siblings-past-assistance',     // Q32: Siblings past assistance
            'parents-comfort'               // Q33: Parents comfort
        ],
        'home-equity': [
            'reverse-mortgage-understanding', // Q23: Reverse mortgage understanding
            'home-equity-amount',             // Q24: Amount of significant home equity
            'home-equity',                   // Q25: Home equity details
            'no-monthly-payments',           // Q26: No monthly payments
            'payment-responsibility',        // Q27: Payment responsibility
            'siblings-feelings',              // Q28: Siblings feelings
            'inheritance-conversations',    // Q29: Inheritance conversations
        ]
    };
    
    const modelQuestions = {};
    
    // Get questionnaire data to check if questions are already answered
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
    
    console.log('Questionnaire data:', questionnaireData);
    console.log('Model inputs:', modelInputs);
    
    selectedModels.forEach(modelId => {
        const questionKeys = modelQuestionMap[modelId];
        if (!questionKeys || !Array.isArray(questionKeys)) {
            console.warn(`No question keys found for model: ${modelId}`);
            return; // Skip this model
        }
        
        const unansweredQuestions = [];
        
        questionKeys.forEach(questionKey => {
            const questionData = QUESTIONNAIRE_MAP[questionKey];
            if (!questionData) {
                console.warn(`Question key not found in QUESTIONNAIRE_MAP: ${questionKey}`);
                return;
            }
            
            // Check if this question was already answered in the matchmaker questionnaire
            const alreadyAnswered = questionnaireData.answers && 
                                   questionnaireData.answers[questionKey] !== undefined && 
                                   questionnaireData.answers[questionKey] !== null && 
                                   questionnaireData.answers[questionKey] !== '';
            
            // Check if this question was answered in model inputs
            const modelInputKey = mapQuestionKeyToModelInput(modelId, questionKey);
            const answeredInModel = modelInputs[modelId] && modelInputs[modelId][modelInputKey] && 
                                   modelInputs[modelId][modelInputKey] !== '';
            
            console.log(`Checking ${questionKey} for model ${modelId}: alreadyAnswered=${alreadyAnswered}, answeredInModel=${answeredInModel}, modelInputKey=${modelInputKey}`);
            
            if (!alreadyAnswered && !answeredInModel) {
                unansweredQuestions.push({
                    question: questionData.description || getQuestionTextFromKey(questionKey),
                    type: determineQuestionType(questionKey),
                    options: getQuestionOptions(questionKey),
                    placeholder: getQuestionPlaceholder(questionKey),
                    pdfId: questionData.pdfId,
                    questionKey: questionKey,
                    answer: alreadyAnswered ? questionnaireData.answers[questionKey] : 
                            (answeredInModel ? modelInputs[modelId][modelInputKey] : '')
                });
            }
        });
        
        if (unansweredQuestions.length > 0) {
            modelQuestions[modelId] = unansweredQuestions;
        }
    });
    
    console.log('Model questions found:', modelQuestions);
    return modelQuestions;
}

function mapQuestionKeyToModelInput(modelId, questionKey) {
    // Map questionnaire question keys to model input field names
    const mapping = {
        'three-thirty': {
            'current-living-situation': 'tt-current-living'
        },
        'co-investing': {
            'gifting-repayment': 'ci-gifting',
            'formal-agreement': 'ci-formal-agreement',
            'discussed-amount': 'ci-discussed-amount',
            'interest-expectation': 'ci-interest-expectation',
            'no-repayment-possibility': 'ci-no-repayment'
        },
        'multi-gen': {
            'existing-rental-suite': 'mg-existing-suite',
            'laneway-possibility': 'mg-laneway-possible',
            'living-together-openness': 'mg-living-openness',
            'willing-add-suite': 'mg-willing-add-suite',
            'living-timeframe': 'mg-living-timeframe',
            'current-occupants': 'mg-current-occupants',
            'renovation-contribution': 'mg-renovation-contribution',
            'renovation-payment': 'mg-renovation-payment',
            'potential-conflicts': 'mg-potential-conflicts'
        },
        'early-inheritance': {
            'inheritance-conversations': 'ei-inheritance-conversations',
            'early-inheritance-openness': 'ei-early-inheritance-openness',
            'siblings-early-inheritance': 'ei-siblings-early-inheritance',
            'siblings-past-assistance': 'ei-siblings-past-assistance',
            'parents-comfort': 'ei-parents-comfort'
        },
        'home-equity': {
            'reverse-mortgage-understanding': 'he-reverse-mortgage-understanding',
            'home-equity': 'he-home-equity-details',
            'no-monthly-payments': 'he-no-monthly-payments',
            'payment-responsibility': 'he-payment-responsibility',
            'siblings-feelings': 'he-siblings-feelings'
        }
    };
    
    return mapping[modelId] && mapping[modelId][questionKey] ? mapping[modelId][questionKey] : '';
}

function getQuestionTextFromKey(questionKey) {
    // Default question texts based on question keys
    const questionTexts = {
        'current-living-situation': 'Where do you currently live, what do you live in and what rent are you paying monthly?',
        'gifting-repayment': 'Are your parents or other family members open to the idea of "gifting" you a portion of the down payment with the expectation of being paid back with interest in the future?',
        'formal-agreement': 'Would you prefer a formal agreement for any financial assistance?',
        'discussed-amount': 'Have you discussed specific amounts with family members?',
        'interest-expectation': 'What interest rate have you agreed upon?',
        'no-repayment-possibility': 'Is there a possibility of the loan not being repaid?',
        'existing-rental-suite': 'Do you currently have an existing rental suite?',
        'laneway-possibility': 'Is a laneway house possible on your property?',
        'living-together-openness': 'How open are you to living together?',
        'willing-add-suite': 'Are you willing to add a rental suite?',
        'living-timeframe': 'What is the expected timeframe for living arrangement?',
        'current-occupants': 'Who are the current occupants of the property?',
        'renovation-contribution': 'How would renovation costs be contributed?',
        'renovation-payment': 'How would renovation payments be structured?',
        'potential-conflicts': 'Are there any potential conflicts to consider?',
        'inheritance-conversations': 'Have you had inheritance conversations?',
        'early-inheritance-openness': 'Are you open to early inheritance?',
        'siblings-early-inheritance': 'How would siblings feel about early inheritance?',
        'siblings-past-assistance': 'Have siblings received past assistance?',
        'parents-comfort': 'Are parents comfortable with this arrangement?',
        'reverse-mortgage-understanding': 'Do you understand reverse mortgages?',
        'home-equity': 'How much home equity is available?',
        'no-monthly-payments': 'Are you comfortable with no monthly payments?',
        'payment-responsibility': 'Who will be responsible for payments?',
        'siblings-feelings': 'How would siblings feel about this arrangement?'
    };
    
    return questionTexts[questionKey] || `Question about ${questionKey}`;
}

function determineQuestionType(questionKey) {
    // Determine question type based on content
    if (questionKey.includes('amount') || questionKey.includes('payment')) {
        return 'text';
    } else if (questionKey.includes('openness') || questionKey.includes('comfort') || 
               questionKey.includes('understanding') || questionKey.includes('possibility') ||
               questionKey.includes('agreement') || questionKey.includes('feelings')) {
        return 'select';
    } else if (questionKey.includes('timeframe')) {
        return 'select';
    } else {
        return 'textarea';
    }
}

function getQuestionOptions(questionKey) {
    // Provide options for select questions
    if (questionKey.includes('openness') || questionKey.includes('comfort') || 
        questionKey.includes('understanding') || questionKey.includes('possibility') ||
        questionKey.includes('agreement') || questionKey.includes('feelings')) {
        return ['Yes', 'No', 'Unsure', 'Not discussed'];
    } else if (questionKey.includes('timeframe')) {
        return ['Less than 5 years', '5-10 years', '10-15 years', '15+ years', 'Not sure'];
    }
    return [];
}

function getQuestionPlaceholder(questionKey) {
    if (questionKey.includes('amount')) {
        return 'Enter the amount...';
    } else if (questionKey.includes('payment')) {
        return 'Describe payment structure...';
    } else {
        return 'Please provide details...';
    }
}

function renderModelQuestionInput(questionData, key, existingValue) {
    console.log('Rendering question:', questionData.type, key);
    
    let html = '';
    
    switch(questionData.type) {
        case 'textarea':
            html = `
                <textarea class="model-question-input" data-key="${key}" 
                    onchange="updateModelAnswer('${key}', this.value)"
                    placeholder="${questionData.placeholder || 'Please provide details...'}"
                    style="width: 100%; min-height: 80px; padding: 0.5rem; margin-top: 0.5rem;">${existingValue || ''}</textarea>
            `;
            break;
            
        case 'select':
            let optionsHTML = '<option value="">Select...</option>';
            if (questionData.options && Array.isArray(questionData.options)) {
                questionData.options.forEach(option => {
                    const selected = existingValue === option ? 'selected' : '';
                    optionsHTML += `<option value="${option}" ${selected}>${option}</option>`;
                });
            }
            html = `
                <select class="model-question-input" data-key="${key}" 
                    onchange="updateModelAnswer('${key}', this.value)"
                    style="width: 100%; padding: 0.5rem; margin-top: 0.5rem;">${optionsHTML}</select>
            `;
            break;
            
        case 'text':
            html = `
                <input type="text" class="model-question-input" data-key="${key}" 
                    value="${existingValue || ''}" 
                    onchange="updateModelAnswer('${key}', this.value)"
                    placeholder="${questionData.placeholder || 'Enter details...'}"
                    style="width: 100%; padding: 0.5rem; margin-top: 0.5rem;">
            `;
            break;
            
        default:
            html = `
                <textarea class="model-question-input" data-key="${key}" 
                    onchange="updateModelAnswer('${key}', this.value)"
                    placeholder="Please provide details..."
                    style="width: 100%; min-height: 80px; padding: 0.5rem; margin-top: 0.5rem;">${existingValue || ''}</textarea>
            `;
    }
    
    return html;
}

function updateModelAnswer(key, value) {
    postAnalysisData.modelSpecificAnswers[key] = value;
    savePostAnalysisProgress();
}

function nextPAStep(step) {
    console.log(`Moving from step ${currentPAStep} to step ${step}`);
    // Save current step progress
    savePostAnalysisProgress();
    
    // Hide current step
    const currentStep = document.getElementById(`pa-step-${currentPAStep}`);
    if (currentStep) {
        currentStep.classList.remove('active');
    }
    
    // Show next step
    const nextStep = document.getElementById(`pa-step-${step}`);
    if (nextStep) {
        nextStep.classList.add('active');
    }
    
    // Update progress
    currentPAStep = step;
    updatePAProgressBar(step);
    updatePAStepIndicators(step);
    
    // Re-initialize step content based on the step we're moving to
    initializeStepContent(step);

    // Scroll to top of modal
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
    
    // If this is step 5, update review summary
    if (step === 5) {
        updateReviewSummary();
    }
}

function prevPAStep(step) {
    console.log(`Moving back from step ${currentPAStep} to step ${step}`);

    // Save current step progress before leaving (optional but good practice)
    savePostAnalysisProgress();

    // Hide current step
    const currentStep = document.getElementById(`pa-step-${currentPAStep}`);
    if (currentStep) {
        currentStep.classList.remove('active');
    }
    
    // Show previous step
    const prevStep = document.getElementById(`pa-step-${step}`);
    if (prevStep) {
        prevStep.classList.add('active');
    }
    
    // Update progress
    currentPAStep = step;
    updatePAProgressBar(step);
    updatePAStepIndicators(step);
    
    // Re-initialize step content based on the step we're moving to
    initializeStepContent(step);

    // Scroll to top
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
}

// New function to initialize step content dynamically
function initializeStepContent(step) {
    console.log(`Initializing content for step ${step}`);
    
    switch(step) {
        case 1:
            // Step 1: Primary sponsor - already initialized
            break;
        case 2:
            // Step 2: Other sponsors - refresh in case new sponsors were added
            initializeOtherSponsorsStep();
            break;
        case 3:
            // Step 3: Financial details - regenerate with latest sponsor data
            initializeFinancialDetailsStep();
            break;
        case 4:
            // Step 4: Model specifics - regenerate with latest data
            initializeModelSpecificsStep();
            break;
        case 5:
            // Step 5: Review - update summary
            updateReviewSummary();
            break;
    }
}

function updatePAProgressBar(step) {
    const percentage = (step / 5) * 100;
    const progressFill = document.getElementById('post-analysis-progress');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
}

function updatePAStepIndicators(activeStep) {
    document.querySelectorAll('.questionnaire-progress .step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === activeStep) {
            step.classList.add('active');
        }
    });
}

function updateReviewSummary() {
    const container = document.getElementById('review-summary-content');
    if (!container) return;
    
    let html = `
        <div style="margin-bottom: 1rem;">
            <strong>Project Sponsor:</strong> ${postAnalysisData.primarySponsor.name || 'Not specified'}
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Family Members:</strong> ${postAnalysisData.otherSponsors.length} registered
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Financial Details:</strong> Complete for ${Object.keys(postAnalysisData.financialDetails).length} members
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Model-Specific Questions:</strong> ${Object.keys(postAnalysisData.modelSpecificAnswers).length} answered
        </div>
        
        <div style="background: #e8f4fc; padding: 1rem; border-radius: 4px; margin-top: 1rem;">
            <small>Once submitted, a complete 50-question PDF will be generated and emailed to LW Financial for professional review.</small>
        </div>
    `;
    
    container.innerHTML = html;
}

function savePostAnalysisProgress() {
    postAnalysisData.lastSaved = new Date().toISOString();
    localStorage.setItem('postAnalysisData', JSON.stringify(postAnalysisData));
}

// Update the submit function to use enhanced analysis
function submitPostAnalysis() {
    const consentEmail = document.getElementById('consent-email').checked;
    
    
    if (!consentEmail) {
        alert('Please consent to email the questionnaire to LW Financial to proceed.');
        return;
    }
    
    // Mark as completed
    postAnalysisData.completed = true;
    postAnalysisData.submittedAt = new Date().toISOString();
    
    // Save final data
    savePostAnalysisProgress();
    
    // Generate and show the 50-question PDF content
    const completeQuestionnaire = generateComplete50Questionnaire();
    showQuestionnaireToUser(completeQuestionnaire);
    
    // Close modal
    closePostAnalysisModal();
    
     // Enable print button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.disabled = false;
        printBtn.textContent = '📄 Print Final Report';
    }
    
    const paBtn = document.getElementById('post-analysis-btn');
    if (paBtn) {
        paBtn.innerHTML = '✅ Full Financial Check Completed';
        paBtn.style.backgroundColor = '#2ecc71';
        paBtn.disabled = true;
    }
    
    // Show success message
    alert('✅ Full Financial Check Completed!\n\nYour detailed information has been saved.\nThe complete questionnaire is ready for printing.');
}

// Enhanced winner determination with detailed scoring
function determineEnhancedWinner(enhancedResults) {
    let bestScore = -Infinity;
    let bestModel = null;
    
    Object.entries(enhancedResults).forEach(([modelId, result]) => {
        // Enhanced scoring formula
        const normalizedBenefit = (result.netBenefit || 0) / 1000000; // Scale to millions
        const riskPenalty = (5 - (result.risk || 3)) * 0.15; // Lower risk = higher score
        const successBonus = (result.successProbability || 50) / 100 * 0.25;
        const timePenalty = (result.timeToHome || 0) * 0.1; // Longer time = lower score
        
        const score = (normalizedBenefit * 0.5) + 
                     (riskPenalty * 0.2) + 
                     (successBonus * 0.25) - 
                     (timePenalty * 0.05);
        
        console.log(`${modelId} Score: ${score} (Benefit: ${normalizedBenefit}, Risk: ${riskPenalty}, Success: ${successBonus}, Time: ${timePenalty})`);
        
        if (score > bestScore) {
            bestScore = score;
            bestModel = modelId;
        }
    });
    
    return bestModel;
}

function showQuestionnaireToUser(content) {
    // Create a new window/tab with the questionnaire content
    const questionnaireWindow = window.open('', '_blank');
    questionnaireWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>LW Financial - Complete Questionnaire</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                .question { margin-bottom: 1.5rem; border-left: 3px solid #3498db; padding-left: 10px; }
                .question-number { font-weight: bold; color: #2c3e50; }
                .question-text { margin: 5px 0; }
                .answer { color: #2ecc71; font-weight: bold; }
                .section { margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
                .header { background: #2c3e50; color: white; padding: 1rem; margin-bottom: 2rem; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>LW Financial - Complete Questionnaire</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>This questionnaire will be emailed to: zianw@hotmail.com</p>
            </div>
            <div id="content">${content}</div>
            <script>
                window.print();
            </script>
        </body>
        </html>
    `);
    questionnaireWindow.document.close();
}

// Enhanced report generation
function generateComplete50Questionnaire() {
    // Get all data sources
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
    const enhancedInputs = JSON.parse(localStorage.getItem('enhancedModelInputs') || '{}');
    const selectedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');
    const feasibleModels = JSON.parse(localStorage.getItem('feasibleModels') || '[]');
    const PAQuestionData = JSON.parse(localStorage.getItem('postAnalysisData') || '[]');
    
// Data validation checks
    console.log("local storage items: " + Object.keys(localStorage));
    console.group("📊 Data Source Validation:");
    console.log(questionnaireData['clientType']);
    console.log(questionnaireData['answers']);
    console.log(questionnaireData['strategyRatings']);
    console.log(questionnaireData['modelScores']);
                
        
    console.log("questionnaireData keys:", Object.keys(questionnaireData));
    console.log("modelInputs exists:");
        Object.keys(modelInputs).forEach(category => {
            if (modelInputs[category].length > 0) {
                console.log(`  ${category}: ${modelInputs[category].length} answers`);
                Object.values(modelInputs[category]).forEach(answer => {
                    console.log(`    ${answer}`);
                });
            }
        });    
    console.log("modelInputs keys:", !!modelInputs.keys);
    console.log("enhancedInputs exists:");
        Object.keys(enhancedInputs).forEach(category => {
            if (enhancedInputs[category].length > 0) {
                console.log(`  ${category}: ${enhancedInputs[category].length} answers`);
                Object.values(enhancedInputs[category]).forEach(answer => {
                    console.log(`    ${answer}`);
                });
            }
        });  
    console.log("enhancedInputs keys:", Object.keys(enhancedInputs));
    console.log("selectedModels:", selectedModels);
    console.log("feasibleModels:", feasibleModels);
    console.log("postAnalysisData exists:", !!postAnalysisData);
    console.log("postAnalysisData completed:", postAnalysisData.completed || false);
    console.groupEnd();
    let content = '';
    let questionNumber = 1;
    
    // Section 1: General Questions For Family
    content += `<div class="section"><h2>General Questions For Family</h2>`;
    
    // Q1: Who is wanting to buy the home?
    content += generateQuestionWithAnswer(
        questionNumber++,
        "Who is wanting to buy the home? You or your adult children?",
        getSponosrAgesAnswer()
    );
    
    // Q2: Approximate ages
    content += generateQuestionWithAnswer(
        questionNumber++,
        "What is the approximate ages of each of parents or family member willing to help?",
        getFamilyAgesAnswer()
    );
    
    // Q3: Financial health
    content += generateQuestionWithAnswer(
        questionNumber++,
        "How would you describe the current financial health of the parents or any other family members who might be involved?",
        getAnswerForQuestion('financial-health', questionnaireData.answers)
    );
    
    // Q4: Family members willing to help
    content += generateQuestionWithAnswer(
        questionNumber++,
        "Please list any family members who might be willing to help, provide a description of their current financial situation, and state your reasons why you think they might be willing to help you.",
        getWillingFamilyMembersAnswer()
    );
    
    content += `</div>`;
    
    // Check for long-term planning (Child Under 18)
   if (questionnaireData.answers && questionnaireData.answers['child-age-range'] === 'under18') {
    content += `<div class="section"><h2>Long-term Planning Questions (Child Under 18)</h2>`;
    
    // Collect all long-term questions from all models
    const allLongTermQuestions = {};
    
    // Check each model for long-term questions
    const modelsToCheck = feasibleModels.length > 0 ? feasibleModels : selectedModels;
    modelsToCheck.forEach(modelId => {
        const inputs = modelInputs[modelId] || {};
        
        // Define which long-term questions belong to which model
        const longTermKeys = [];
        
        switch(modelId) {
            case 'co-investing':
                longTermKeys.push('ci-real-estate-priority');
                break;
            case 'home-equity':
                longTermKeys.push('he-leverage-amount');
                break;
            case 'early-inheritance':
                longTermKeys.push('ei-retirement-impact');
                break;
        }
        
        // Add general long-term questions for each model
        const generalKeys = [
            `${modelId}-primary-goal`,
            `${modelId}-rental-experience`,
            `${modelId}-landlord-comfort`,
            `${modelId}-current-saving-assets`
        ];
        
        longTermKeys.push(...generalKeys);
        
        // Check each key for answers
        longTermKeys.forEach(key => {
            if (inputs[key] && inputs[key] !== '') {
                // Map question keys to readable text
                const questionMap = {
                    'ci-real-estate-priority': 'Are you willing to prioritize a real estate-focused investment strategy over traditional stock assets to help your child purchase a home in the future?',
                    'he-leverage-amount': 'Do you currently have home equity you would be willing to leverage to buy another property? If so, how much?',
                    'ei-retirement-impact': 'Would purchasing a property with the intention of gifting it to your child negatively affect your own financial retirement goals?',
                    'primary-goal': 'What is your primary financial goal for your child right now?',
                    'rental-experience': 'Do you have any experience investing in rental real estate?',
                    'landlord-comfort': 'Are you comfortable with the responsibilities of being a landlord?',
                    'current-saving-assets': 'Are you currently saving or investing specifically for your child\'s future?'
                };
                
                // Extract the base key without model prefix
                let baseKey = key;
                if (key.includes('-')) {
                    const parts = key.split('-');
                    if (parts.length > 1) {
                        baseKey = parts.slice(1).join('-');
                    }
                }
                
                const questionText = questionMap[baseKey] || `Question about ${baseKey}`;
                const answer = inputs[key];
                
                // Only add if we haven't already added this question
                if (!allLongTermQuestions[questionText]) {
                    allLongTermQuestions[questionText] = answer;
                } else if (allLongTermQuestions[questionText] !== answer) {
                    // If different answers exist, note the difference
                    allLongTermQuestions[questionText] = `${allLongTermQuestions[questionText]} (Also answered differently in ${modelId}: ${answer})`;
                }
            }
        });
    });
    
    // Also check postAnalysisData for long-term answers
    if (postAnalysisData.modelSpecificAnswers) {
        Object.entries(postAnalysisData.modelSpecificAnswers).forEach(([key, value]) => {
            if (key.includes('long-term') || key.includes('primary-goal') || 
                key.includes('rental-experience') || key.includes('landlord-comfort') ||
                key.includes('saving-assets')) {
                
                const questionMap = {
                    'long-term-q1': 'What is your primary financial goal for your child right now: a future down payment for a home or funding their post-secondary education?',
                    'long-term-q2': 'Are you willing to prioritize a real estate-focused investment strategy over traditional stock assets to help your child purchase a home in the future?',
                    'long-term-q3': 'Do you currently have home equity you would be willing to leverage to buy another property? If so, how much?',
                    'long-term-q4': 'Do you have any experience investing in rental real estate?',
                    'long-term-q5': 'Would purchasing a property with the intention of gifting it to your child negatively affect your own financial retirement goals?',
                    'long-term-q6': 'Are you comfortable with the responsibilities of being a landlord?',
                    'long-term-q7': 'Are you currently saving or investing specifically for your child\'s future, and if so, what type of assets?'
                };
                
                const questionText = questionMap[key] || `Question: ${key}`;
                if (value && value !== '') {
                    allLongTermQuestions[questionText] = value;
                }
            }
        });
    }
    
    // Generate the long-term questions in the report
    Object.entries(allLongTermQuestions).forEach(([question, answer], index) => {
        content += generateQuestionWithAnswer(
            questionNumber++,
            question,
            answer || 'Not answered'
        );
    });
    
    content += `</div>`;
}


    
    // Section 2: General Questions for the People looking to buy
    content += `<div class="section"><h2>General Questions for the People looking to buy</h2>`;
    
    // Generate questions for each sponsor
        const allSponsors = [];

        // Add primary sponsor
        if (postAnalysisData.primarySponsor && Object.keys(postAnalysisData.primarySponsor).length > 0) {
            allSponsors.push({ ...postAnalysisData.primarySponsor, type: 'primary', index: 0 });
        }

        // Add other sponsors
        if (postAnalysisData.otherSponsors && Array.isArray(postAnalysisData.otherSponsors)) {
            postAnalysisData.otherSponsors.forEach((sponsor, index) => {
                allSponsors.push({ ...sponsor, type: 'other', index: index });
            });
        }

        // Generate questions for each sponsor
        allSponsors.forEach((sponsor, sponsorIndex) => {
            const detailsKey = sponsor.type === 'primary' ? 'primary' : `other-${sponsor.index}`;
            const details = postAnalysisData.financialDetails && postAnalysisData.financialDetails[detailsKey];
            content += `<div><h3>${detailsKey}</h3> Client: </div>`
            // Q5: Names and ages
            let age = sponsor.age;
            if (!age && sponsor.dob) {
                age = calculateAgeFromDOB(sponsor.dob);
            }
            content += generateQuestionWithAnswer(
                questionNumber++,
                `What are your name(s) and your current age(s)?`,
                `${sponsor.name || 'Not specified'}, Age: ${age || 'Not specified'}`
            );
            
            // Q6: Occupation and income
            content += generateQuestionWithAnswer(
                questionNumber++,
                `What are your occupations and incomes?`,
                `${details ? (details.occupation || 'Not specified') : 'Not specified'}, Income: $${formatCurrency(details ? details.income : '')}`
            );
            // Q7: Credit rating
            content += generateQuestionWithAnswer(
                questionNumber++,
                `How would you describe your credit rating?`,
                details.creditRating || getAnswerForQuestion('credit', questionnaireData.answers) || 'Not specified'
            );
            
            // Q8: Current assets
            content += generateQuestionWithAnswer(
                questionNumber++,
                `Please list current assets and amounts`,
                details.assets || 'Not specified'
            );
            
            // Q9: Existing debt
            content += generateQuestionWithAnswer(
                questionNumber++,
                `Do you have any existing debt? If so, list them and each of the total amounts?`,
                details.debts || 'None specified'
            );
            
            // Q10: Down payment saved
            content += generateQuestionWithAnswer(
                questionNumber++,
                `What is the current amount you have saved for a down payment, and what is the current monthly amount you are saving towards it?`,
                `Saved: $${formatCurrency(details.downPaymentSaved)}, Monthly: $${formatCurrency(details.monthlySavings)}`
            );
            
            // Q11: Mortgage pre-approval
            content += generateQuestionWithAnswer(
                questionNumber++,
                `Are you pre-approved for a mortgage? If so, what is the maximum amount?`,
                details.mortgagePreApproval ? `$${formatCurrency(details.mortgagePreApproval)}` : 'Not pre-approved'
            );
            
            // Q12: Future changes
            content += generateQuestionWithAnswer(
                questionNumber++,
                `Do you foresee any changes within the next 5 years?`,
                details.futureChanges || 'No significant changes'
            );
        });
    
    
    // Q13: Ideal timeline
    content += `<div><h3>Other General Questions: </h3></div>`
    content += generateQuestionWithAnswer(
        questionNumber++,
        "What is your ideal timeline for purchasing a home?",
        getAnswerForQuestion('timeline', questionnaireData.answers) || 'Not specified'
    );
    
    // Q14: Rental property interest
    content += generateQuestionWithAnswer(
        questionNumber++,
        "Are you open to buying a property to rent out, and not live in, with the intention of entering the housing market faster while continuing to live elsewhere?",
        getRentalInterestAnswer()
    );
    
    // Q15: Children plans
    content += generateQuestionWithAnswer(
        questionNumber++,
        "If you have children, what are their ages? In the future, how many are you hoping to have in total, and what is your time frame?",
        getChildrenPlansAnswer()
    );
    
    // Q16: Current living situation
    content += generateQuestionWithAnswer(
        questionNumber++,
        "Where do you currently live, what do you live in and what rent are you paying monthly?",
        getCurrentLivingAnswer()
    );
    
    // Q17: Family proximity importance
    content += generateQuestionWithAnswer(
        questionNumber++,
        "Where do your parents live in relation to you, and how important is it for them to have you and future kids live close to them?",
        getAnswerForQuestion('proximity', questionnaireData.answers) || 'Not specified'
    );
    
    content += `</div>`;
    
    // Generate model-specific questions for selected models
    const modelsToShow = feasibleModels.length > 0 ? feasibleModels : selectedModels;
    
    modelsToShow.forEach(modelId => {
        const model = MODELS[modelId];
        if (!model) return;
        
        content += `<div class="section"><h2>${model.name} Strategy Questions</h2>`;
        
    // Get questions for this specific model
    const modelQuestions = getModelSpecificQuestionsFromQuestionnaireMap(modelId);
    
    // modelQuestions should be an object with the modelId as key
    // For example: { 'co-investing': [...] }
    if (modelQuestions && modelQuestions[modelId]) {
        const questionsArray = modelQuestions[modelId];
        
        questionsArray.forEach((q, qIndex) => {
            if (!q || !q.question) return;
            
            const key = `model_${modelId}_q${qIndex + 1}`;
            let answer = postAnalysisData.modelSpecificAnswers[key] || 
                        (q.answer ? q.answer.toString() : '');
            
            // If still not found, try other sources
            if (!answer || answer === '') {
                // Try questionnaire data
                if (questionnaireData.answers && questionnaireData.answers[q.questionKey]) {
                    answer = questionnaireData.answers[q.questionKey];
                }
                
                // Try model inputs
                if (!answer || answer === '') {
                    const modelInputKey = mapQuestionKeyToModelInput(modelId, q.questionKey);
                    if (modelInputs[modelId] && modelInputs[modelId][modelInputKey]) {
                        answer = modelInputs[modelId][modelInputKey];
                    }
                }
            }
            
            content += generateQuestionWithAnswer(
                questionNumber++,
                q.question,
                formatAnswerForDisplay(answer || 'Not answered', q.type)
            );
        });
    } else {
        content += `<p>No specific questions found for this strategy.</p>`;
    }
    
    content += `</div>`;
});
    
    // Add enhanced analysis results
    const enhancedResults = JSON.parse(localStorage.getItem('enhancedModelResults') || '{}');
    const winningModel = determineEnhancedWinner(enhancedResults);
    
    if (winningModel) {
        const result = enhancedResults[winningModel];
        content += `<div class="section"><h2>Enhanced Analysis Results</h2>`;
        content += `
            <div style="background: #e8f4fc; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                <h3>🏆 Enhanced Recommendation</h3>
                <p><strong>Strategy:</strong> ${MODELS[winningModel].name}</p>
                <p><strong>Net Benefit (30 years):</strong> $${formatCurrency(result.netBenefit)}</p>
                <p><strong>Risk Level:</strong> ${getRiskLabel(result.risk)}</p>
                <p><strong>Time to Home Ownership:</strong> ${result.timeToHome || 0} years</p>
                ${result.successProbability ? `<p><strong>Success Probability:</strong> ${result.successProbability}%</p>` : ''}
            </div>
        `;
        content += `</div>`;
    }
    
    return content;
}

// Helper functions for answer retrieval
function getAnswerForQuestion(questionKey, data) {
    if (!data) return 'Not specified';
    
    if (typeof data === 'object') {
        return data[questionKey] || 'Not specified';
    }
    
    return data || 'Not specified';
}

function getSponosrAgesAnswer() {
    // Use sponsors instead of familyMembers
    const sponsors = [];
    
    // Add primary sponsor if exists
    if (postAnalysisData.primarySponsor && postAnalysisData.primarySponsor.name) {
        const age = postAnalysisData.primarySponsor.age || 
                   (postAnalysisData.primarySponsor.dob ? calculateAgeFromDOB(postAnalysisData.primarySponsor.dob) : 'Not specified');
        sponsors.push(`${postAnalysisData.primarySponsor.name}: ${age}`);
    }
    
    return sponsors.length > 0 ? sponsors.join('; ') : 'Not specified';
}

function getFamilyAgesAnswer() {
    // Use sponsors instead of familyMembers
    const sponsors = [];
    
    // Add other sponsors
    if (postAnalysisData.otherSponsors && Array.isArray(postAnalysisData.otherSponsors)) {
        postAnalysisData.otherSponsors.forEach(sponsor => {
            if (sponsor.name) {
                const age = sponsor.age || (sponsor.dob ? calculateAgeFromDOB(sponsor.dob) : 'Not specified');
                sponsors.push(`${sponsor.name}: ${age}`);
            }
        });
    }
    
    return sponsors.length > 0 ? sponsors.join('; ') : 'Not specified';
}

// Helper function to calculate age from DOB
function calculateAgeFromDOB(dobString) {
    if (!dobString) return 'Unknown';
    try {
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    } catch (e) {
        return 'Unknown';
    }
}

function getWillingFamilyMembersAnswer() {
    const willing = [];
    
    // Primary sponsor
    if (postAnalysisData.primarySponsor && postAnalysisData.primarySponsor.name) {
        const details = postAnalysisData.financialDetails && postAnalysisData.financialDetails.primary;
        if (details) {
            willing.push(`${postAnalysisData.primarySponsor.name} (Primary): Income $${formatCurrency(details.income)}, Assets $${formatCurrency(details.assets)}`);
        }
    }
    
    // Other sponsors
    if (postAnalysisData.otherSponsors && Array.isArray(postAnalysisData.otherSponsors)) {
        postAnalysisData.otherSponsors.forEach((sponsor, index) => {
            if (sponsor.name) {
                const details = postAnalysisData.financialDetails && postAnalysisData.financialDetails[`other-${index}`];
                if (details) {
                    willing.push(`${sponsor.name} (${sponsor.relationship || 'Sponsor'}): Income $${formatCurrency(details.income)}, Assets $${formatCurrency(details.assets)}`);
                }
            }
        });
    }
    
    return willing.length > 0 ? willing.join('; ') : 'No family members identified as willing helpers';
}

// Add these missing helper functions for report generation

function getRentalInterestAnswer() {
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    
    // Check if rental property interest was answered in questionnaire
    if (questionnaireData.answers && questionnaireData.answers['rental-property-interest']) {
        return questionnaireData.answers['rental-property-interest'];
    }
    
    // Check model-specific answers
    if (postAnalysisData.modelSpecificAnswers) {
        // Check for any model that might have rental interest info
        for (const [key, value] of Object.entries(postAnalysisData.modelSpecificAnswers)) {
            if (key.includes('rental') || key.includes('rent')) {
                return value;
            }
        }
    }
    
    return 'Not specified';
}

function getChildrenPlansAnswer() {
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    
    // Check if children plans were answered in questionnaire
    if (questionnaireData.answers && questionnaireData.answers['child-age-range']) {
        return `${postAnalysisData.primarySponsor.dependents} child(ren), ${questionnaireData.answers['child-age-range']}`;
    }
    
    // Check in model-specific answers
    if (postAnalysisData.modelSpecificAnswers) {
        for (const [key, value] of Object.entries(postAnalysisData.modelSpecificAnswers)) {
            if (key.includes('child') || key.includes('kid') || key.includes('family')) {
                return value;
            }
        }
    }
    
    return 'Not specified';
}

function getCurrentLivingAnswer() {
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    
    // Check if current living situation was answered in questionnaire
    if (questionnaireData.answers && questionnaireData.answers['current-living-situation']) {
        return questionnaireData.answers['current-living-situation'];
    }
    
    // Check for sponsor living situations
    const livingSituations = [];
    
    // Primary sponsor
    if (postAnalysisData.primarySponsor && postAnalysisData.primarySponsor.living) {
        livingSituations.push(`Primary sponsor: ${postAnalysisData.primarySponsor.living}`);
    }
    
    // Other sponsors
    if (postAnalysisData.otherSponsors && Array.isArray(postAnalysisData.otherSponsors)) {
        postAnalysisData.otherSponsors.forEach((sponsor, index) => {
            if (sponsor.living) {
                livingSituations.push(`Sponsor ${index + 1}: ${sponsor.living}`);
            }
        });
    }
    
    if (livingSituations.length > 0) {
        return livingSituations.join('; ');
    }
    
    return 'Not specified';
}

function getAnswerFromModelInputs(modelId, question, questionIndex) {
    const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
    const inputs = modelInputs[modelId] || {};
    
    // First check if we have a direct answer in model-specific answers
    const key = `model_${modelId}_q${questionIndex + 1}`;
    if (postAnalysisData.modelSpecificAnswers && postAnalysisData.modelSpecificAnswers[key]) {
        return postAnalysisData.modelSpecificAnswers[key];
    }

    // Try to map question index to input field names
    const questionMapping = {
        'three-thirty': {
            0: 'tt-living-arrangement',
            1: 'tt-savings-discussed'
        },
        'co-investing': {
            0: 'ci-account-type',
            1: 'ci-agreement-discussed',
            2: 'ci-interest-rate'
        },
        'multi-gen': {
            0: 'mg-project-manager',
            1: 'mg-zoning-checked',
            2: 'mg-timeline'
        },
        'early-inheritance': {
            0: 'ei-lawyer-consulted',
            1: 'ei-impact-beneficiaries'
        },
        'home-equity': {
            0: 'he-method',
            1: 'he-repayment',
            2: 'he-risk-tolerance'
        }
    };
    
    const inputField = questionMapping[modelId] && questionMapping[modelId][questionIndex];
    if (inputField && inputs[inputField]) {
        return inputs[inputField];
    }
    
    // Check if there's a generic answer for this question
    for (const [key, value] of Object.entries(inputs)) {
        if (key.includes(questionIndex.toString()) || question.question.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return null;
}

// Also need to add the formatCurrency function if it doesn't exist
function formatCurrency(value) {
    if (!value && value !== 0) return '0';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : Number(value);
    
    if (isNaN(numValue)) return '0';
    
    return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Helper function to format answers for display
function formatAnswerForDisplay(answer, type) {
    if (!answer) return 'Not answered';
    
    if (type === 'checkbox-group') {
        try {
            const values = JSON.parse(answer);
            return Array.isArray(values) ? values.join(', ') : answer;
        } catch {
            return answer;
        }
    }
    
    return answer;
}

// Helper function to generate question HTML
function generateQuestionWithAnswer(number, text, answer) {
    return `
        <div class="question">

            <div class="question-number">${number}.</div>
            <div class="question-text">${text}</div>
            <div class="answer">Answer: ${answer}</div>
        </div>
    `;
}

function generateEmailContent(data) {
    let content = `LW FINANCIAL - COMPLETE QUESTIONNAIRE SUBMISSION\n`;
    content += `============================================\n\n`;
    content += `Submission Date: ${new Date(data.timestamp).toLocaleString()}\n`;
    content += `Client Type: ${data.clientType}\n\n`;
    
    // Family Members
    content += `FAMILY MEMBERS (${data.familyMembers.length}):\n`;
    data.familyMembers.forEach((member, index) => {
        content += `${index + 1}. ${member.name} (${member.relationship}, ${member.age} years, ${member.role})\n`;
    });
    content += '\n';
    
    // Financial Summary
    content += `FINANCIAL OVERVIEW:\n`;
    Object.entries(data.financialDetails).forEach(([memberId, details]) => {
        const member = data.familyMembers.find(m => m.id === memberId);
        if (member) {
            content += `- ${member.name}: Income: $${details.income || 'N/A'}, Credit: ${details.creditRating || 'N/A'}, Assets: ${details.assets || 'N/A'}\n`;
        }
    });
    content += '\n';
    
    // Selected Models
    content += `SELECTED STRATEGIES: ${data.selectedModels.join(', ')}\n\n`;
    
    // Model-specific answers
    content += `MODEL-SPECIFIC ANSWERS:\n`;
    Object.entries(data.modelSpecificAnswers).forEach(([key, answer]) => {
        content += `- ${key}: ${answer}\n`;
    });
    
    return content;
}

function simulateEmailToLWFinancial(content) {
    console.log('Sending questionnaire to: zianw@hotmail.com');
    console.log('Questionnaire content length:', content.length, 'characters');
    
    // In a real implementation, this would send via a server
    // For demo purposes, we'll log it and create a downloadable file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link to download
    const a = document.createElement('a');
    a.href = url;
    a.download = `LW_Financial_Questionnaire_${new Date().toISOString().split('T')[0]}.txt`;
    a.textContent = 'Download Complete Questionnaire';
    a.style.display = 'block';
    a.style.margin = '1rem 0';
    a.style.padding = '0.5rem';
    a.style.backgroundColor = '#3498db';
    a.style.color = 'white';
    a.style.textAlign = 'center';
    a.style.borderRadius = '4px';
    a.style.textDecoration = 'none';
    
    // Show download link to user
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        const existingLink = modalBody.querySelector('.download-link');
        if (existingLink) existingLink.remove();
        a.className = 'download-link';
        modalBody.appendChild(a);
    }
    
    // Also auto-download
    setTimeout(() => {
        a.click();
    }, 1000);
    
    console.log('Questionnaire would be emailed to: zianw@hotmail.com');
}


// Update the print function override:
const originalPrint = window.print;
window.print = function() {
    const postAnalysisCompleted = postAnalysisData.completed;
    
    if (!postAnalysisCompleted) {
        alert('Please complete the Full Financial Check before printing. This ensures you have the most accurate results.');
        showPostAnalysisQuestionnaire();
        return;
    }
    
    // Add detailed information to print
    addDetailedInfoToPrint();
    
    // Wait a moment for the content to be added, then print
    setTimeout(() => {
        originalPrint();
    }, 500);
};

function addDetailedInfoToPrint() {
    const comparisonPage = document.getElementById('comparison-page');
    if (!comparisonPage) return;
    
    // Create detailed info section for printing
    const detailedSection = document.createElement('div');
    detailedSection.className = 'full-check-completed';
    detailedSection.innerHTML = `
        <div style="page-break-before: always; padding-top: 2rem;">
            <h2>📋 Complete Financial Analysis Details</h2>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                <strong>Full Financial Check Completed:</strong> ${new Date().toLocaleString()}
            </div>
            
            <h3>Family Members Analysis</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
                <thead>
                    <tr style="background: #2c3e50; color: white;">
                        <th style="padding: 0.5rem; text-align: left;">Name</th>
                        <th style="padding: 0.5rem; text-align: left;">Role</th>
                        <th style="padding: 0.5rem; text-align: left;">Financial Contribution</th>
                        <th style="padding: 0.5rem; text-align: left;">Risk Assessment</th>
                    </tr>
                </thead>
                <tbody id="print-family-members">
                    <!-- Filled by JavaScript -->
                </tbody>
            </table>
            
            <h3>Enhanced Strategy Recommendations</h3>
            <p>Based on detailed financial information, these strategies have been recalculated for maximum accuracy.</p>
            
            <div style="background: #e8f4fc; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                <strong>Note:</strong> Complete 50-question questionnaire has been emailed to LW Financial for professional review.
                Contact: 604.202.9178 | CDY@LATITUDE-WEST.CA
            </div>
        </div>
    `;
    
    comparisonPage.appendChild(detailedSection);
    
    // Fill family members table
    const tbody = document.getElementById('print-family-members');
    if (tbody && postAnalysisData.familyMembers) {
        postAnalysisData.familyMembers.forEach(member => {
            const details = postAnalysisData.financialDetails[member.id] || {};
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #ddd';
            row.innerHTML = `
                <td style="padding: 0.5rem;">${member.name || 'Not specified'}</td>
                <td style="padding: 0.5rem;">${member.role || 'Not specified'}</td>
                <td style="padding: 0.5rem;">$${details.income || '0'} income, $${details.assets || '0'} assets</td>
                <td style="padding: 0.5rem;">${details.creditRating || 'Not assessed'}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Remove after print (cleanup)
    setTimeout(() => {
        if (detailedSection.parentNode) {
            detailedSection.parentNode.removeChild(detailedSection);
        }
    }, 1000);
}

// Initialize when comparison page loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('ResultComparsionPage.html')) {
        // Check if post-analysis was completed
        const savedPA = localStorage.getItem('postAnalysisData');
        if (savedPA) {
            try {
                const paData = JSON.parse(savedPA);
                const printBtn = document.getElementById('print-btn');
                if (printBtn && paData.completed) {
                    printBtn.disabled = false;
                    printBtn.textContent = '📄 Print Final Report';
                }
            } catch (e) {
                console.error('Error checking post-analysis status:', e);
            }
        }
                // Load the results
        allResults = JSON.parse(localStorage.getItem('modelResults') || '{}');
        modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
        feasibleModels = JSON.parse(localStorage.getItem('feasibleModels') || '[]');
        
        // Add detailed view buttons
        addDetailedViewButtons();
        
        // Also add event listener for any dynamically loaded content
        const observer = new MutationObserver(addDetailedViewButtons);
        observer.observe(document.body, { childList: true, subtree: true });
    }
});



// ============================================
// PAGE-SPECIFIC INITIALIZATION
// ============================================

function addResetButton() {
    // Add a reset button to the header
    const header = document.querySelector('header .container');
    if (header) {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Start Fresh';
        resetBtn.className = 'reset-btn';
        resetBtn.style.marginLeft = '1rem';
        resetBtn.style.backgroundColor = '#e74c3c';
        resetBtn.onclick = resetAllSelections;
        
        header.appendChild(resetBtn);
    }
}

document.addEventListener('DOMContentLoaded', function() {
      
    // Initialize reverse mortgage questionnaire if needed
    if (window.location.pathname.includes('Models.html')) {
        // Check if home equity model is selected
        setTimeout(() => {
            const methodSelect = document.getElementById('equity-method');
            if (methodSelect) {
                methodSelect.addEventListener('change', function() {
                    if (this.value === 'reverse-mortgage') {
                        // Initialize questionnaire modal (but don't show it yet)
                        createReverseMortgageQuestionnaireModal();
                    }
                });
                
                // Trigger change if reverse mortgage is already selected
                if (methodSelect.value === 'reverse-mortgage') {
                    createReverseMortgageQuestionnaireModal();
                }
            }
        }, 1000);
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize session first
    initializeSession();
    const path = window.location.pathname;
    
    // Add reset button to all pages except matchmaker
    if (!path.includes('index.html') && !path.includes('ResultComparsionPage.html')) {
        addResetButton();
    }
    
    if (path.includes('Models.html') || path.endsWith('Models.html')) {
        console.log("Initializing Models page...");
        initializeModelsPage();
    } else if (path.includes('CoverPage.html') || path.endsWith('CoverPage.html') || path === '/' || path === '') {
        console.log("Initializing Cover page...");
        initializeCoverPage();
    } else if (path.includes('ResultComparsionPage.html')) {
        console.log("Initializing Comparison page...");
        initializeComparisonPage();
    } else if (path.includes('index.html')) {
        console.log("Initializing Matchmaker page...");
        initializeMatchmaker();
    }
});

// Navigation helper to ensure smooth transitions
function navigateToStep(stepNumber) {
    // If moving forward, validate and proceed
    if (stepNumber > currentStep) {
        nextStep(stepNumber);
    } else {
        prevStep(stepNumber);
    }
}

// Update all continue buttons to use this function
document.addEventListener('DOMContentLoaded', function() {
    // Find all continue buttons and update them
    document.querySelectorAll('button[onclick^="nextStep"]').forEach(button => {
        const oldOnclick = button.getAttribute('onclick');
        if (oldOnclick) {
            const stepMatch = oldOnclick.match(/nextStep\((\d+)\)/);
            if (stepMatch) {
                const stepNum = parseInt(stepMatch[1]);
                button.removeAttribute('onclick');
                button.addEventListener('click', function() {
                    navigateToStep(stepNum);
                });
            }
        }
    });
    

});

    // Find all back buttons and update them
    document.querySelectorAll('button[onclick^="prevStep"]').forEach(button => {
        const oldOnclick = button.getAttribute('onclick');
        if (oldOnclick) {
            const stepMatch = oldOnclick.match(/prevStep\((\d+)\)/);
            if (stepMatch) {
                const stepNum = parseInt(stepMatch[1]);
                button.removeAttribute('onclick');
                button.addEventListener('click', function() {
                    navigateToStep(stepNum);
                });
            }
        }
    });

function calculateResults() {
    console.log('Calculating results...');
    
    // First validate step 4
    if (!validateCurrentStep(4)) {
        alert('Please select a preference for each strategy before seeing your matches.');
        return;
    }
    
    // Save progress
    saveQuestionnaireProgress();
    
    // Move to results step
    nextStep(5);
    
    // Then calculate and display matches
    setTimeout(() => {
        calculateMatches();
    }, 300);
};

// After DOM loads, initialize select listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on matchmaker page
    if (window.location.pathname.includes('index.html')) {
        // Initialize select event listeners after a short delay
        setTimeout(() => {
            // Add event listeners for all select elements
            document.querySelectorAll('#step-2 select, #step-3 select').forEach(select => {
                select.addEventListener('change', function() {
                    handleSelectChange(this);
                });
                
                // Also restore any existing value
                const savedValue = questionnaireData.answers[select.id];
                if (savedValue) {
                    select.value = savedValue;
                }
            });
        }, 500);
    }
})


/* Initialize answered questions from existing data
function initializeAnsweredQuestions() {
    const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
    const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
    
    // Track questions answered in matchmaker
    if (questionnaireData.clientType) {
        answeredQuestions.add('client-type');
    }
    if (questionnaireData.answers) {
        Object.keys(questionnaireData.answers).forEach(key => {
            if (QUESTIONNAIRE_MAP[key]) {
                answeredQuestions.add(key);
            }
        });
    }
    
    // Track questions answered in model inputs
    Object.keys(modelInputs).forEach(modelId => {
        const inputs = modelInputs[modelId];
        Object.keys(inputs).forEach(inputKey => {
            // Map model-specific inputs to questionnaire questions
            mapModelInputToQuestion(modelId, inputKey, inputs[inputKey]);
        });
    });
}*/

// Map model inputs to questionnaire questions
function mapModelInputToQuestion(modelId, inputKey, value) {
    const mapping = {
        'three-thirty': {
            'tt-child-income': 'occupation-income',
            'tt-savings-rate': null, // Not in PDF
            'tt-current-savings': 'downpayment-saved',
            'tt-parent-loan-amount': 'discussed-amount',
            'tt-parent-loan-rate': 'interest-expectation'
        },
        'multi-gen': {
            'mg-living-years': 'living-timeframe',
            'mg-child-equity': 'renovation-contribution'
        }
    };
    
    if (mapping[modelId] && mapping[modelId][inputKey]) {
        answeredQuestions.add(mapping[modelId][inputKey]);
    }
}

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Clean up any incomplete financial check data when page loads
    const savedPA = localStorage.getItem('postAnalysisData');
    if (savedPA) {
        try {
            const paData = JSON.parse(savedPA);
            if (!paData.completed) {
                // Check if data is very old (older than 1 hour)
                if (paData.lastSaved) {
                    const lastSaved = new Date(paData.lastSaved);
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    
                    if (lastSaved < oneHourAgo) {
                        console.log('Clearing stale incomplete financial check data');
                        clearPostAnalysisData();
                    }
                } else if (Object.keys(paData.primarySponsor).length === 0) {
                    // Empty data, clear it
                    clearPostAnalysisData();
                }
            }
        } catch (e) {
            // Invalid data, clear it
            clearPostAnalysisData();
        }
    }
});

function debugLocalStorage() {
    console.group('📊 Local Storage Debug Info');
    
    // Check model results
    const modelResults = JSON.parse(localStorage.getItem('modelResults') || '{}');
    console.log('Model Results:', modelResults);
    
    // Check home equity specific results
    if (modelResults['home-equity']) {
        console.log('Home Equity Analysis:', modelResults['home-equity']);
        console.log('Home Equity Method:', modelResults['home-equity'].method);
        console.log('Reverse Mortgage Qualification in Results:', modelResults['home-equity'].reverseMortgageQualification);
    }
    
    // Check reverse mortgage questionnaire
    const rmq = localStorage.getItem('reverseMortgageQuestionnaire');
    console.log('Reverse Mortgage Questionnaire Data:', rmq);
    if (rmq) {
        try {
            const parsed = JSON.parse(rmq);
            console.log('Parsed RMQ:', parsed);
        } catch (e) {
            console.error('Error parsing RMQ:', e);
        }
    }
    
    // Check model inputs
    const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
    console.log('Home Equity Inputs:', modelInputs['home-equity']);
    
    console.groupEnd();
}

// Also update the Home Equity model initialization to add age input
function updateHomeEquityPage() {
    const page = document.getElementById('home-equity-page');
    if (!page) return;
    
    // Check if age input already exists
    const existingAgeInput = document.getElementById('he-homeowner-age');
    if (!existingAgeInput) {
        // Add age input for reverse mortgage qualification
        const methodSelect = document.getElementById('equity-method');
        if (methodSelect) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            inputGroup.id = 'homeowner-age-group';
            inputGroup.style.display = 'none';
            
            inputGroup.innerHTML = `
                <label for="he-homeowner-age">Homeowner Age (for reverse mortgage qualification)</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" id="he-homeowner-age" min="18" max="100" 
                           placeholder="Enter age of youngest homeowner" 
                           onchange="updateModelInput('home-equity', 'he-homeowner-age', this.value)"
                           style="flex: 1;">
                    <button type="button" onclick="showAgeHelper()" 
                            style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px; cursor: help; font-size: 18px;">
                        ?
                    </button>
                </div>
                <small>Reverse mortgages typically require minimum age 55-62</small>
            `;
            
            // Insert after method select
            methodSelect.parentNode.parentNode.appendChild(inputGroup);
        }
    }
    
    // Add status indicator
    addReverseMortgageStatusIndicator();
    
    // Update method selector with status tracking
    updateMethodSelectorWithStatus();
}

// Age helper popup
function showAgeHelper() {
    alert(
        '🏠 Reverse Mortgage Age Requirement:\n\n' +
        '• Minimum age: Typically 55-62 years\n' +
        '• Based on youngest homeowner\n' +
        '• Age affects available loan amount\n' +
        '• Older age = Higher loan-to-value ratio\n\n' +
        'Note: This is for initial assessment. Final approval requires lender verification.'
    );
}

// Add a helper function to update model inputs
function updateModelInput(modelId, fieldId, value) {
    modelInputs[modelId] = modelInputs[modelId] || {};
    modelInputs[modelId][fieldId] = value;
    localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
}

// ============================================
// REVERSE MORTGAGE QUALIFICATION QUESTIONNAIRE
// ============================================

// Store reverse mortgage questionnaire data
let reverseMortgageQuestionnaire = {
    completed: false,
    answers: {},
    qualificationStatus: 'pending',
    notes: []
};

// Create reverse mortgage questionnaire modal
function createReverseMortgageQuestionnaireModal() {
    // Check if modal already exists
    if (document.getElementById('reverse-mortgage-questionnaire-modal')) {
        return;
    }
    
    const modalHTML = `
        <div id="reverse-mortgage-questionnaire-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; overflow-y: auto;">
            <div class="modal-content" style="background: white; margin: 50px auto; width: 90%; max-width: 700px; border-radius: 8px; position: relative;">
                <div class="modal-header" style="background: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">🏠 Reverse Mortgage Qualification Assessment</h2>
                    <button onclick="closeReverseMortgageQuestionnaire()" style="position: absolute; right: 20px; top: 20px; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">
                        ×
                    </button>
                </div>
                
                <div class="modal-body" style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                    <div class="questionnaire-intro" style="margin-bottom: 20px;">
                        <p><strong>This brief questionnaire helps determine your eligibility for a reverse mortgage.</strong></p>
                        <p>Reverse mortgages have specific requirements in Canada. Please answer the following questions honestly to ensure accurate qualification assessment.</p>
                        <div style="background: #e8f4fc; padding: 15px; border-radius: 4px; margin: 10px 0;">
                            <small><strong>Note:</strong> This is a preliminary assessment. Final approval requires formal application with a lender.</small>
                        </div>
                    </div>
                    
                    <div class="questionnaire-questions" id="rmq-questions-container">
                        <!-- Questions will be dynamically added here -->
                    </div>
                    
                    <div id="rmq-results" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 4px;">
                        <h3 style="color: #2c3e50;">Qualification Assessment Results</h3>
                        <div id="rmq-results-content"></div>
                    </div>
                </div>
                
                <div class="modal-footer" style="padding: 15px 20px; background: #f8f9fa; border-top: 1px solid #dee2e6; text-align: right; border-radius: 0 0 8px 8px;">
                    <button id="rmq-back-btn" onclick="prevRMQQuestion()" style="display: none; padding: 10px 15px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                        ← Back
                    </button>
                    <button id="rmq-next-btn" onclick="nextRMQQuestion()" style="padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Next →
                    </button>
                    <button id="rmq-submit-btn" onclick="submitReverseMortgageQuestionnaire()" style="display: none; padding: 10px 15px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Submit Assessment
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Initialize reverse mortgage questionnaire
function initializeReverseMortgageQuestionnaire() {
    createReverseMortgageQuestionnaireModal();
    
    // Define the qualification questions
    const questions = [
        {
            id: 'age',
            question: 'What is the age of the youngest homeowner?',
            type: 'number',
            placeholder: 'Enter age',
            min: 18,
            max: 100,
            required: true,
            validation: (value) => {
                const age = parseInt(value);
                if (age < 55) {
                    return {
                        valid: false,
                        message: 'Minimum age for reverse mortgage is typically 55-62 years. You may not qualify based on age.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Age requirement met' };
            }
        },
        {
            id: 'property_type',
            question: 'Is this your primary residence?',
            type: 'select',
            options: [
                { value: 'primary', label: 'Yes, it\'s my primary residence' },
                { value: 'secondary', label: 'No, it\'s a secondary/vacation home' },
                { value: 'investment', label: 'No, it\'s an investment property' }
            ],
            required: true,
            validation: (value) => {
                if (value !== 'primary') {
                    return {
                        valid: false,
                        message: 'Reverse mortgages typically require the property to be your primary residence.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Primary residence requirement met' };
            }
        },
        {
            id: 'property_value',
            question: 'What is the current market value of your home?',
            type: 'number',
            placeholder: 'Enter estimated value in $',
            min: 100000,
            max: 10000000,
            required: true,
            prefix: '$',
            validation: (value) => {
                const val = parseInt(value);
                if (val < 200000) {
                    return {
                        valid: true,
                        message: 'Note: Lower value properties may have limited borrowing capacity.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Property value acceptable' };
            }
        },
        {
            id: 'existing_mortgage',
            question: 'Do you have an existing mortgage on this property?',
            type: 'select',
            options: [
                { value: 'no_mortgage', label: 'No, property is mortgage-free' },
                { value: 'small_mortgage', label: 'Yes, small mortgage (<50% of home value)' },
                { value: 'large_mortgage', label: 'Yes, significant mortgage (>50% of home value)' }
            ],
            required: true,
            validation: (value) => {
                if (value === 'large_mortgage') {
                    return {
                        valid: true,
                        message: 'Note: Large existing mortgages may reduce available reverse mortgage amount.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Mortgage status acceptable' };
            }
        },
        {
            id: 'property_taxes',
            question: 'Are your property taxes and home insurance up to date?',
            type: 'select',
            options: [
                { value: 'current', label: 'Yes, all current and paid' },
                { value: 'some_delinquent', label: 'Some are overdue but can be caught up' },
                { value: 'significantly_delinquent', label: 'Significantly behind on payments' }
            ],
            required: true,
            validation: (value) => {
                if (value === 'significantly_delinquent') {
                    return {
                        valid: false,
                        message: 'Property taxes and insurance must be current for reverse mortgage qualification.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Tax and insurance status acceptable' };
            }
        },
        {
            id: 'property_condition',
            question: 'What is the general condition of your home?',
            type: 'select',
            options: [
                { value: 'excellent', label: 'Excellent condition, well-maintained' },
                { value: 'good', label: 'Good condition, minor repairs needed' },
                { value: 'fair', label: 'Fair condition, some major repairs needed' },
                { value: 'poor', label: 'Poor condition, significant repairs required' }
            ],
            required: true,
            validation: (value) => {
                if (value === 'poor') {
                    return {
                        valid: true,
                        message: 'Note: Homes in poor condition may require repairs before reverse mortgage approval.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Property condition acceptable' };
            }
        },
        {
            id: 'government_debt',
            question: 'Do you have any outstanding government debt (student loans, tax liens, etc.)?',
            type: 'select',
            options: [
                { value: 'none', label: 'No government debt' },
                { value: 'small', label: 'Small amount, in good standing' },
                { value: 'significant_delinquent', label: 'Significant amount or delinquent' }
            ],
            required: true,
            validation: (value) => {
                if (value === 'significant_delinquent') {
                    return {
                        valid: false,
                        message: 'Delinquent government debt may prevent reverse mortgage approval.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Government debt status acceptable' };
            }
        },
        {
            id: 'financial_counseling',
            question: 'Have you received reverse mortgage counseling from a HUD-approved agency?',
            type: 'select',
            options: [
                { value: 'yes_completed', label: 'Yes, completed counseling' },
                { value: 'scheduled', label: 'No, but I\'m willing to complete it' },
                { value: 'not_interested', label: 'No, and not interested' }
            ],
            required: true,
            validation: (value) => {
                if (value === 'not_interested') {
                    return {
                        valid: true,
                        message: 'Note: Reverse mortgage counseling is required by law in most cases.',
                        warning: true
                    };
                }
                return { valid: true, message: 'Counseling requirement noted' };
            }
        }
    ];
    
    // Store questions globally
    window.rmqQuestions = questions;
    window.currentRMQQuestion = 0;
    
    // Initialize first question
    showRMQQuestion(0);
}

// Show specific question
function showRMQQuestion(index) {
    const container = document.getElementById('rmq-questions-container');
    const questions = window.rmqQuestions;
    
    if (!container || !questions || index >= questions.length) return;
    
    container.innerHTML = '';
    window.currentRMQQuestion = index;
    
    const q = questions[index];
    let questionHTML = '';
    
    // Add progress indicator
    const progress = Math.round((index / questions.length) * 100);
    questionHTML += `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Question ${index + 1} of ${questions.length}</span>
                <span>${progress}% complete</span>
            </div>
            <div style="height: 6px; background: #ecf0f1; border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${progress}%; background: #3498db; transition: width 0.3s;"></div>
            </div>
        </div>
    `;
    
    // Question text
    questionHTML += `<h3 style="margin-bottom: 15px; color: #2c3e50;">${q.question}</h3>`;
    
    // Question input based on type
    const currentAnswer = reverseMortgageQuestionnaire.answers[q.id] || '';
    
    switch(q.type) {
        case 'select':
            questionHTML += `
                <select id="rmq-${q.id}" 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;"
                        onchange="updateRMQAnswer('${q.id}', this.value)">
                    <option value="">Select an option...</option>
                    ${q.options.map(opt => `
                        <option value="${opt.value}" ${currentAnswer === opt.value ? 'selected' : ''}>
                            ${opt.label}
                        </option>
                    `).join('')}
                </select>
            `;
            break;
            
        case 'number':
            questionHTML += `
                <div style="display: flex; align-items: center;">
                    ${q.prefix ? `<span style="margin-right: 10px; font-size: 16px;">${q.prefix}</span>` : ''}
                    <input type="number" 
                           id="rmq-${q.id}"
                           value="${currentAnswer}"
                           min="${q.min || ''}"
                           max="${q.max || ''}"
                           placeholder="${q.placeholder || ''}"
                           style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;"
                           onchange="updateRMQAnswer('${q.id}', this.value)">
                </div>
            `;
            break;
            
        case 'text':
            questionHTML += `
                <input type="text" 
                       id="rmq-${q.id}"
                       value="${currentAnswer}"
                       placeholder="${q.placeholder || ''}"
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;"
                       onchange="updateRMQAnswer('${q.id}', this.value)">
            `;
            break;
    }
    
    // Add validation feedback area
    questionHTML += `
        <div id="rmq-validation-${q.id}" style="margin-top: 10px; min-height: 20px;"></div>
    `;
    
    container.innerHTML = questionHTML;
    
    // Update button visibility
    updateRMQButtons();
}

// Update answer
function updateRMQAnswer(questionId, value) {
    reverseMortgageQuestionnaire.answers[questionId] = value;
    
    // Validate answer
    const question = window.rmqQuestions.find(q => q.id === questionId);
    if (question && question.validation) {
        const validation = question.validation(value);
        const validationDiv = document.getElementById(`rmq-validation-${questionId}`);
        
        if (validationDiv) {
            if (validation.warning) {
                validationDiv.innerHTML = `<div style="color: #f39c12; background: #fff9e6; padding: 10px; border-radius: 4px; margin-top: 5px;">
                    ⚠️ ${validation.message}
                </div>`;
            } else if (!validation.valid) {
                validationDiv.innerHTML = `<div style="color: #e74c3c; background: #fde8e8; padding: 10px; border-radius: 4px; margin-top: 5px;">
                    ❌ ${validation.message}
                </div>`;
            } else {
                validationDiv.innerHTML = `<div style="color: #27ae60; background: #e8f8f0; padding: 10px; border-radius: 4px; margin-top: 5px;">
                    ✓ ${validation.message}
                </div>`;
            }
        }
    }
}

// Update navigation buttons
function updateRMQButtons() {
    const questions = window.rmqQuestions;
    const current = window.currentRMQQuestion;
    const backBtn = document.getElementById('rmq-back-btn');
    const nextBtn = document.getElementById('rmq-next-btn');
    const submitBtn = document.getElementById('rmq-submit-btn');
    
    // Show/hide back button
    if (backBtn) {
        backBtn.style.display = current > 0 ? 'inline-block' : 'none';
    }
    
    // Show/hide next and submit buttons
    if (nextBtn && submitBtn) {
        if (current < questions.length - 1) {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        }
    }
}

// Navigate to next question
function nextRMQQuestion() {
    const current = window.currentRMQQuestion;
    const questions = window.rmqQuestions;
    
    // Validate current question
    const question = questions[current];
    const answer = reverseMortgageQuestionnaire.answers[question.id];
    
    if (question.required && (!answer || answer === '')) {
        alert(`Please answer question ${current + 1} before proceeding.`);
        return;
    }
    
    // Move to next question or finish
    if (current < questions.length - 1) {
        showRMQQuestion(current + 1);
    }
}

// Navigate to previous question
function prevRMQQuestion() {
    const current = window.currentRMQQuestion;
    if (current > 0) {
        showRMQQuestion(current - 1);
    }
}

// Calculate qualification score
function calculateRMQQualification() {
    let score = 100;
    const warnings = [];
    const disqualifications = [];
    
    // Age check
    const age = parseInt(reverseMortgageQuestionnaire.answers.age) || 0;
    if (age < 55) {
        score -= 40;
        disqualifications.push(`Age ${age} is below typical minimum (55-62 years)`);
    } else if (age < 62) {
        score -= 10;
        warnings.push(`Age ${age} is at lower end of qualification range`);
    }
    
    // Property type
    if (reverseMortgageQuestionnaire.answers.property_type !== 'primary') {
        score -= 50;
        disqualifications.push('Property must be primary residence');
    }
    
    // Property condition
    if (reverseMortgageQuestionnaire.answers.property_condition === 'poor') {
        score -= 30;
        warnings.push('Property condition may require repairs before approval');
    }
    
    // Property taxes
    if (reverseMortgageQuestionnaire.answers.property_taxes === 'significantly_delinquent') {
        score -= 40;
        disqualifications.push('Property taxes must be current');
    }
    
    // Government debt
    if (reverseMortgageQuestionnaire.answers.government_debt === 'significant_delinquent') {
        score -= 50;
        disqualifications.push('Delinquent government debt may prevent approval');
    }
    
    // Existing mortgage
    if (reverseMortgageQuestionnaire.answers.existing_mortgage === 'large_mortgage') {
        score -= 20;
        warnings.push('Large existing mortgage reduces available equity');
    }
    
    // Financial counseling
    if (reverseMortgageQuestionnaire.answers.financial_counseling === 'not_interested') {
        score -= 25;
        warnings.push('Reverse mortgage counseling is typically required');
    }
    
    // Determine qualification status
    let status, message, color;
    
    if (disqualifications.length > 0) {
        status = 'Not Qualified';
        message = 'Based on your answers, you likely do not qualify for a reverse mortgage.';
        color = '#e74c3c';
    } else if (score >= 70) {
        status = 'Likely Qualified';
        message = 'Based on your answers, you likely qualify for a reverse mortgage.';
        color = '#2ecc71';
    } else if (score >= 50) {
        status = 'Potentially Qualified';
        message = 'You may qualify, but some factors need attention.';
        color = '#f39c12';
    } else {
        status = 'Unlikely to Qualify';
        message = 'Based on your answers, reverse mortgage qualification is unlikely.';
        color = '#e74c3c';
    }
    
    reverseMortgageQuestionnaire.qualificationStatus = status.toLowerCase().replace(' ', '_');
    reverseMortgageQuestionnaire.qualificationScore = score;
    reverseMortgageQuestionnaire.disqualifications = disqualifications;
    reverseMortgageQuestionnaire.warnings = warnings;
    
    return { status, message, color, score, disqualifications, warnings };
}

// Submit questionnaire
function submitReverseMortgageQuestionnaire() {
    // Validate all questions are answered
    const questions = window.rmqQuestions;
    for (const q of questions) {
        if (q.required && !reverseMortgageQuestionnaire.answers[q.id]) {
            alert(`Please answer all required questions. Missing: ${q.question}`);
            return;
        }
    }
    
    // Calculate qualification
    const qualification = calculateRMQQualification();
    
    // Store completion
    reverseMortgageQuestionnaire.completed = true;
    reverseMortgageQuestionnaire.completedAt = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('reverseMortgageQuestionnaire', JSON.stringify(reverseMortgageQuestionnaire));
    
    // Also save to model inputs if we're in home-equity model
    modelInputs['home-equity'] = modelInputs['home-equity'] || {};
    modelInputs['home-equity'].reverseMortgageQualification = reverseMortgageQuestionnaire;
    localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
    
    // Show results
    showRMQResults(qualification);
    
    // Update status indicator
    updateReverseMortgageStatusContent();
    
    // Show completion notification
    showReverseMortgageNotification('completed');
    
    // Close modal after delay
    setTimeout(() => {
        closeReverseMortgageQuestionnaire();
    }, 2000);
}

// Show qualification results
function showRMQResults(qualification) {
    const resultsDiv = document.getElementById('rmq-results');
    const contentDiv = document.getElementById('rmq-results-content');
    const submitBtn = document.getElementById('rmq-submit-btn');
    
    if (!resultsDiv || !contentDiv) return;
    
    let resultsHTML = `
        <div style="background: ${qualification.color}15; border-left: 4px solid ${qualification.color}; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: ${qualification.color};">
                ${qualification.status}
            </h4>
            <p style="margin: 0;">${qualification.message}</p>
            <div style="margin-top: 10px;">
                <strong>Qualification Score:</strong> ${qualification.score}/100
            </div>
        </div>
    `;
    
    if (qualification.disqualifications.length > 0) {
        resultsHTML += `
            <div style="margin-bottom: 15px;">
                <h5 style="color: #e74c3c; margin-bottom: 5px;">Disqualifying Factors:</h5>
                <ul style="margin: 0; padding-left: 20px;">
                    ${qualification.disqualifications.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (qualification.warnings.length > 0) {
        resultsHTML += `
            <div style="margin-bottom: 15px;">
                <h5 style="color: #f39c12; margin-bottom: 5px;">Factors Needing Attention:</h5>
                <ul style="margin: 0; padding-left: 20px;">
                    ${qualification.warnings.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    resultsHTML += `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <h5 style="margin-top: 0;">Recommendations:</h5>
            <ul style="margin: 0; padding-left: 20px;">
                <li>This is a preliminary assessment only</li>
                <li>Consult with a reverse mortgage specialist for formal qualification</li>
                <li>Consider completing HUD-approved counseling if pursuing reverse mortgage</li>
                <li>Address any disqualifying factors before application</li>
            </ul>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="closeReverseMortgageQuestionnaire()" style="flex: 1; padding: 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Continue Anyway
            </button>
            <button onclick="restartReverseMortgageQuestionnaire()" style="flex: 1; padding: 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Restart Questionnaire
            </button>
        </div>
    `;
    
    contentDiv.innerHTML = resultsHTML;
    resultsDiv.style.display = 'block';
    
    // Hide submit button
    if (submitBtn) {
        submitBtn.style.display = 'none';
    }
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Show the questionnaire modal
function showReverseMortgageQuestionnaire(onCompleteCallback) {
    console.log('Creating reverse mortgage questionnaire...');
    


    // Remove any existing modal first
    const existingModal = document.getElementById('reverse-mortgage-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create the modal
    const modal = document.createElement('div');
    modal.id = 'reverse-mortgage-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Reverse Mortgage Qualification Check</h2>
            
            <div id="rmq-content">
                <div class="rmq-step active" id="rmq-step-1">
                    <p>To assess your eligibility for a reverse mortgage, we need some basic information:</p>
                    
                    <div class="input-group" style="margin: 20px 0;">
                        <label>Age of youngest homeowner</label>
                        <input type="number" id="rmq-age" min="55" max="100" placeholder="55+" style="width: 100%; padding: 8px;">
                        <small>Must be 55 or older to qualify</small>
                    </div>
                    
                    <div class="input-group" style="margin: 20px 0;">
                        <label>Estimated home value ($)</label>
                        <input type="number" id="rmq-home-value" min="100000" placeholder="e.g., 500000" style="width: 100%; padding: 8px;">
                    </div>
                    
                    <div class="input-group" style="margin: 20px 0;">
                        <label>Current mortgage balance ($)</label>
                        <input type="number" id="rmq-mortgage-balance" min="0" placeholder="e.g., 200000" style="width: 100%; padding: 8px;">
                    </div>
                    
                    <div class="input-group" style="margin: 20px 0;">
                        <label>Property type</label>
                        <select id="rmq-property-type" style="width: 100%; padding: 8px;">
                            <option value="primary">Primary Residence</option>
                            <option value="investment">Investment Property</option>
                            <option value="vacation">Vacation Home</option>
                        </select>
                    </div>
                </div>
                
                <div class="rmq-step" id="rmq-step-2" style="display: none;">
                    <h3>Qualification Results</h3>
                    <div id="rmq-results" style="background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
                        <!-- Results will be displayed here -->
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                <button id="rmq-cancel" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Cancel & Choose Different Strategy
                </button>
                <div>
                    <button id="rmq-back" style="padding: 10px 20px; background: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; display: none;">
                        ← Back
                    </button>
                    <button id="rmq-next" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Check Qualification →
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 20px; font-size: 0.9em; color: #7f8c8d;">
                <p><strong>Note:</strong> This is a preliminary assessment only. Final qualification is subject to lender approval.</p>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(modal);
    
    // Set up event listeners
    document.getElementById('rmq-next').addEventListener('click', function() {
        processReverseMortgageQuestionnaire(onCompleteCallback);
    });
    
    document.getElementById('rmq-cancel').addEventListener('click', function() {
        // Close modal
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        
        // Reset the method selection
        const methodSelect = document.getElementById('he-method');
        if (methodSelect) {
            methodSelect.value = 'heloc';
            // Trigger change event to update UI
            const event = new Event('change');
            methodSelect.dispatchEvent(event);
        }
        
        // Optional: Go back to home equity page
        console.log('Reverse mortgage check cancelled');
    });
    
    document.getElementById('rmq-back').addEventListener('click', function() {
        document.getElementById('rmq-step-1').style.display = 'block';
        document.getElementById('rmq-step-2').style.display = 'none';
        document.getElementById('rmq-back').style.display = 'none';
        document.getElementById('rmq-next').textContent = 'Check Qualification →';
    });
    
    console.log('Reverse mortgage questionnaire modal created');
}
// Close questionnaire modal
function closeReverseMortgageQuestionnaire() {
    const modal = document.getElementById('reverse-mortgage-questionnaire-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // If questionnaire wasn't completed, show bypass notification
    if (!reverseMortgageQuestionnaire.completed) {
        showReverseMortgageNotification('bypassed');
        
        // Mark as bypassed for reporting
        reverseMortgageQuestionnaire.bypassed = true;
        reverseMortgageQuestionnaire.bypassedAt = new Date().toISOString();
        localStorage.setItem('reverseMortgageQuestionnaire', JSON.stringify(reverseMortgageQuestionnaire));
        
        modelInputs['home-equity'] = modelInputs['home-equity'] || {};
        modelInputs['home-equity'].reverseMortgageQualification = reverseMortgageQuestionnaire;
        localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
    }
    
    // Continue with home equity save if we were in that flow
    if (window.pendingHomeEquitySave) {
        window.pendingHomeEquitySave();
        window.pendingHomeEquitySave = null;
    }
}


// Restart questionnaire
function restartReverseMortgageQuestionnaire() {
    reverseMortgageQuestionnaire = {
        completed: false,
        answers: {},
        qualificationStatus: 'pending',
        notes: []
    };
    
    // Reset display
    document.getElementById('rmq-results').style.display = 'none';
    showRMQQuestion(0);
}

// Add a status indicator to the Home Equity page
function addReverseMortgageStatusIndicator() {
    const page = document.getElementById('home-equity-page');
    if (!page) return;
    
    // Check if status indicator already exists
    if (document.getElementById('reverse-mortgage-status')) {
        return;
    }
    
    // Create status indicator container
    const statusContainer = document.createElement('div');
    statusContainer.id = 'reverse-mortgage-status';
    statusContainer.style.cssText = `
        position: sticky;
        top: 20px;
        margin: 20px 0;
        padding: 15px;
        border-radius: 8px;
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        z-index: 100;
        display: none;
    `;
    
    // Get existing data
    const savedRMQ = localStorage.getItem('reverseMortgageQuestionnaire');
    const rmqData = savedRMQ ? JSON.parse(savedRMQ) : null;
    
    let statusHTML = '';
    
    if (rmqData && rmqData.completed) {
        // Questionnaire completed
        const statusClass = rmqData.qualificationStatus.includes('not_qualified') || 
                           rmqData.qualificationStatus.includes('unlikely') ? 'warning' : 'success';
        
        statusHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;">
                        <span style="color: ${statusClass === 'success' ? '#27ae60' : '#f39c12'};">
                            ${statusClass === 'success' ? '✅' : '⚠️'}
                        </span>
                        Reverse Mortgage Assessment Completed
                    </h4>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                        Status: <strong>${rmqData.qualificationStatus.replace('_', ' ').toUpperCase()}</strong>
                        ${rmqData.qualificationScore ? ` | Score: ${rmqData.qualificationScore}/100` : ''}
                    </p>
                </div>
                <div>
                    <button onclick="showReverseMortgageQuestionnaire()" 
                            style="padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        View Details
                    </button>
                    <button onclick="clearReverseMortgageAssessment()" 
                            style="margin-left: 8px; padding: 6px 12px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Clear
                    </button>
                </div>
            </div>
        `;
    } else {
        // No assessment yet
        statusHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;">
                        <span style="color: #f39c12;">⚠️</span>
                        Reverse Mortgage Qualification Required
                    </h4>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                        Select "Reverse Mortgage" to start qualification assessment
                    </p>
                </div>
                <div style="font-size: 14px; color: #7f8c8d;">
                    Not Started
                </div>
            </div>
        `;
    }
    
    statusContainer.innerHTML = statusHTML;
    
    // Insert after the page header or before the first input group
    const header = page.querySelector('h2');
    if (header) {
        header.parentNode.insertBefore(statusContainer, header.nextSibling);
    } else {
        page.insertBefore(statusContainer, page.firstChild);
    }
}

// Update method selector to show real-time status
function updateMethodSelectorWithStatus() {
    const methodSelect = document.getElementById('equity-method');
    if (!methodSelect) return;
    
    // Add change event listener to show/hide status and age input
    methodSelect.addEventListener('change', function() {
        const statusContainer = document.getElementById('reverse-mortgage-status');
        const ageGroup = document.getElementById('homeowner-age-group');
        
        if (this.value === 'reverse-mortgage') {
            // Show status indicator
            if (statusContainer) {
                statusContainer.style.display = 'block';
                updateReverseMortgageStatusContent();
            }
            
            // Show age input
            if (ageGroup) {
                ageGroup.style.display = 'block';
            }
            
            // Show notification that questionnaire will be required
            showReverseMortgageNotification('required');
        } else {
            // Hide status indicator for non-reverse mortgage
            if (statusContainer) {
                statusContainer.style.display = 'none';
            }
            
            // Hide age input
            if (ageGroup) {
                ageGroup.style.display = 'none';
            }
        }
    });
    
    // Initial check on page load
    if (methodSelect.value === 'reverse-mortgage') {
        const statusContainer = document.getElementById('reverse-mortgage-status');
        const ageGroup = document.getElementById('homeowner-age-group');
        
        if (statusContainer) statusContainer.style.display = 'block';
        if (ageGroup) ageGroup.style.display = 'block';
    }
}

// Update status content based on current data
function updateReverseMortgageStatusContent() {
    const statusContainer = document.getElementById('reverse-mortgage-status');
    if (!statusContainer) return;
    
    const savedRMQ = localStorage.getItem('reverseMortgageQuestionnaire');
    const rmqData = savedRMQ ? JSON.parse(savedRMQ) : null;
    
    let newContent = '';
    
    if (rmqData && rmqData.completed) {
        // Questionnaire completed
        const statusClass = rmqData.qualificationStatus.includes('not_qualified') || 
                           rmqData.qualificationStatus.includes('unlikely') ? 'warning' : 'success';
        
        newContent = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;">
                        <span style="color: ${statusClass === 'success' ? '#27ae60' : '#f39c12'};">
                            ${statusClass === 'success' ? '✅' : '⚠️'}
                        </span>
                        Reverse Mortgage Assessment Completed
                    </h4>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                        Status: <strong>${rmqData.qualificationStatus.replace('_', ' ').toUpperCase()}</strong>
                        ${rmqData.qualificationScore ? ` | Score: ${rmqData.qualificationScore}/100` : ''}
                    </p>
                </div>
                <div>
                    <button onclick="showReverseMortgageQuestionnaire()" 
                            style="padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        View Details
                    </button>
                    <button onclick="clearReverseMortgageAssessment()" 
                            style="margin-left: 8px; padding: 6px 12px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Clear
                    </button>
                </div>
            </div>
        `;
    } else {
        // No assessment yet
        newContent = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;">
                        <span style="color: #f39c12;">⚠️</span>
                        Reverse Mortgage Qualification Required
                    </h4>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                        Complete questionnaire when you save this model
                    </p>
                </div>
                <div>
                    <button onclick="showReverseMortgageQuestionnaire()" 
                            style="padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Start Assessment
                    </button>
                </div>
            </div>
        `;
    }
    
    statusContainer.innerHTML = newContent;
}

// Show notification when reverse mortgage is selected
function showReverseMortgageNotification(type) {
    // Remove any existing notification
    const existingNote = document.querySelector('.reverse-mortgage-notification');
    if (existingNote) {
        existingNote.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'reverse-mortgage-notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 15px;
        max-width: 400px;
        z-index: 10000;
        border-left: 4px solid #3498db;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    let message = '';
    
    switch(type) {
        case 'required':
            message = `
                <h4 style="margin: 0 0 8px 0; color: #2c3e50;">🏠 Reverse Mortgage Selected</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    You've selected Reverse Mortgage. A qualification assessment will be required before proceeding.
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: #7f8c8d;">This assessment will be saved to your final report</small>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: #7f8c8d; cursor: pointer; font-size: 20px;">
                        ×
                    </button>
                </div>
            `;
            break;
            
        case 'questionnaire_started':
            message = `
                <h4 style="margin: 0 0 8px 0; color: #2c3e50;">📝 Assessment Started</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    Reverse Mortgage qualification questionnaire opened. Please complete all questions.
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: #7f8c8d;">Your answers will be used for qualification assessment</small>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: #7f8c8d; cursor: pointer; font-size: 20px;">
                        ×
                    </button>
                </div>
            `;
            break;
            
        case 'bypassed':
            message = `
                <div style="background: #fff9e6; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 8px 0; color: #f39c12;">⚠️ Assessment Bypassed</h4>
                    <p style="margin: 0; font-size: 14px;">
                        You've chosen to bypass the Reverse Mortgage qualification assessment.
                        Your results may not reflect realistic qualification requirements.
                    </p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: #e74c3c;"><strong>Note:</strong> This will be noted in your final report</small>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: #7f8c8d; cursor: pointer; font-size: 20px;">
                        ×
                    </button>
                </div>
            `;
            break;
            
        case 'completed':
            const savedRMQ = localStorage.getItem('reverseMortgageQuestionnaire');
            const rmqData = savedRMQ ? JSON.parse(savedRMQ) : {};
            
            let statusColor = '#2ecc71';
            let statusText = 'QUALIFIED';
            
            if (rmqData.qualificationStatus && 
                (rmqData.qualificationStatus.includes('not_qualified') || 
                 rmqData.qualificationStatus.includes('unlikely'))) {
                statusColor = '#e74c3c';
                statusText = 'NOT QUALIFIED';
            } else if (rmqData.qualificationStatus && 
                      rmqData.qualificationStatus.includes('potentially')) {
                statusColor = '#f39c12';
                statusText = 'POTENTIALLY QUALIFIED';
            }
            
            message = `
                <h4 style="margin: 0 0 8px 0; color: #2c3e50;">✅ Assessment Completed</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    Reverse Mortgage qualification assessment completed.
                    <br>
                    <strong style="color: ${statusColor};">Status: ${statusText}</strong>
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: #7f8c8d;">Results saved to your model and final report</small>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: #7f8c8d; cursor: pointer; font-size: 20px;">
                        ×
                    </button>
                </div>
            `;
            break;
    }
    
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds for non-critical notifications
    if (type !== 'bypassed' && type !== 'completed') {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 10000);
    }
}

// Clear reverse mortgage assessment
function clearReverseMortgageAssessment() {
    if (confirm('Are you sure you want to clear your Reverse Mortgage qualification assessment? This will remove all your answers and require a new assessment.')) {
        localStorage.removeItem('reverseMortgageQuestionnaire');
        reverseMortgageQuestionnaire = {
            completed: false,
            answers: {},
            qualificationStatus: 'pending',
            notes: []
        };
        
        // Update UI
        updateReverseMortgageStatusContent();
        showReverseMortgageNotification('required');
        
        // Also remove from model inputs
        if (modelInputs['home-equity']) {
            delete modelInputs['home-equity'].reverseMortgageQualification;
            localStorage.setItem('modelInputs', JSON.stringify(modelInputs));
        }
    }
}

// ============================================
// ADD STATUS INDICATOR TO COMPARISON PAGE
// ============================================

function addReverseMortgageIndicatorToComparison() {
    const savedRMQ = localStorage.getItem('reverseMortgageQuestionnaire');
    if (!savedRMQ) return;
    
    try {
        const rmqData = JSON.parse(savedRMQ);
        if (!rmqData.completed) return;
        
        // Check if home equity model is in the comparison
        const models = JSON.parse(localStorage.getItem('feasibleModels') || '[]');
        if (!models.includes('home-equity')) return;
        
        // Get method used in home equity
        const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
        const heInputs = modelInputs['home-equity'] || {};
        const method = heInputs['he-method'];
        
        if (method !== 'reverse') return;
        
        // Add indicator to comparison page
        const container = document.querySelector('.comparison-container');
        if (!container) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'reverse-mortgage-indicator';
        indicator.style.cssText = 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; border-radius: 4px;';
        
        let statusText = '';
        if (rmqData.qualificationStatus) {
            if (rmqData.qualificationStatus.includes('not_qualified') || rmqData.qualificationStatus.includes('unlikely')) {
                indicator.style.background = '#f8d7da';
                indicator.style.borderLeftColor = '#dc3545';
                statusText = `<strong>⚠️ Warning:</strong> Reverse mortgage qualification assessment indicates you may not qualify. Results shown assume eligibility.`;
            } else if (rmqData.qualificationStatus.includes('qualified') || rmqData.qualificationStatus.includes('likely')) {
                indicator.style.background = '#d4edda';
                indicator.style.borderLeftColor = '#28a745';
                statusText = `<strong>✅ Qualified:</strong> Based on your assessment, you appear to qualify for a reverse mortgage.`;
            } else {
                statusText = `<strong>ℹ️ Note:</strong> Reverse mortgage assessment completed.`;
            }
        } else if (rmqData.bypassed) {
            indicator.style.background = '#f8f9fa';
            indicator.style.borderLeftColor = '#6c757d';
            statusText = `<strong>⏭️ Bypassed:</strong> Reverse mortgage qualification assessment was skipped. Results may not reflect realistic qualification requirements.`;
        }
        
        indicator.innerHTML = `
            <div style="font-size: 0.9rem;">
                <strong>Reverse Mortgage Status</strong><br>
                ${statusText}
                <div style="margin-top: 5px; font-size: 0.8rem; color: #666;">
                    <em>Note: This assessment is for calculation purposes only and does not constitute financial advice.</em>
                </div>
            </div>
        `;
        
        // Insert after the charts
        const charts = document.querySelector('.comparison-charts');
        if (charts) {
            charts.parentNode.insertBefore(indicator, charts.nextSibling);
        } else {
            container.insertBefore(indicator, container.firstChild);
        }
        
    } catch (e) {
        console.error('Error adding reverse mortgage indicator:', e);
    }
}

function processReverseMortgageQuestionnaire(onCompleteCallback) {
    console.log('Processing reverse mortgage questionnaire...');
    
    const step1 = document.getElementById('rmq-step-1');
    const step2 = document.getElementById('rmq-step-2');
    const nextBtn = document.getElementById('rmq-next');
    const backBtn = document.getElementById('rmq-back');
    
    // If we're on step 1, validate and calculate
    if (step1.style.display !== 'none') {
        const age = parseInt(document.getElementById('rmq-age').value) || 0;
        const homeValue = parseInt(document.getElementById('rmq-home-value').value) || 0;
        const mortgageBalance = parseInt(document.getElementById('rmq-mortgage-balance').value) || 0;
        const propertyType = document.getElementById('rmq-property-type').value;
        
        // Validation
        if (age < 55) {
            alert('The youngest homeowner must be at least 55 years old to qualify for a reverse mortgage.');
            return;
        }
        
        if (homeValue <= 0) {
            alert('Please enter a valid home value.');
            return;
        }
        
        // Calculate home equity
        const equity = homeValue - mortgageBalance;
        const equityPercentage = (equity / homeValue) * 100;
        
        // Determine qualification
        let qualificationStatus = '';
        let qualificationDetails = '';
        
        if (age >= 55 && equityPercentage >= 20 && propertyType === 'primary') {
            qualificationStatus = 'likely_qualified';
            qualificationDetails = `Based on the provided information, you appear to meet the basic requirements for a reverse mortgage.`;
        } else if (equityPercentage < 20) {
            qualificationStatus = 'insufficient_equity';
            qualificationDetails = `Your home equity (${equityPercentage.toFixed(1)}%) is below the typical minimum requirement of 20%.`;
        } else if (propertyType !== 'primary') {
            qualificationStatus = 'property_type_ineligible';
            qualificationDetails = `Reverse mortgages are typically only available for primary residences.`;
        } else {
            qualificationStatus = 'further_review_needed';
            qualificationDetails = `Additional review with a mortgage specialist is recommended.`;
        }
        
        // Save results
        const rmqData = {
            completed: true,
            completedAt: new Date().toISOString(),
            qualificationStatus: qualificationStatus,
            details: {
                age: age,
                homeValue: homeValue,
                mortgageBalance: mortgageBalance,
                equity: equity,
                equityPercentage: equityPercentage,
                propertyType: propertyType
            }
        };
        
        localStorage.setItem('reverseMortgageQuestionnaire', JSON.stringify(rmqData));
        
        // Display results
        const resultsDiv = document.getElementById('rmq-results');
        let resultHTML = '';
        
        if (qualificationStatus === 'likely_qualified') {
            resultHTML = `
                <div style="color: #27ae60;">
                    <h4 style="margin-top: 0;">✅ Likely Qualified</h4>
                    <p>${qualificationDetails}</p>
                    <ul>
                        <li>Age: ${age} years ✓</li>
                        <li>Home Equity: $${equity.toLocaleString()} (${equityPercentage.toFixed(1)}%) ✓</li>
                        <li>Property Type: Primary Residence ✓</li>
                    </ul>
                </div>
            `;
        } else {
            resultHTML = `
                <div style="color: #e74c3c;">
                    <h4 style="margin-top: 0;">⚠️ May Not Qualify</h4>
                    <p>${qualificationDetails}</p>
                    <ul>
                        <li>Age: ${age} years</li>
                        <li>Home Equity: $${equity.toLocaleString()} (${equityPercentage.toFixed(1)}%)</li>
                        <li>Property Type: ${propertyType}</li>
                    </ul>
                    <p><strong>Note:</strong> You can still proceed with this strategy, but results may not be realistic.</p>
                </div>
            `;
        }
        
        resultsDiv.innerHTML = resultHTML;
        
        // Switch to step 2
        step1.style.display = 'none';
        step2.style.display = 'block';
        backBtn.style.display = 'inline-block';
        nextBtn.textContent = 'Continue to Next Strategy →';
        
    } else {
        // On step 2, close modal and continue
        const modal = document.getElementById('reverse-mortgage-modal');
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        
        // Call the completion callback
        if (onCompleteCallback && typeof onCompleteCallback === 'function') {
            onCompleteCallback();
        }
    }
}

function calculateAvailableEquity() {
    const homeValue = parseFloat(document.getElementById('he-home-value').value) || 0;
    const mortgageBalance = parseFloat(document.getElementById('he-current-mortgage').value) || 0;
    const availableEquity = Math.max(0, (homeValue * 0.8) - mortgageBalance);
    document.getElementById('he-available-equity').value = Math.round(availableEquity);
}

function handleMethodChange() {
    const methodSelect = document.getElementById('he-method');
    const method = methodSelect ? methodSelect.value : null;
    
    if (method === 'reverse') {
        // Show a note about reverse mortgage
        const existingNote = document.querySelector('.reverse-mortgage-note');
        if (!existingNote) {
            const note = document.createElement('div');
            note.className = 'reverse-mortgage-note';
            note.style.cssText = 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 0.9rem;';
            note.innerHTML = `
                <strong>⚠️ Reverse Mortgage Note:</strong><br>
                • Minimum age: 55 years old<br>
                • Must be primary residence<br>
                • Requires sufficient home equity (typically 20%+)<br>
                • Click "Save & Continue" to check qualification
            `;
            
            const inputSection = document.querySelector('.input-section');
            if (inputSection) {
                inputSection.appendChild(note);
            }
        }
    } else {
        // Remove note if not reverse mortgage
        const existingNote = document.querySelector('.reverse-mortgage-note');
        if (existingNote) existingNote.remove();
    }
}

// ============================================ 
// COMPARISON PAGE ENHANCED DISPLAY FUNCTIONS
// ============================================
/*
function initializeComparisonPage() {
    // Load results from localStorage
    const savedResults = localStorage.getItem('modelResults');
    const savedModels = localStorage.getItem('feasibleModels');
    const savedInputs = localStorage.getItem('modelInputs');
    
    if (!savedResults || !savedModels) {
        // No results, go back to cover page
        window.location.href = 'index.html';
        return;
    }
    
    allResults = JSON.parse(savedResults);
    feasibleModels = JSON.parse(savedModels);
    modelInputs = JSON.parse(savedInputs || '{}');
    
    console.log('Initializing comparison page with results:', allResults);
    
    // Generate comprehensive comparison charts and table
    generateEnhancedComparisonCharts();
    generateDetailedComparisonTable();
    displayModelDetailedResults();
    determineEnhancedWinner();
    
    // Check local storage content
    debugLocalStorage();
    
    // Update with reverse mortgage status
    setTimeout(() => {
        updateComparisonWithReverseMortgageStatus();
    }, 500);
    
    // Check post-analysis completion status for print button
    updatePrintButtonState();
    
    // Add detailed reports button
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        const reportsBtn = document.createElement('button');
        reportsBtn.id = 'detailed-reports-btn';
        reportsBtn.innerHTML = '📋 View Detailed Calculations';
        reportsBtn.style.cssText = 'padding: 10px 20px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;';
        reportsBtn.onclick = showDetailedModelReports;
        actionButtons.appendChild(reportsBtn);
    }
}

function generateEnhancedComparisonCharts() {
    const barCtx = document.getElementById('comparison-bar-chart');
    const pieCtx = document.getElementById('winning-pie-chart');
    
    if (!barCtx || !pieCtx) return;
    
    // Prepare data
    const labels = [];
    const netBenefits = [];
    const riskLevels = [];
    const timeToHome = [];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
    
    feasibleModels.forEach((modelId, index) => {
        const model = MODELS[modelId];
        const result = allResults[modelId];
        
        labels.push(model.name);
        netBenefits.push(result.netBenefit || 0);
        riskLevels.push(result.risk || 3);
        timeToHome.push(result.timeToHome || 0);
    });
    
    // Clear existing canvas if needed
    if (barCtx.chart) {
        barCtx.chart.destroy();
    }
    
    // Enhanced Bar Chart with multiple datasets
    barCtx.chart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Net Benefit ($)',
                    data: netBenefits,
                    backgroundColor: colors.slice(0, feasibleModels.length).map(c => c + 'CC'),
                    borderColor: colors.slice(0, feasibleModels.length),
                    borderWidth: 2,
                    yAxisID: 'y',
                    order: 1
                },
                {
                    label: 'Risk Level (1-5)',
                    data: riskLevels,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1',
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Net Benefit ($)'
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Risk Level'
                    },
                    min: 1,
                    max: 5,
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Strategy Comparison: Net Benefit vs Risk'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            let value = context.parsed.y;
                            
                            if (context.dataset.label === 'Net Benefit ($)') {
                                return `${label}: $${value.toLocaleString()}`;
                            } else if (context.dataset.label === 'Risk Level (1-5)') {
                                const riskText = getRiskLabel(value);
                                return `${label}: ${value} (${riskText})`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
    
    // Pie Chart for success probability or comfort
    if (pieCtx.chart) {
        pieCtx.chart.destroy();
    }
    
    const comfortData = [];
    feasibleModels.forEach(modelId => {
        const inputs = modelInputs[modelId];
        const result = allResults[modelId];
        const comfort = inputs?.comfort || inputs?.feasibilityComfort || 3;
        const successProb = result.successProbability || result.successRate || 50;
        
        // Use success probability if available, otherwise comfort
        comfortData.push(successProb);
    });
    
    pieCtx.chart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: comfortData,
                backgroundColor: colors.slice(0, feasibleModels.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Success Probability Distribution'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label;
                            const value = context.raw;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            }
        }
    });
}

function generateDetailedComparisonTable() {
    const tbody = document.getElementById('comparison-results-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    feasibleModels.forEach((modelId, index) => {
        const model = MODELS[modelId];
        const result = allResults[modelId];
        const inputs = modelInputs[modelId];
        const comfort = inputs?.comfort || inputs?.feasibilityComfort || 3;
        
        // Get risk display
        let riskDisplay = getRiskLabel(result.risk || 3);
        let riskColor = getRiskColor(result.risk || 3);
        
        // Get time to home display
        let timeDisplay = result.timeToHome === 0 ? 'Immediate' : `${result.timeToHome} years`;
        
        // Get success probability
        let successProb = result.successProbability || result.successRate || 'N/A';
        if (typeof successProb === 'number') {
            successProb = `${successProb}%`;
        }
        
        // Get net benefit formatted
        const netBenefit = result.netBenefit || 0;
        const netBenefitFormatted = `$${netBenefit.toLocaleString()}`;
        const netBenefitClass = netBenefit >= 0 ? 'positive' : 'negative';
        
        // Additional info for specific models
        let additionalInfo = '';
        
        // Home Equity specific info
        if (modelId === 'home-equity') {
            if (result.method === 'reverse') {
                if (result.qualificationNote) {
                    additionalInfo = `<div class="qualification-badge">${result.qualificationNote}</div>`;
                }
                // Show both scenarios if available
                if (result.scenarios) {
                    additionalInfo += `<div class="scenario-note">Compare: ${result.scenarioNames?.reverse || 'Reverse Mortgage'} vs ${result.scenarioNames?.traditional || 'Traditional Loan'}</div>`;
                }
            }
        }
        
        // Three for Thirty specific info
        if (modelId === 'three-thirty') {
            if (result.meetsDownPaymentGoal !== undefined) {
                const status = result.meetsDownPaymentGoal ? '✓ Goal met' : '⚠️ Needs more time';
                additionalInfo += `<div class="goal-status">${status}</div>`;
            }
        }
        
        // Create table row
        const row = document.createElement('tr');
        row.className = 'model-row';
        row.dataset.modelId = modelId;
        row.onclick = () => showModelDetailsModal(modelId);
        
        row.innerHTML = `
            <td class="model-name-cell">
                <div class="model-name-container">
                    <strong class="model-name">${model.name}</strong>
                    <div class="model-subtitle">${model.subtitle}</div>
                    ${additionalInfo}
                </div>
            </td>
            <td class="net-benefit-cell ${netBenefitClass}">
                ${result.childBeneiftValue}
            </td>
            <td class="risk-cell">
                <div class="risk-display">
                    <div class="risk-bar-container">
                        <div class="risk-bar" style="width: ${(result.risk || 3) * 20}%; background-color: ${riskColor};"></div>
                    </div>
                    <span class="risk-label">${riskDisplay}</span>
                    <span class="risk-value">(${result.risk || 3}/5)</span>
                </div>
            </td>
            <td class="time-cell">
                ${timeDisplay}
            </td>
            <td class="success-cell">
                ${successProb}
            </td>
            <td class="comfort-cell">
                <div class="comfort-display">
                    <div class="stars">
                        ${'★'.repeat(comfort)}${'☆'.repeat(5 - comfort)}
                    </div>
                    <span class="comfort-value">(${comfort}/5)</span>
                </div>
            </td>
            <td class="details-cell">
                <button class="details-btn" onclick="showModelDetailsModal('${modelId}')">View Details</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function displayModelDetailedResults() {
    const container = document.getElementById('detailed-results-container');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'detailed-results-container';
        newContainer.className = 'detailed-results-container';
        
        // Insert after comparison table
        const comparisonTable = document.querySelector('.comparison-table-container');
        if (comparisonTable) {
            comparisonTable.parentNode.insertBefore(newContainer, comparisonTable.nextSibling);
        } else {
            document.querySelector('.card').appendChild(newContainer);
        }
        return;
    }
    
    container.innerHTML = '';
    
    feasibleModels.forEach((modelId, index) => {
        const model = MODELS[modelId];
        const result = allResults[modelId];
        
        const detailCard = document.createElement('div');
        detailCard.className = 'model-detail-card';
        detailCard.id = `detail-card-${modelId}`;
        
        detailCard.innerHTML = generateModelDetailContent(modelId, model, result);
        
        container.appendChild(detailCard);
    });
}

function generateModelDetailContent(modelId, model, result) {
    let html = `
        <div class="detail-card-header">
            <h3>${model.name} - Detailed Analysis</h3>
            <div class="model-subtitle">${model.subtitle}</div>
        </div>
        
        <div class="detail-card-body">
            <div class="key-metrics-grid">
                <div class="metric-box">
                    <div class="metric-label">Net Benefit (30 yrs)</div>
                    <div class="metric-value ${result.netBenefit >= 0 ? 'positive' : 'negative'}">
                        $${(result.netBenefit || 0).toLocaleString()}
                    </div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">Risk Level</div>
                    <div class="metric-value">
                        ${result.risk || 3}/5 (${getRiskLabel(result.risk || 3)})
                    </div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">Time to Home</div>
                    <div class="metric-value">
                        ${result.timeToHome === 0 ? 'Immediate' : result.timeToHome + ' years'}
                    </div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">Success Probability</div>
                    <div class="metric-value">
                        ${result.successProbability || result.successRate || 'N/A'}%
                    </div>
                </div>
            </div>
    `;
    
    // Model-specific detailed content
    html += generateModelSpecificDetails(modelId, result);
    
    html += `
            <div class="assumptions-section">
                <h4>Key Assumptions</h4>
                <ul class="assumptions-list">
                    ${generateAssumptionsList(modelId, result)}
                </ul>
            </div>
            
            <div class="recommendation-section">
                <h4>Recommendation</h4>
                <div class="recommendation-content">
                    ${generateRecommendation(modelId, result)}
                </div>
            </div>
        </div>
        
        <div class="detail-card-footer">
            <button class="secondary-btn" onclick="closeModelDetail('${modelId}')">Close</button>
        </div>
    `;
    
    return html;
}

function generateModelSpecificDetails(modelId, result) {
    let html = '<div class="model-specific-details">';
    
    switch(modelId) {
        case 'three-thirty':
            html += `
                <h4>Scenario Analysis</h4>
                <div class="scenario-comparison">
                    <div class="scenario">
                        <h5>Parent Loan (Immediate Purchase)</h5>
                        <div class="scenario-metrics">
                            <div>Total Equity: $${(result.scenario1Equity || 0).toLocaleString()}</div>
                            <div>Monthly Payment: $${(result.scenario1MonthlyPayment || 0).toLocaleString()}</div>
                            <div>Total Interest: $${(result.scenario1TotalInterest || 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="scenario">
                        <h5>3-Year Savings Plan</h5>
                        <div class="scenario-metrics">
                            <div>Total Equity: $${(result.scenario2Equity || 0).toLocaleString()}</div>
                            <div>Monthly Payment: $${(result.scenario2MonthlyPayment || 0).toLocaleString()}</div>
                            <div>Down Payment: $${(result.scenario2SavingsAmount || 0).toLocaleString()}</div>
                            <div>DP Percentage: ${result.scenario2DownPaymentPercent || 0}%</div>
                        </div>
                    </div>
                </div>
                <div class="comparison-summary">
                    <strong>Summary:</strong> ${result.meetsDownPaymentGoal ? 'Savings plan meets down payment goal.' : 'Savings plan falls short of goal.'}
                    ${result.equityDifference ? ` Equity difference: $${result.equityDifference.toLocaleString()}` : ''}
                </div>
            `;
            break;
            
        case 'co-investing':
            html += `
                <h4>Investment vs Loan Comparison</h4>
                <div class="scenario-comparison">
                    <div class="scenario">
                        <h5>Keep in Stocks</h5>
                        <div class="scenario-metrics">
                            <div>Future Value: $${(result.stockAfterTax || 0).toLocaleString()}</div>
                            <div>After Tax: $${(result.stockAfterTax || 0).toLocaleString()}</div>
                            <div>Tax Paid: $${(result.stockTax || 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="scenario">
                        <h5>Lend to Child</h5>
                        <div class="scenario-metrics">
                            <div>Total Value: $${(result.lendingScenarioValue || 0).toLocaleString()}</div>
                            <div>Child's Equity: $${(result.childEquity || 0).toLocaleString()}</div>
                            <div>Parent Interest: $${(result.parentInterestAfterTax || 0).toLocaleString()}</div>
                            <div>Home Future Value: $${(result.homeFutureValue || 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                <div class="comparison-summary">
                    <strong>Net Benefit:</strong> $${(result.netBenefit || 0).toLocaleString()} 
                    (${result.netBenefit >= 0 ? 'Lending is better' : 'Keeping in stocks is better'})
                </div>
            `;
            break;
            
        case 'multi-gen':
            html += `
                <h4>Construction Investment Analysis</h4>
                <div class="scenario-comparison">
                    <div class="scenario">
                        <h5>Child's Position</h5>
                        <div class="scenario-metrics">
                            <div>Net Benefit: $${(result.childNetBenefit || 0).toLocaleString()}</div>
                            <div>Equity Value: $${(result.childEquityValue || 0).toLocaleString()}</div>
                            <div>Total Payments: $${(result.childTotalPayments || 0).toLocaleString()}</div>
                            <div>Monthly Payment: $${(result.monthlyConstructionPayment || 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="scenario">
                        <h5>Parent's Position</h5>
                        <div class="scenario-metrics">
                            <div>Net Benefit: $${(result.parentNetBenefit || 0).toLocaleString()}</div>
                            <div>Future Equity: $${(result.parentFutureEquity || 0).toLocaleString()}</div>
                            <div>Equity Share: ${result.parentEquityPercentage || 0}%</div>
                        </div>
                    </div>
                </div>
                <div class="property-details">
                    <div><strong>Build Type:</strong> ${result.buildType || 'Not specified'}</div>
                    <div><strong>Construction Cost:</strong> $${(result.buildCost || 0).toLocaleString()}</div>
                    <div><strong>Future Property Value:</strong> $${(result.futurePropertyValue || 0).toLocaleString()}</div>
                    <div><strong>Living Years:</strong> ${result.livingYears || 0} years</div>
                </div>
            `;
            break;
            
        case 'early-inheritance':
            html += `
                <h4>Inheritance Timing Analysis</h4>
                <div class="scenario-comparison">
                    <div class="scenario">
                        <h5>Early Inheritance</h5>
                        <div class="scenario-metrics">
                            <div>Child's Equity: $${(result.earlyScenario?.childEquity || 0).toLocaleString()}</div>
                            <div>Home Value: $${(result.earlyScenario?.futureHomeValue || 0).toLocaleString()}</div>
                            <div>Monthly Payment: $${(result.earlyScenario?.monthlyMortgagePayment || 0).toLocaleString()}</div>
                            <div>Debt Service Ratio: ${result.earlyScenario?.debtServiceRatio || 0}</div>
                        </div>
                    </div>
                    <div class="scenario">
                        <h5>Late Inheritance (Renting)</h5>
                        <div class="scenario-metrics">
                            <div>Net Wealth: $${(result.lateScenario?.childNetWealth || 0).toLocaleString()}</div>
                            <div>Total Rent Cost: $${(result.lateScenario?.totalRentCost || 0).toLocaleString()}</div>
                            <div>Inheritance Value: $${(result.lateScenario?.lateInheritanceValue || 0).toLocaleString()}</div>
                            <div>Rent to Income (Year 1): ${result.lateScenario?.firstYearRentRatio || 0}</div>
                        </div>
                    </div>
                </div>
                <div class="comparison-summary">
                    <strong>Difference:</strong> $${(result.equityVsRentDifference || 0).toLocaleString()}
                    <br><strong>Recommendation:</strong> ${result.recommendation || 'Consider both options carefully'}
                </div>
            `;
            break;
            
        case 'home-equity':
            html += generateHomeEquityDetailedContent(result);
            break;
            
        default:
            html += `<p>Detailed analysis not available for this model.</p>`;
    }
    
    html += '</div>';
    return html;
}

function generateHomeEquityDetailedContent(result) {
    let html = `
        <h4>Home Equity Strategy Analysis</h4>
        <div class="strategy-method">
            <strong>Selected Method:</strong> ${result.method || 'Not specified'}
            ${result.qualificationNote ? `<div class="qualification-note">${result.qualificationNote}</div>` : ''}
        </div>
    `;
    
    // Show both scenarios if available
    if (result.scenarios) {
        html += `
            <div class="scenario-comparison-wide">
                <div class="scenario">
                    <h5>${result.scenarios.reverseMortgage?.scenarioName || 'Reverse Mortgage'}</h5>
                    <div class="scenario-metrics">
                        <div>Child Net Benefit: $${(result.scenarios.reverseMortgage?.childNetBenefit || 0).toLocaleString()}</div>
                        <div>Child's Equity: $${(result.scenarios.reverseMortgage?.childEquity30 || 0).toLocaleString()}</div>
                        <div>Monthly Payment: $${(result.scenarios.reverseMortgage?.childMonthlyPayment || 0).toLocaleString()}</div>
                        <div>Interest Paid: $${(result.scenarios.reverseMortgage?.childInterestPaid || 0).toLocaleString()}</div>
                        ${result.scenarios.reverseMortgage?.equityExhaustionYear ? 
                            `<div class="warning">⚠️ Equity exhaustion in year ${result.scenarios.reverseMortgage.equityExhaustionYear}</div>` : ''}
                        <div>Debt Service Ratio: ${result.scenarios.reverseMortgage?.debtServiceRatio || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="scenario">
                    <h5>${result.scenarios.traditionalLoan?.scenarioName || 'Traditional Loan'}</h5>
                    <div class="scenario-metrics">
                        <div>Child Net Benefit: $${(result.scenarios.traditionalLoan?.childNetBenefit || 0).toLocaleString()}</div>
                        <div>Child's Equity: $${(result.scenarios.traditionalLoan?.childEquity30 || 0).toLocaleString()}</div>
                        <div>Monthly Payment: $${(result.scenarios.traditionalLoan?.childMonthlyPayment || 0).toLocaleString()}</div>
                        <div>+ Loan Payment: $${(result.scenarios.traditionalLoan?.childAdditionalMonthlyPayment || 0).toLocaleString()}</div>
                        <div>Total Interest: $${(result.scenarios.traditionalLoan?.childInterestPaid + result.scenarios.traditionalLoan?.loanInterestPaid || 0).toLocaleString()}</div>
                        <div>Debt Service Ratio: ${result.scenarios.traditionalLoan?.debtServiceRatio || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Comparison metrics
        if (result.comparison) {
            html += `
                <div class="comparison-summary">
                    <h5>Comparison Results</h5>
                    <div class="comparison-metrics">
                        <div><strong>Net Benefit Difference:</strong> $${(result.comparison.netBenefitDifference || 0).toLocaleString()}</div>
                        <div><strong>Total Cost Difference:</strong> $${(result.comparison.totalCostDifference || 0).toLocaleString()}</div>
                        <div><strong>Equity Difference:</strong> $${(result.comparison.equityDifference || 0).toLocaleString()}</div>
                        <div><strong>Recommendation:</strong> ${result.comparison.recommendation || 'No clear winner'}</div>
                    </div>
                </div>
            `;
        }
    } else {
        // Fallback to single scenario display
        html += `
            <div class="scenario-analysis">
                <div class="scenario-metrics">
                    <div>Child Net Benefit: $${(result.childNetBenefit || 0).toLocaleString()}</div>
                    <div>Child's Equity: $${(result.childEquity30 || 0).toLocaleString()}</div>
                    <div>Home Value: $${(result.childHomeValue30 || 0).toLocaleString()}</div>
                    <div>Total Payments: $${(result.childTotalPayments || 0).toLocaleString()}</div>
                    ${result.debtServiceRatio ? `<div>Debt Service Ratio: ${result.debtServiceRatio}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // Parent's situation
    html += `
        <div class="parent-impact">
            <h5>Parent's Impact</h5>
            <div class="impact-metrics">
                ${result.parentNetEquity !== undefined ? `<div>Parent Net Equity: $${(result.parentNetEquity || 0).toLocaleString()}</div>` : ''}
                ${result.parentCostOrDebt !== undefined ? `<div>Parent Cost/Debt: $${(result.parentCostOrDebt || 0).toLocaleString()}</div>` : ''}
            </div>
        </div>
    `;
    
    return html;
}

function generateAssumptionsList(modelId, result) {
    const assumptions = [];
    
    // Common assumptions
    assumptions.push('30-year analysis horizon');
    assumptions.push('4% annual home appreciation');
    
    // Model-specific assumptions
    switch(modelId) {
        case 'three-thirty':
            assumptions.push('70% savings rate during rent-free period');
            assumptions.push('Standard 25-year mortgage term');
            break;
        case 'co-investing':
            assumptions.push('6% stock market return');
            assumptions.push('5% loan interest rate to child');
            assumptions.push('25% marginal tax rate');
            break;
        case 'multi-gen':
            assumptions.push('Construction loan at 5.5% interest');
            assumptions.push('Child receives 15% equity share');
            break;
        case 'early-inheritance':
            assumptions.push('3% annual rent inflation');
            assumptions.push('4.5% mortgage rate for child');
            break;
        case 'home-equity':
            assumptions.push('HELOC interest rate of 5.5%');
            assumptions.push('Reverse mortgage rate 1% higher than HELOC');
            break;
    }
    
    // Return as HTML list
    return assumptions.map(assumption => `<li>${assumption}</li>`).join('');
}

function generateRecommendation(modelId, result) {
    const netBenefit = result.netBenefit || 0;
    const risk = result.risk || 3;
    
    if (netBenefit > 100000) {
        return `⭐ <strong>Highly Recommended</strong> - This strategy shows strong financial benefits with manageable risk. Consider as your primary option.`;
    } else if (netBenefit > 0) {
        return `✅ <strong>Recommended</strong> - Positive financial outcome with reasonable risk. A solid choice for your situation.`;
    } else if (netBenefit > -50000) {
        return `⚠️ <strong>Consider with Caution</strong> - Limited financial benefit. May be suitable if non-financial factors are important.`;
    } else {
        return `❌ <strong>Not Recommended</strong> - This strategy shows negative financial outcomes. Consider alternative options.`;
    }
}

function determineEnhancedWinner() {
    // Enhanced winner determination with weighted scoring
    let bestScore = -Infinity;
    let bestModel = null;
    let bestResult = null;
    
    feasibleModels.forEach(modelId => {
        const result = allResults[modelId];
        const inputs = modelInputs[modelId];
        const comfort = inputs?.comfort || inputs?.feasibilityComfort || 3;
        
        // Weighted scoring:
        // 40% net benefit (scaled to $100k)
        // 25% risk (inverse - lower risk is better)
        // 20% comfort
        // 15% time to home (faster is better)
        
        const benefitScore = (result.netBenefit || 0) / 100000 * 40;
        const riskScore = (5 - (result.risk || 3)) * 5; // 5 points per risk level lower
        const comfortScore = comfort * 4; // 4 points per comfort level
        const timeScore = result.timeToHome === 0 ? 15 : Math.max(0, 15 - (result.timeToHome || 5));
        
        const totalScore = benefitScore + riskScore + comfortScore + timeScore;
        
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestModel = modelId;
            bestResult = result;
        }
    });
    
    if (bestModel) {
        const model = MODELS[bestModel];
        const winnerDiv = document.getElementById('overall-winner');
        const reasoningDiv = document.getElementById('winner-reasoning');
        
        if (winnerDiv) {
            winnerDiv.textContent = model.name;
        }
        
        if (reasoningDiv) {
            reasoningDiv.innerHTML = `
                <div class="winner-details">
                    <div class="winner-metric">Net Benefit: <strong>$${(bestResult.netBenefit || 0).toLocaleString()}</strong></div>
                    <div class="winner-metric">Risk Level: <strong>${bestResult.risk || 3}/5 (${getRiskLabel(bestResult.risk || 3)})</strong></div>
                    <div class="winner-metric">Time to Home: <strong>${bestResult.timeToHome === 0 ? 'Immediate' : bestResult.timeToHome + ' years'}</strong></div>
                    <div class="winner-description">${model.description}</div>
                </div>
            `;
        }
        
        // Add visual highlight to winning row in table
        setTimeout(() => {
            const winningRow = document.querySelector(`tr[data-model-id="${bestModel}"]`);
            if (winningRow) {
                winningRow.classList.add('winner-row');
                winningRow.insertAdjacentHTML('beforeend', 
                    `<td class="winner-badge">⭐ Recommended</td>`
                );
            }
        }, 100);
    }
}

// Modal function for detailed view
function showModelDetailsModal(modelId) {
    const model = MODELS[modelId];
    const result = allResults[modelId];
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('model-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'model-details-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 85vh;">
                <div class="modal-header">
                    <h2>Detailed Analysis</h2>
                    <button class="close-modal" onclick="closeModelDetailsModal()">×</button>
                </div>
                <div class="modal-body" id="model-details-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Populate content
    const contentDiv = document.getElementById('model-details-content');
    if (contentDiv) {
        contentDiv.innerHTML = generateModelDetailContent(modelId, model, result);
    }
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModelDetailsModal() {
    const modal = document.getElementById('model-details-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}
*/

        function initializeComparisonPage() {
            console.log('Initializing comparison page...');
            
            // Load data from localStorage
            const modelResults = JSON.parse(localStorage.getItem('modelResults') || '{}');
            const feasibleModels = JSON.parse(localStorage.getItem('feasibleModels') || '[]');
            const modelInputs = JSON.parse(localStorage.getItem('modelInputs') || '{}');
            
            if (feasibleModels.length === 0 || Object.keys(modelResults).length === 0) {
                console.error('No results to display');
                window.location.href = 'Models.html';
                return;
            }
            
            console.log('Model results:', modelResults);
            console.log('Feasible models:', feasibleModels);
            
            // Update comparison table
            updateComparisonTable(modelResults, feasibleModels, modelInputs);
            
            // Create charts
            createPerformanceBarChart(modelResults, feasibleModels);
            createOptionsComparisonChart(modelResults, feasibleModels);
            
            // Determine and display overall winner
            determineOverallWinner(modelResults, feasibleModels);
            
            // Update reverse mortgage status if applicable
            updateComparisonWithReverseMortgageStatus();

        }

        function updateComparisonTable(modelResults, feasibleModels, modelInputs) {
            const tbody = document.getElementById('comparison-results-body');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            feasibleModels.forEach(modelId => {
                const result = modelResults[modelId];
                if (!result) return;
                
                const model = MODELS[modelId];
                const comfort = getComfortLevel(modelId, modelInputs);
                const recommendation = getRecommendation(result, modelId);
                
                const row = document.createElement('tr');
                
                // Format currency properly
                const performanceValue = result.childBeneiftValue || result.netBenefit || 0;
                const formattedPerformance = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(performanceValue);
                
                row.innerHTML = `
                    <td><strong>${model.name}</strong><br><small>${model.description}</small></td>
                    <td style="font-weight: bold; color: ${performanceValue >= 0 ? '#27ae60' : '#e74c3c'}">
                        ${formattedPerformance}
                    </td>
                    <td><span class="risk-badge risk-${result.risk || 3}">${result.risk || 3}/5</span></td>
                    <td>${comfort}</td>
                    <td>${recommendation}</td>
                `;
                
                tbody.appendChild(row);
            });
        }

        function getComfortLevel(modelId, modelInputs) {
            const comfort = modelInputs[modelId]?.comfort || 3;
            let comfortText = '';
            let comfortClass = '';
            
            if (comfort >= 4) {
                comfortText = 'High';
                comfortClass = 'comfort-high';
            } else if (comfort >= 3) {
                comfortText = 'Medium';
                comfortClass = 'comfort-medium';
            } else {
                comfortText = 'Low';
                comfortClass = 'comfort-low';
            }
            
            return `<span class="comfort-badge ${comfortClass}">${comfortText}</span>`;
        }

        function getRecommendation(result, modelId) {
            let recommendation = 'Needs Review';
            let color = '#f39c12';
            
            if (modelId === 'home-equity') {
                const method = result.method || 'heloc';
                if (method === 'reverse' && result.qualification?.status === 'likely_qualified') {
                    recommendation = 'Reverse Mortgage';
                    color = '#27ae60';
                } else if (method === 'reverse' && result.qualification?.status !== 'likely_qualified') {
                    recommendation = 'HELOC Recommended';
                    color = '#e74c3c';
                } else {
                    recommendation = 'HELOC';
                    color = '#3498db';
                }
            } else {
                const performance = result.childBeneiftValue || result.netBenefit || 0;
                const risk = result.risk || 3;
                
                if (performance > 100000 && risk <= 3) {
                    recommendation = 'Strongly Recommended';
                    color = '#27ae60';
                } else if (performance > 50000 && risk <= 4) {
                    recommendation = 'Recommended';
                    color = '#2ecc71';
                } else if (performance > 0) {
                    recommendation = 'Consider';
                    color = '#f39c12';
                } else {
                    recommendation = 'Not Recommended';
                    color = '#e74c3c';
                }
            }
            
            return `<span style="color: ${color}; font-weight: bold;">${recommendation}</span>`;
        }

        function createPerformanceBarChart(modelResults, feasibleModels) {
            const ctx = document.getElementById('performance-bar-chart');
            if (!ctx) return;
            
            const labels = [];
            const data = [];
            const colors = [];
            
            feasibleModels.forEach(modelId => {
                const result = modelResults[modelId];
                if (!result) return;
                
                const model = MODELS[modelId];
                labels.push(model.name);
                
                const performanceValue = result.childBeneiftValue || result.netBenefit || 0;
                data.push(performanceValue);
                
                // Color based on performance
                if (performanceValue >= 0) {
                    colors.push(performanceValue > 100000 ? '#27ae60' : '#2ecc71');
                } else {
                    colors.push('#e74c3c');
                }
            });
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Child Benefit Value (30 years)',
                        data: data,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace('0.8', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    return new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Child Benefit Value ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Strategy'
                            }
                        }
                    }
                }
            });
        }

        function createOptionsComparisonChart(modelResults, feasibleModels) {
            const ctx = document.getElementById('options-comparison-chart');
            if (!ctx) return;
            
            const comparisonLabels = {
                'three-thirty': 'Saving 3 Years vs. Parent Loan',
                'co-investing': 'Stock vs. Real Estate (Co-Investing)',
                'multi-gen': 'MGL vs. Child Living Elsewhere',
                'early-inheritance': 'Early vs. Late Inheritance',
                'home-equity': 'Reverse Mortgage vs. HELOC'
            };
            
            const labels = [];
            const data = [];
            const colors = [];
            
            feasibleModels.forEach(modelId => {
                const result = modelResults[modelId];
                if (!result) return;
                
                const label = comparisonLabels[modelId] || MODELS[modelId].name;
                labels.push(label);
                
                // Use net benefit as the difference between options
                const optionDifference = result.netBenefit || 0;
                data.push(optionDifference);
                
                // Color based on difference
                if (optionDifference >= 0) {
                    colors.push(optionDifference > 50000 ? '#27ae60' : '#2ecc71');
                } else {
                    colors.push('#e74c3c');
                }
            });
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Option Difference ($)',
                        data: data,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace('0.8', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const labelText = value >= 0 ? 'Better than alternative' : 'Worse than alternative';
                                    const formattedValue = new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(Math.abs(value));
                                    return `${labelText} by ${formattedValue}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Option Difference ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Strategy Comparison'
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    }
                }
            });
        }

        function determineOverallWinner(modelResults, feasibleModels) {
            if (feasibleModels.length === 0) return;
            
            let bestModelId = null;
            let bestPerformance = -Infinity;
            let bestRiskScore = Infinity;
            
            // First pass: find models with best performance
            feasibleModels.forEach(modelId => {
                const result = modelResults[modelId];
                if (!result) return;
                
                const performance = result.childBeneiftValue || result.netBenefit || 0;
                const risk = result.risk || 3;
                
                // Weighted score: 70% performance, 30% risk (inverse)
                const riskScore = 6 - risk; // Convert to positive (1=worst, 5=best -> 5=best, 1=worst)
                const weightedScore = (performance * 0.7) + (riskScore * 100000 * 0.3);
                
                if (weightedScore > bestPerformance) {
                    bestPerformance = weightedScore;
                    bestModelId = modelId;
                    bestRiskScore = risk;
                }
            });
            
            if (!bestModelId) return;
            
            const bestResult = modelResults[bestModelId];
            const bestModel = MODELS[bestModelId];
            
            const winnerElement = document.getElementById('overall-winner');
            const reasoningElement = document.getElementById('winner-reasoning');
            
            if (winnerElement) {
                winnerElement.textContent = `${bestModel.name} (${bestModel.subtitle})`;
            }
            
            if (reasoningElement) {
                const performanceValue = bestResult.childBeneiftValue || bestResult.netBenefit || 0;
                const formattedPerformance = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(performanceValue);
                
                let reasoning = '';
                
                if (bestModelId === 'home-equity') {
                    const method = bestResult.method || 'heloc';
                    if (method === 'reverse' && bestResult.qualification?.status === 'likely_qualified') {
                        reasoning = `Reverse mortgage provides better cash flow for parents while enabling home purchase. Estimated child benefit: ${formattedPerformance}.`;
                    } else {
                        reasoning = `HELOC offers more flexibility and control. Estimated child benefit: ${formattedPerformance}.`;
                    }
                } else {
                    reasoning = `Best combination of child benefit (${formattedPerformance}) and manageable risk (${bestRiskScore}/5).`;
                }
                
                reasoningElement.textContent = reasoning;
            }
        }

// Utility functions
function getRiskLabel(riskLevel) {
    if (riskLevel <= 1.5) return 'Very Low';
    if (riskLevel <= 2.5) return 'Low';
    if (riskLevel <= 3.5) return 'Medium';
    if (riskLevel <= 4.5) return 'High';
    return 'Very High';
}

function getRiskColor(riskLevel) {
    if (riskLevel <= 1.5) return '#2ecc71'; // Green
    if (riskLevel <= 2.5) return '#3498db'; // Blue
    if (riskLevel <= 3.5) return '#f39c12'; // Orange
    if (riskLevel <= 4.5) return '#e74c3c'; // Red
    return '#8e44ad'; // Purple for very high
}

// Add CSS for enhanced display
function addEnhancedComparisonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .model-row {
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .model-row:hover {
            background-color: #f8f9fa;
        }
        
        .model-name-cell {
            min-width: 200px;
        }
        
        .model-name-container {
            display: flex;
            flex-direction: column;
        }
        
        .model-subtitle {
            font-size: 0.85rem;
            color: #666;
            margin-top: 2px;
        }
        
        .net-benefit-cell {
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .net-benefit-cell.positive {
            color: #27ae60;
        }
        
        .net-benefit-cell.negative {
            color: #e74c3c;
        }
        
        .risk-display {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .risk-bar-container {
            flex: 1;
            height: 8px;
            background-color: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .risk-bar {
            height: 100%;
            transition: width 0.3s;
        }
        
        .comfort-display {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .stars {
            color: #f1c40f;
            font-size: 1.2rem;
        }
        
        .comfort-value {
            color: #666;
            font-size: 0.9rem;
        }
        
        .details-btn {
            padding: 5px 15px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .details-btn:hover {
            background: #2980b9;
        }
        
        .detailed-results-container {
            margin-top: 30px;
        }
        
        .model-detail-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #3498db;
        }
        
        .detail-card-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .key-metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .metric-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        
        .metric-label {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 1.2rem;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .metric-value.positive {
            color: #27ae60;
        }
        
        .metric-value.negative {
            color: #e74c3c;
        }
        
        .scenario-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .scenario {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
        }
        
        .scenario h5 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
        }
        
        .scenario-metrics div {
            margin: 5px 0;
            padding: 3px 0;
            border-bottom: 1px dashed #eee;
        }
        
        .scenario-metrics div:last-child {
            border-bottom: none;
        }
        
        .comparison-summary {
            background: #e8f4fc;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        
        .winner-row {
            background: linear-gradient(to right, #fff8e1, #fff) !important;
            border-left: 4px solid #f1c40f;
        }
        
        .winner-badge {
            color: #f39c12;
            font-weight: bold;
        }
        
        .qualification-badge {
            display: inline-block;
            padding: 3px 8px;
            background: #d4edda;
            color: #155724;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-top: 5px;
        }
        
        .goal-status {
            display: inline-block;
            padding: 3px 8px;
            background: #e8f4fc;
            color: #2980b9;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-top: 5px;
        }
        
        .scenario-note {
            font-size: 0.85rem;
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .winner-box.winner {
            background: linear-gradient(135deg, #fef9e7, #fff);
            border: 2px solid #f1c40f;
        }
        
        .winner-details {
            margin-top: 10px;
        }
        
        .winner-metric {
            margin: 5px 0;
            padding: 8px 15px;
            background: #f8f9fa;
            border-radius: 4px;
            display: inline-block;
            margin-right: 10px;
        }
        
        .winner-description {
            margin-top: 10px;
            font-style: italic;
            color: #666;
        }
    `;
    document.head.appendChild(style);
}

// Call this function on comparison page initialization
addEnhancedComparisonStyles();


// ============================================
// DETAILED MODEL CALCULATION REPORT FUNCTIONS
// ============================================
/*
function showDetailedModelReports() {
    console.log('Generating detailed model calculation reports...');
    
    // Create modal for reports
    const modal = document.createElement('div');
    modal.id = 'detailed-reports-modal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 1000;
        display: block;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            margin: 20px auto;
            padding: 0;
            width: 90%;
            max-width: 1200px;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        ">
            <div class="modal-header" style="
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h2 style="margin: 0;">📊 Detailed Model Calculation Reports</h2>
                <button class="close-modal" onclick="document.getElementById('detailed-reports-modal').remove()" 
                        style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">
                    ×
                </button>
            </div>
            
            <div class="modal-body" style="padding: 20px;">
                <div class="reports-tabs" id="reports-tabs" style="margin-bottom: 20px;">
                    <!-- Tabs will be generated here -->
                </div>
                
                <div class="reports-content" id="reports-content">
                    <!-- Report content will be loaded here -->
                </div>
                
                <div class="reports-actions" style="margin-top: 30px; text-align: center;">
                    <button onclick="printDetailedReports()" style="
                        padding: 12px 30px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 1rem;
                        cursor: pointer;
                        margin-right: 10px;
                    ">
                        🖨️ Print All Reports
                    </button>
                    <button onclick="exportReportsToPDF()" style="
                        padding: 12px 30px;
                        background: #2ecc71;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 1rem;
                        cursor: pointer;
                    ">
                        📥 Export as PDF
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generate tabs and content
    generateReportsTabs();
    // Load content for the first tab if it exists
    setTimeout(() => {
        if (feasibleModels.length > 0) {
            loadReportContent(feasibleModels[0]);
        }
    }, 100);
}

function generateReportsTabs() {
    const tabsContainer = document.getElementById('reports-tabs');
    const contentContainer = document.getElementById('reports-content');
    
    if (!tabsContainer || !contentContainer) return;
    
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    
    // Create tab for each model
    feasibleModels.forEach((modelId, index) => {
        const model = MODELS[modelId];
        const result = allResults[modelId];
        
        // Create tab button
        const tabBtn = document.createElement('button');
        tabBtn.className = 'report-tab';
        tabBtn.dataset.modelId = modelId;
        tabBtn.style.cssText = `
            padding: 12px 24px;
            margin-right: 5px;
            border: none;
            background: #2c3e50;
            color: white !important; 
            border-bottom: 3px solid #ecb6b6;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s;
            border-radius: 6px 6px 0 0;
        `;
        tabBtn.innerHTML = `${index + 1}. ${model.name}`;
        
        tabBtn.onclick = function() {
            // Remove active class from all tabs
            document.querySelectorAll('.report-tab').forEach(tab => {
                tab.style.background = '#2c3e50';
                tab.style.color = 'white !important';
                tab.style.borderBottomColor = '#ecb6b6';
                tab.style.fontWeight = '600';
            });
            
            // Add active class to clicked tab
            this.style.background = '#3498db';
            this.style.color = 'white !important';
            this.style.borderBottomColor = '#3498db';
            this.style.fontWeight = 'bold';
            
            // Hide all report content divs
            document.querySelectorAll('.report-content').forEach(div => {
                div.style.display = 'none';
            });
            
            // Show the selected report content
            const contentDiv = document.getElementById(`report-${modelId}`);
            if (contentDiv) {
                contentDiv.style.display = 'block';
            }
            
            // Load report content
            loadReportContent(modelId);
        };
        
        tabsContainer.appendChild(tabBtn);
        
        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.id = `report-${modelId}`;
        contentDiv.className = 'report-content';
        contentDiv.style.display = index === 0 ? 'block' : 'none';
        contentContainer.appendChild(contentDiv);
    });
    
    // Set first tab as active
    const firstTab = tabsContainer.querySelector('.report-tab');
    if (firstTab) {
        firstTab.style.background = '#3498db';
        firstTab.style.color = 'white !important';
        firstTab.style.borderBottomColor = '#3498db';
        firstTab.style.fontWeight = 'bold';
    }
    
    // Add CSS for button text visibility
    const buttonStyle = document.createElement('style');
    buttonStyle.textContent = `
        .report-tab {
            color: white !important;
        }
        .report-tab:hover {
            background: #3498db !important;
            color: white !important;
        }
    `;
    document.head.appendChild(buttonStyle);
}

function loadFirstReport() {
    if (feasibleModels.length > 0) {
        loadReportContent(feasibleModels[0]);
    }
}

function loadReportContent(modelId) {
    const contentDiv = document.getElementById(`report-${modelId}`);
    if (!contentDiv) return;
    
    const model = MODELS[modelId];
    const result = allResults[modelId];
    const inputs = modelInputs[modelId] || {};
    
    console.log(`Loading report for ${modelId}:`, result);
    
    // Generate model-specific report
    let reportHTML = '';
    
    switch(modelId) {
        case 'three-thirty':
            reportHTML = generateThreeThirtyReport(model, result, inputs);
            break;
        case 'co-investing':
            reportHTML = generateCoInvestingReport(model, result, inputs);
            break;
        case 'multi-gen':
            reportHTML = generateMultiGenReport(model, result, inputs);
            break;
        case 'early-inheritance':
            reportHTML = generateEarlyInheritanceReport(model, result, inputs);
            break;
        case 'home-equity':
            reportHTML = generateHomeEquityReport(model, result, inputs);
            break;
        default:
            reportHTML = generateGenericReport(model, result, inputs);
    }
    
    contentDiv.innerHTML = reportHTML;
    
    // Add styling
    addReportStyles();
}

// ============================================
// MODEL-SPECIFIC REPORT GENERATORS
// ============================================

function generateThreeThirtyReport(model, result, inputs) {
    const childIncome = inputs['tt-child-income'] || 60000;
    const savingsRate = inputs['tt-savings-rate'] || 70;
    const savingsYears = inputs['tt-savings-years'] || 3;
    const homePrice = inputs['tt-home-price'] || 400000;
    const targetDownPayment = inputs['tt-target-downpayment'] || 80000;
    
    const annualSavings = childIncome * (savingsRate / 100);
    const totalSavings = annualSavings * savingsYears;
    const downPaymentPercentage = (targetDownPayment / homePrice) * 100;
    
    return `
        <div class="detailed-report">
            <div class="report-header" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h2 style="margin: 0 0 10px 0;">${model.name}</h2>
                <h3 style="margin: 0; font-weight: 300;">${model.subtitle}</h3>
                <p style="margin-top: 15px; opacity: 0.9;">${model.description}</p>
            </div>
            
            <div class="executive-summary" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h3 style="margin-top: 0;">📈 Executive Summary</h3>
                <div class="summary-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Net Benefit (30 years)</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${result.netBenefit >= 0 ? '#27ae60' : '#e74c3c'}">
                            $${(result.netBenefit || 0).toLocaleString()}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getRiskColor(result.risk || 3)}">
                            ${result.risk || 3}/5 (${getRiskLabel(result.risk || 3)})
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Time to Home</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">
                            ${result.timeToHome === 0 ? 'Immediate' : result.timeToHome + ' years'}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Success Probability</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #f39c12;">
                            ${result.successRate || 0}%
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="calculation-details" style="margin-bottom: 30px;">
                <h3>🔢 Calculation Details</h3>
                
                <div class="input-summary" style="
                    background: #e8f4fc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <h4 style="margin-top: 0;">Input Parameters</h4>
                    <div class="input-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
                        <div><strong>Child's Annual Income:</strong> $${childIncome.toLocaleString()}</div>
                        <div><strong>Savings Rate:</strong> ${savingsRate}%</div>
                        <div><strong>Annual Savings:</strong> $${annualSavings.toLocaleString()}</div>
                        <div><strong>Savings Period:</strong> ${savingsYears} years</div>
                        <div><strong>Total Savings:</strong> $${totalSavings.toLocaleString()}</div>
                        <div><strong>Home Price:</strong> $${homePrice.toLocaleString()}</div>
                        <div><strong>Target Down Payment:</strong> $${targetDownPayment.toLocaleString()}</div>
                        <div><strong>Required DP %:</strong> ${downPaymentPercentage.toFixed(1)}%</div>
                    </div>
                </div>
                
                <div class="scenario-analysis">
                    <h4>Scenario Comparison</h4>
                    
                    <div class="scenarios-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <!-- Scenario 1: Parent Loan -->
                        <div class="scenario" style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #e74c3c;
                        ">
                            <h5 style="color: #e74c3c; margin-top: 0;">Scenario 1: Parent Loan (Immediate Purchase)</h5>
                            <div class="scenario-details">
                                <p><strong>Logic:</strong> Parents borrow $${inputs['tt-parent-loan-amount'] || 200000} for immediate purchase</p>
                                
                                <div class="scenario-metrics" style="margin: 15px 0;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Down Payment:</span>
                                        <strong>$${(result.scenario1DownPayment || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Mortgage Amount:</span>
                                        <strong>$${(result.scenario1MortgageAmount || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Monthly Payment:</span>
                                        <strong>$${(result.scenario1MonthlyPayment || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Parent Loan Payment:</span>
                                        <strong>$${(result.scenario1ParentLoanPayment || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Total Monthly:</span>
                                        <strong>$${((result.scenario1MonthlyPayment || 0) + (result.scenario1MonthlyParentPayment || 0)).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Home Value (30y):</span>
                                        <strong>$${(result.scenario1HomeValue || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Total Interest:</span>
                                        <strong>$${(result.scenario1TotalInterest || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #fff3cd; border-radius: 4px; margin-top: 10px;">
                                        <span>Total Equity (30y):</span>
                                        <span style="color: #27ae60;">$${(result.scenario1Equity || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Scenario 2: Three for Thirty -->
                        <div class="scenario" style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #2ecc71;
                        ">
                            <h5 style="color: #2ecc71; margin-top: 0;">Scenario 2: Three for Thirty (Save & Buy)</h5>
                            <div class="scenario-details">
                                <p><strong>Logic:</strong> Child saves for ${savingsYears} years, then purchases</p>
                                
                                <div class="scenario-metrics" style="margin: 15px 0;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Total Savings:</span>
                                        <strong>$${(result.scenario2SavingsAmount || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Down Payment:</span>
                                        <strong>$${(result.scenario2DownPayment || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Down Payment %:</span>
                                        <strong>${result.scenario2DownPaymentPercent || 0}%</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Mortgage Amount:</span>
                                        <strong>$${(result.scenario2MortgageAmount || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Monthly Payment:</span>
                                        <strong>$${(result.scenario2MonthlyPayment || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Home Value (30y):</span>
                                        <strong>$${(result.scenario2HomeValue || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Total Interest:</span>
                                        <strong>$${(result.scenario2TotalInterest || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #d4edda; border-radius: 4px; margin-top: 10px;">
                                        <span>Total Equity (30y):</span>
                                        <span style="color: #27ae60;">$${(result.scenario2Equity || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div class="goal-status" style="
                                    padding: 10px;
                                    background: ${result.meetsDownPaymentGoal ? '#d4edda' : '#fff3cd'};
                                    border-radius: 6px;
                                    margin-top: 15px;
                                ">
                                    <strong>${result.meetsDownPaymentGoal ? '✓ Goal Achieved' : '⚠️ Goal Not Met'}</strong>
                                    <div style="font-size: 0.9rem;">
                                        ${result.meetsDownPaymentGoal ? 
                                            `Savings meet ${savingsRate}% down payment target` : 
                                            `Savings fall short by $${(targetDownPayment - (result.scenario2SavingsAmount || 0)).toLocaleString()}`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-result" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 20px;
                    ">
                        <h4 style="margin-top: 0; color: white;">📊 Comparison Result</h4>
                        <div class="comparison-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 0.9rem;">Equity Difference</div>
                                <div style="font-size: 1.3rem; font-weight: bold;">
                                    $${(result.equityDifference || 0).toLocaleString()}
                                </div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.9rem;">Cost Difference</div>
                                <div style="font-size: 1.3rem; font-weight: bold;">
                                    $${(result.costDifference || 0).toLocaleString()}
                                </div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.9rem;">Net Benefit</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: ${result.netBenefit >= 0 ? '#a3e4d7' : '#f1948a'}">
                                    $${(result.netBenefit || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        
                        <div class="conclusion" style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 6px;">
                            <strong>Conclusion:</strong> The Three for Thirty strategy provides 
                            <strong>$${Math.abs(result.netBenefit || 0).toLocaleString()}</strong> 
                            ${result.netBenefit >= 0 ? 'more' : 'less'} net benefit over 30 years compared to the parent loan option.
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="formulas-section" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h4>📐 Key Formulas Used</h4>
                <div class="formulas-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 10px;">
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <strong>Annual Savings</strong>
                        <div style="font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 4px; margin-top: 5px;">
                            = Child Income × (Savings Rate ÷ 100)
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                            = $${childIncome.toLocaleString()} × (${savingsRate} ÷ 100) = $${annualSavings.toLocaleString()}
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <strong>Total Savings After ${savingsYears} Years</strong>
                        <div style="font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 4px; margin-top: 5px;">
                            = Annual Savings × Savings Years
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                            = $${annualSavings.toLocaleString()} × ${savingsYears} = $${totalSavings.toLocaleString()}
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <strong>Monthly Mortgage Payment</strong>
                        <div style="font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 4px; margin-top: 5px;">
                            = Principal × [r(1+r)ⁿ ÷ ((1+r)ⁿ - 1)]
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                            Where r = monthly interest rate, n = total payments
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <strong>Home Value After Appreciation</strong>
                        <div style="font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 4px; margin-top: 5px;">
                            = Initial Price × (1 + Appreciation Rate)ⁿ
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                            Assumes 4% annual appreciation over analysis period
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="assumptions-section" style="
                background: #e8f4fc;
                padding: 20px;
                border-radius: 8px;
            ">
                <h4>⚙️ Model Assumptions</h4>
                <ul style="columns: 2; column-gap: 30px;">
                    <li><strong>Time Horizon:</strong> 30-year analysis period</li>
                    <li><strong>Home Appreciation:</strong> 4% annually</li>
                    <li><strong>Mortgage Rate:</strong> 4.5% fixed</li>
                    <li><strong>Mortgage Term:</strong> 25 years</li>
                    <li><strong>Parent Loan Term:</strong> 30 years</li>
                    <li><strong>Inflation Rate:</strong> 2% annually (implied)</li>
                    <li><strong>Tax Rate:</strong> ${inputs['tt-parent-tax-rate'] || 25}% marginal</li>
                    <li><strong>Savings Rate:</strong> ${savingsRate}% of gross income</li>
                    <li><strong>No Change in Income:</strong> Constant income throughout period</li>
                    <li><strong>No Major Expenses:</strong> Assumes no major unexpected expenses</li>
                </ul>
            </div>
            
            <div class="risk-assessment" style="margin-top: 25px;">
                <h4>⚠️ Risk Assessment</h4>
                <div class="risk-factors" style="
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 10px;
                ">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="width: 100px; font-weight: bold;">Risk Level:</div>
                        <div style="flex: 1;">
                            <div style="display: inline-block; padding: 5px 15px; background: ${getRiskColor(result.risk || 3)}; color: white; border-radius: 20px;">
                                ${result.risk || 3}/5 (${getRiskLabel(result.risk || 3)})
                            </div>
                        </div>
                    </div>
                    
                    <div><strong>Key Risk Factors:</strong></div>
                    <ul style="margin-top: 5px;">
                        <li>Ability to maintain ${savingsRate}% savings rate for ${savingsYears} years</li>
                        <li>Potential changes in child's income or employment</li>
                        <li>Real estate market fluctuations affecting home prices</li>
                        <li>Interest rate changes affecting mortgage costs</li>
                        <li>Unexpected expenses during savings period</li>
                    </ul>
                </div>
            </div>
            
            <div class="recommendation-section" style="
                background: linear-gradient(135deg, #fef9e7 0%, #fff 100%);
                border: 2px solid #f1c40f;
                padding: 25px;
                border-radius: 8px;
                margin-top: 30px;
            ">
                <h4 style="color: #f39c12; margin-top: 0;">⭐ Recommendation</h4>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">
                    ${generateRecommendationText('three-thirty', result)}
                </p>
                
                <div class="next-steps" style="
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 15px;
                ">
                    <strong>Next Steps:</strong>
                    <ol style="margin-top: 10px; padding-left: 20px;">
                        <li>Establish dedicated savings account for down payment</li>
                        <li>Create monthly budget to ensure ${savingsRate}% savings rate</li>
                        <li>Meet with mortgage broker to understand qualification requirements</li>
                        <li>Research housing markets within budget range</li>
                        <li>Consider contingency plans if savings targets aren't met</li>
                    </ol>
                </div>
            </div>
        </div>
    `;
}

function generateCoInvestingReport(model, result, inputs) {
    const investmentAmount = inputs['ci-investment-amount'] || 200000;
    const stockReturn = inputs['ci-stock-return'] || 6;
    const stockVolatility = inputs['ci-stock-volatility'] || 10;
    const loanAmount = inputs['ci-loan-amount'] || 200000;
    const loanRate = inputs['ci-loan-rate'] || 5;
    const homePrice = inputs['ci-home-price'] || 400000;
    const mortgageRate = inputs['ci-mortgage-rate'] || 4.5;
    const appreciation = inputs['ci-annual-appreciation'] || 4;
    const timeHorizon = inputs['ci-time-horizon'] || 30;
    
    return `
        <div class="detailed-report">
            <div class="report-header" style="
                background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h2 style="margin: 0 0 10px 0;">${model.name}</h2>
                <h3 style="margin: 0; font-weight: 300;">${model.subtitle}</h3>
                <p style="margin-top: 15px; opacity: 0.9;">${model.description}</p>
            </div>
            
            <div class="executive-summary" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h3 style="margin-top: 0;">📈 Executive Summary</h3>
                <div class="summary-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Net Benefit (${timeHorizon} years)</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${result.netBenefit >= 0 ? '#27ae60' : '#e74c3c'}">
                            $${(result.netBenefit || 0).toLocaleString()}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getRiskColor(result.risk || 3)}">
                            ${result.risk || 3}/5 (${getRiskLabel(result.risk || 3)})
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Success Probability</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #f39c12;">
                            ${result.successProbability || 0}%
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Opportunity Cost</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #e74c3c;">
                            $${(result.opportunityCost || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="calculation-details" style="margin-bottom: 30px;">
                <h3>🔢 Calculation Details</h3>
                
                <div class="input-summary" style="
                    background: #e8f4fc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <h4 style="margin-top: 0;">Input Parameters</h4>
                    <div class="input-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
                        <div><strong>Investment Amount:</strong> $${investmentAmount.toLocaleString()}</div>
                        <div><strong>Stock Return:</strong> ${stockReturn}%</div>
                        <div><strong>Stock Volatility:</strong> ${stockVolatility}%</div>
                        <div><strong>Loan Amount:</strong> $${loanAmount.toLocaleString()}</div>
                        <div><strong>Loan Rate:</strong> ${loanRate}%</div>
                        <div><strong>Home Price:</strong> $${homePrice.toLocaleString()}</div>
                        <div><strong>Mortgage Rate:</strong> ${mortgageRate}%</div>
                        <div><strong>Home Appreciation:</strong> ${appreciation}%</div>
                        <div><strong>Time Horizon:</strong> ${timeHorizon} years</div>
                    </div>
                </div>
                
                <div class="scenario-analysis">
                    <h4>Scenario Comparison</h4>
                    
                    <div class="scenarios-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <!-- Scenario 1: Keep in Stocks -->
                        <div class="scenario" style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #e74c3c;
                        ">
                            <h5 style="color: #e74c3c; margin-top: 0;">Scenario 1: Keep in Stocks</h5>
                            <div class="scenario-details">
                                <p><strong>Logic:</strong> Keep $${investmentAmount.toLocaleString()} invested in stocks</p>
                                
                                <div class="scenario-metrics" style="margin: 15px 0;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Stock Future Value:</span>
                                        <strong>$${(result.stockFutureValue || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Stock After Tax:</span>
                                        <strong>$${(result.stockAfterTax || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Annual Return:</span>
                                        <strong>${stockReturn}%</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #fff3cd; border-radius: 4px; margin-top: 10px;">
                                        <span>Final Value:</span>
                                        <span style="color: #f39c12;">$${(result.stockAfterTax || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Scenario 2: Lend to Child -->
                        <div class="scenario" style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #2ecc71;
                        ">
                            <h5 style="color: #2ecc71; margin-top: 0;">Scenario 2: Lend to Child</h5>
                            <div class="scenario-details">
                                <p><strong>Logic:</strong> Lend $${loanAmount.toLocaleString()} to child for home purchase</p>
                                
                                <div class="scenario-metrics" style="margin: 15px 0;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Child's Future Equity:</span>
                                        <strong>$${(result.childEquity || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Parent Interest After Tax:</span>
                                        <strong>$${(result.parentInterestAfterTax || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                        <span>Home Future Value:</span>
                                        <strong>$${(result.homeFutureValue || 0).toLocaleString()}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #d4edda; border-radius: 4px; margin-top: 10px;">
                                        <span>Total Lending Value:</span>
                                        <span style="color: #27ae60;">$${(result.lendingScenarioValue || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-result" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 20px;
                    ">
                        <h4 style="margin-top: 0; color: white;">📊 Comparison Result</h4>
                        <div class="comparison-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 0.9rem;">Net Benefit</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: #a3e4d7;">
                                    $${(result.netBenefit || 0).toLocaleString()}
                                </div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.9rem;">Recommendation</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: #a3e4d7;">
                                    ${result.netBenefit > 0 ? 'INVEST' : 'KEEP IN STOCKS'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="conclusion" style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 6px;">
                            <strong>Conclusion:</strong> ${generateRecommendationText('co-investing', result)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="formulas-section" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h4>📐 Key Formulas Used</h4>
                <div class="formulas-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 10px;">
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <strong>Stock Future Value</strong>
                        <div style="font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 4px; margin-top: 5px;">
                            = Investment × (1 + Stock Return)ⁿ
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                            Where n = number of years (${timeHorizon})
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <strong>Home Future Value</strong>
                        <div style="font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 4px; margin-top: 5px;">
                            = Home Price × (1 + Appreciation)ⁿ
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                            ${appreciation}% annual appreciation over ${timeHorizon} years
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px;">
                        <strong>Interest Income</strong>
                        <div style="font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 4px; margin-top: 5px;">
                            = Loan Amount × (1 + Loan Rate)ⁿ - Loan Amount
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="assumptions-section" style="
                background: #e8f4fc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h4>⚙️ Model Assumptions</h4>
                <ul style="columns: 2; column-gap: 30px;">
                    <li><strong>Analysis Period:</strong> ${timeHorizon} years</li>
                    <li><strong>Stock Returns:</strong> ${stockReturn}% annually (average)</li>
                    <li><strong>Stock Volatility:</strong> ${stockVolatility}% annually</li>
                    <li><strong>Home Appreciation:</strong> ${appreciation}% annually</li>
                    <li><strong>Tax Rate:</strong> ${inputs['ci-marginal-tax'] || 25}% marginal</li>
                    <li><strong>Capital Gains:</strong> ${inputs['ci-capital-gain'] || 50}% inclusion rate</li>
                    <li><strong>No Default Risk:</strong> Assumes child repays loan in full</li>
                    <li><strong>No Market Timing:</strong> Assumes consistent returns</li>
                </ul>
            </div>
            
            <div class="recommendation-section" style="
                background: linear-gradient(135deg, #fef9e7 0%, #fff 100%);
                border: 2px solid #f1c40f;
                padding: 25px;
                border-radius: 8px;
            ">
                <h4 style="color: #f39c12; margin-top: 0;">⭐ Recommendation</h4>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">
                    ${generateRecommendationText('co-investing', result)}
                </p>
            </div>
        </div>
    `;
}


function generateMultiGenReport(model, result, inputs) {
    const buildType = inputs['mg-build-type'] || 'laneway';
    const buildCost = buildType === 'laneway' ? 500000 : 
                     buildType === 'suite' ? 100000 : 
                     inputs['mg-custom-cost'] || 500000;
    const childEquityShare = (inputs['mg-child-equity'] || 15) / 100;
    const livingYears = inputs['mg-living-years'] || 10;
    const propertyValue = inputs['mg-property-value'] || 1000000;
    const monthlyMarketRent = inputs['mg-rent-if-not-living'] || 1500;
    
    const childTotalPayments = result.childTotalPayments || 0;
    const childEquityValue = result.childEquityValue || 0;
    const childNetBenefit = result.childNetBenefit || 0;
    
    return `
        <div class="detailed-report">
            <div class="report-header" style="
                background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h2 style="margin: 0 0 10px 0;">${model.name}</h2>
                <h3 style="margin: 0; font-weight: 300;">${model.subtitle}</h3>
                <p style="margin-top: 15px; opacity: 0.9;">${model.description}</p>
            </div>
            
            <div class="executive-summary" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h3 style="margin-top: 0;">📈 Executive Summary</h3>
                <div class="summary-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Child's Net Benefit</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${childNetBenefit >= 0 ? '#27ae60' : '#e74c3c'}">
                            $${childNetBenefit.toLocaleString()}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getRiskColor(result.risk || 4)}">
                            ${result.risk || 4}/5 (${getRiskLabel(result.risk || 4)})
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Time to Benefit</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">
                            ${result.timeToHome || 30} years
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Success Probability</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #f39c12;">
                            ${result.successProbability || 70}%
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="calculation-details" style="margin-bottom: 30px;">
                <h3>🔢 Calculation Details</h3>
                
                <div class="input-summary" style="
                    background: #e8f4fc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <h4 style="margin-top: 0;">Construction & Living Parameters</h4>
                    <div class="input-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
                        <div><strong>Construction Type:</strong> ${buildType === 'laneway' ? 'Laneway House' : 
                                                                buildType === 'suite' ? 'Rental Suite' : 'Custom Build'}</div>
                        <div><strong>Construction Cost:</strong> $${buildCost.toLocaleString()}</div>
                        <div><strong>Property Value:</strong> $${propertyValue.toLocaleString()}</div>
                        <div><strong>Child's Equity Share:</strong> ${childEquityShare * 100}%</div>
                        <div><strong>Living Together Period:</strong> ${livingYears} years</div>
                        <div><strong>Market Rent Alternative:</strong> $${monthlyMarketRent}/month</div>
                    </div>
                </div>
                
                <div class="financial-analysis">
                    <h4>Financial Analysis</h4>
                    
                    <div class="cost-benefit-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <!-- Child's Costs & Benefits -->
                        <div class="child-analysis" style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #3498db;
                        ">
                            <h5 style="color: #3498db; margin-top: 0;">👤 Child's Perspective</h5>
                            
                            <div class="costs" style="margin-bottom: 20px;">
                                <h6 style="color: #e74c3c; margin-bottom: 10px;">Costs</h6>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                    <span>Construction Loan Payments:</span>
                                    <strong>$${childTotalPayments.toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                    <span>Monthly Payment:</span>
                                    <strong>$${(result.monthlyConstructionPayment || 0).toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #f8d7da; border-radius: 4px; margin-top: 10px;">
                                    <span>Total Cost:</span>
                                    <span style="color: #e74c3c;">$${childTotalPayments.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div class="benefits">
                                <h6 style="color: #27ae60; margin-bottom: 10px;">Benefits</h6>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                    <span>Future Equity Value:</span>
                                    <strong>$${childEquityValue.toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                    <span>Rent Savings (${livingYears}y):</span>
                                    <strong>$${(monthlyMarketRent * 12 * livingYears).toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #d4edda; border-radius: 4px; margin-top: 10px;">
                                    <span>Total Benefit:</span>
                                    <span style="color: #27ae60;">$${(childEquityValue + (monthlyMarketRent * 12 * livingYears)).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; padding: 12px; background: #fef9e7; border-radius: 6px; margin-top: 15px; font-weight: bold;">
                                <span>Net Benefit:</span>
                                <span style="color: ${childNetBenefit >= 0 ? '#27ae60' : '#e74c3c'}; font-size: 1.2rem;">
                                    $${childNetBenefit.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Parent's Analysis -->
                        <div class="parent-analysis" style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #9b59b6;
                        ">
                            <h5 style="color: #9b59b6; margin-top: 0;">👥 Parent's Perspective</h5>
                            
                            <div class="parent-benefits" style="margin-top: 10px;">
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                    <span>Parent's Equity Share:</span>
                                    <strong>${(100 - childEquityShare * 100).toFixed(1)}%</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                    <span>Parent's Future Equity:</span>
                                    <strong>$${(result.parentFutureEquity || 0).toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                    <span>Property Value Increase:</span>
                                    <strong>$${(result.valueAddedByConstruction || 0).toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #e8d4f2; border-radius: 4px; margin-top: 10px;">
                                    <span>Parent's Net Benefit:</span>
                                    <span style="color: #9b59b6;">$${(result.parentNetBenefit || 0).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div class="rent-savings" style="margin-top: 20px; padding: 15px; background: #e8f4fc; border-radius: 6px;">
                                <h6 style="margin-top: 0; color: #3498db;">📊 Rent vs Construction Payment</h6>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                    <span>Rent Cost (${livingYears}y):</span>
                                    <strong>$${(monthlyMarketRent * 12 * livingYears).toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                    <span>Construction Payments:</span>
                                    <strong>$${childTotalPayments.toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold;">
                                    <span>Overall Family Benefit:</span>
                                    <span style="color: ${(monthlyMarketRent * 12 * livingYears + childEquityValue) > childTotalPayments ? '#27ae60' : '#e74c3c'}">
                                        $${(result.valueAddedByConstruction - childTotalPayments).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="property-value-analysis" style="margin-bottom: 25px;">
                <h4>🏠 Property Value Projection</h4>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-top: 10px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem; color: #666;">Initial Property Value</div>
                            <div style="font-size: 1.2rem; font-weight: bold;">$${propertyValue.toLocaleString()}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem; color: #666;">+ Construction Value</div>
                            <div style="font-size: 1.2rem; font-weight: bold;">$${buildCost.toLocaleString()}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem; color: #666;">= Enhanced Value</div>
                            <div style="font-size: 1.2rem; font-weight: bold;">$${(parseInt(propertyValue) + parseInt(buildCost)).toLocaleString()}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem; color: #666;">Future Value (30y)</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #27ae60;">
                                $${(result.futurePropertyValue || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="risk-assessment" style="margin-bottom: 25px;">
                <h4>⚠️ Risk Assessment</h4>
                <div class="risk-factors" style="
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 10px;
                ">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="width: 120px; font-weight: bold;">Overall Risk:</div>
                        <div style="flex: 1;">
                            <div style="display: inline-block; padding: 8px 20px; background: ${getRiskColor(result.risk || 4)}; color: white; border-radius: 20px; font-size: 1.1rem;">
                                ${result.risk || 4}/5 (${getRiskLabel(result.risk || 4)})
                            </div>
                        </div>
                    </div>
                    
                    <div><strong>Key Risk Factors:</strong></div>
                    <ul style="margin-top: 10px; columns: 2; column-gap: 30px;">
                        <li>Construction cost overruns</li>
                        <li>Permitting and zoning delays</li>
                        <li>Relationship strain from living together</li>
                        <li>Property value fluctuations</li>
                        <li>Construction loan interest rate changes</li>
                        <li>Unexpected maintenance costs</li>
                        <li>Changes in living arrangements</li>
                        <li>Future sale complications</li>
                    </ul>
                    
                    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                        <strong>Risk Mitigation Recommendations:</strong>
                        <ul style="margin-top: 10px;">
                            <li>Obtain multiple construction quotes</li>
                            <li>Create formal co-ownership agreement</li>
                            <li>Include contingency budget (10-15%)</li>
                            <li>Establish clear exit strategy</li>
                            <li>Consult with real estate lawyer</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}


function generateEarlyInheritanceReport(model, result, inputs) {
    const earlyAmount = inputs['ei-early-amount'] || 100000;
    const lateAmount = inputs['ei-late-amount'] || 750000;
    const yearsUntilLate = inputs['ei-years-until-late'] || 30;
    const homePrice = inputs['ei-home-price'] || 500000;
    const monthlyRent = inputs['ei-monthly-rent'] || 1500;
    const childIncome = inputs['ei-child-income'] || 60000;
    
    return `
        <div class="detailed-report">
            <div class="report-header" style="
                background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h2 style="margin: 0 0 10px 0;">${model.name}</h2>
                <h3 style="margin: 0; font-weight: 300;">${model.subtitle}</h3>
                <p style="margin-top: 15px; opacity: 0.9;">${model.description}</p>
            </div>
            
            <div class="executive-summary" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h3 style="margin-top: 0;">📈 Executive Summary</h3>
                <div class="summary-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Net Benefit</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${result.netBenefit >= 0 ? '#27ae60' : '#e74c3c'}">
                            $${(result.netBenefit || 0).toLocaleString()}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getRiskColor(result.risk || 2)}">
                            ${result.risk || 2}/5 (${getRiskLabel(result.risk || 2)})
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Success Probability</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #f39c12;">
                            ${result.successProbability || 75}%
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Analysis Period</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">
                            ${yearsUntilLate} years
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="timeline-comparison" style="margin-bottom: 30px;">
                <h3>🕒 Timeline Comparison</h3>
                
                <div class="timeline-visualization" style="
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 15px;
                ">
                    <!-- Early Inheritance Timeline -->
                    <div class="timeline early-timeline" style="
                        background: #f0f7ff;
                        border-left: 4px solid #3498db;
                        padding: 15px;
                        margin-bottom: 20px;
                        border-radius: 4px;
                    ">
                        <h5 style="color: #3498db; margin-top: 0;">Early Inheritance (Now)</h5>
                        <div style="display: flex; align-items: center; margin: 10px 0;">
                            <div style="width: 20px; height: 20px; background: #3498db; border-radius: 50%; margin-right: 10px;"></div>
                            <div style="flex: 1;">
                                <strong>Receive $${earlyAmount.toLocaleString()} now</strong>
                                <div style="font-size: 0.9rem; color: #666;">Used as down payment for immediate home purchase</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; margin: 10px 0;">
                            <div style="width: 20px; height: 20px; background: #3498db; border-radius: 50%; margin-right: 10px;"></div>
                            <div style="flex: 1;">
                                <strong>Start building equity immediately</strong>
                                <div style="font-size: 0.9rem; color: #666;">${yearsUntilLate} years of home ownership</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; margin: 10px 0;">
                            <div style="width: 20px; height: 20px; background: #3498db; border-radius: 50%; margin-right: 10px;"></div>
                            <div style="flex: 1;">
                                <strong>Final Outcome:</strong> Home equity of $${(result.earlyScenario?.childEquity || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Late Inheritance Timeline -->
                    <div class="timeline late-timeline" style="
                        background: #fff5f5;
                        border-left: 4px solid #e74c3c;
                        padding: 15px;
                        border-radius: 4px;
                    ">
                        <h5 style="color: #e74c3c; margin-top: 0;">Late Inheritance (${yearsUntilLate} years from now)</h5>
                        <div style="display: flex; align-items: center; margin: 10px 0;">
                            <div style="width: 20px; height: 20px; background: #e74c3c; border-radius: 50%; margin-right: 10px;"></div>
                            <div style="flex: 1;">
                                <strong>Continue renting for ${yearsUntilLate} years</strong>
                                <div style="font-size: 0.9rem; color: #666;">Paying $${monthlyRent}/month ($${monthlyRent * 12}/year)</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; margin: 10px 0;">
                            <div style="width: 20px; height: 20px; background: #e74c3c; border-radius: 50%; margin-right: 10px;"></div>
                            <div style="flex: 1;">
                                <strong>Receive $${lateAmount.toLocaleString()} inheritance</strong>
                                <div style="font-size: 0.9rem; color: #666;">After ${yearsUntilLate} years of waiting</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; margin: 10px 0;">
                            <div style="width: 20px; height: 20px; background: #e74c3c; border-radius: 50%; margin-right: 10px;"></div>
                            <div style="flex: 1;">
                                <strong>Final Outcome:</strong> Net wealth of $${(result.lateScenario?.childNetWealth || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="financial-comparison" style="margin-bottom: 30px;">
                <h3>💰 Financial Comparison</h3>
                
                <div class="comparison-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                    <!-- Early Inheritance Details -->
                    <div class="early-details" style="
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                    ">
                        <h5 style="color: #3498db; margin-top: 0;">Early Inheritance Scenario</h5>
                        
                        <div class="financial-metrics" style="margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Home Purchase Price:</span>
                                <strong>$${homePrice.toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Down Payment:</span>
                                <strong>$${Math.min(earlyAmount, homePrice * 0.2).toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Mortgage Amount:</span>
                                <strong>$${(homePrice - Math.min(earlyAmount, homePrice * 0.2)).toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Monthly Payment:</span>
                                <strong>$${(result.earlyScenario?.monthlyMortgagePayment || 0).toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Debt Service Ratio:</span>
                                <strong>${result.earlyScenario?.debtServiceRatio || 'N/A'}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Future Home Value:</span>
                                <strong>$${(result.earlyScenario?.futureHomeValue || 0).toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #d4edda; border-radius: 4px; margin-top: 10px;">
                                <span>Child's Equity (${yearsUntilLate}y):</span>
                                <span style="color: #27ae60;">$${(result.earlyScenario?.childEquity || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Late Inheritance Details -->
                    <div class="late-details" style="
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                    ">
                        <h5 style="color: #e74c3c; margin-top: 0;">Late Inheritance Scenario</h5>
                        
                        <div class="financial-metrics" style="margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Total Rent Paid:</span>
                                <strong>$${(result.lateScenario?.totalRentCost || 0).toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Late Inheritance Amount:</span>
                                <strong>$${lateAmount.toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Early Amount if Invested:</span>
                                <strong>$${(result.lateScenario?.earlyAmountIfInvested || 0).toLocaleString()}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>First Year Rent/Income:</span>
                                <strong>${result.lateScenario?.firstYearRentRatio || 'N/A'}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                                <span>Last Year Rent/Income:</span>
                                <strong>${result.lateScenario?.lastYearRentRatio || 'N/A'}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: #f8d7da; border-radius: 4px; margin-top: 10px;">
                                <span>Net Wealth (${yearsUntilLate}y):</span>
                                <span style="color: #e74c3c;">$${(result.lateScenario?.childNetWealth || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="net-comparison" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                ">
                    <h4 style="margin-top: 0; color: white;">📊 Net Comparison</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem;">Equity vs Wealth Difference</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: #a3e4d7;">
                                $${(result.equityVsRentDifference || 0).toLocaleString()}
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem;">Inheritance Timing Impact</div>
                            <div style="font-size: 1.3rem; font-weight: bold;">
                                $${(result.inheritanceTimingImpact || 0).toLocaleString()}
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem;">Net Benefit</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: ${result.netBenefit >= 0 ? '#a3e4d7' : '#f1948a'}">
                                $${(result.netBenefit || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="non-financial-factors" style="margin-bottom: 25px;">
                <h4>🤝 Non-Financial Considerations</h4>
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 10px;
                ">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <strong>Retirement Impact:</strong>
                            <div style="margin-top: 5px; padding: 8px; background: white; border-radius: 4px;">
                                ${result.retirementImpact === 'no' ? '✅ Minimal impact' : 
                                  result.retirementImpact === 'moderate' ? '⚠️ Moderate impact' : 
                                  '❌ Significant impact'}
                            </div>
                        </div>
                        
                        <div>
                            <strong>Family Dynamics:</strong>
                            <div style="margin-top: 5px; padding: 8px; background: white; border-radius: 4px;">
                                ${result.netBenefit > 0 ? '✅ Potentially positive' : '⚠️ May require careful planning'}
                            </div>
                        </div>
                        
                        <div>
                            <strong>Sibling Considerations:</strong>
                            <div style="margin-top: 5px; padding: 8px; background: white; border-radius: 4px;">
                                ${inputs['ei-siblings-early-inheritance'] || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="recommendation-section" style="
                background: linear-gradient(135deg, #fef9e7 0%, #fff 100%);
                border: 2px solid #f1c40f;
                padding: 25px;
                border-radius: 8px;
            ">
                <h4 style="color: #f39c12; margin-top: 0;">⭐ Recommendation</h4>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">
                    ${generateRecommendationText('early-inheritance', result)}
                </p>
                
                <div class="decision-factors" style="
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 15px;
                ">
                    <strong>Key Decision Factors:</strong>
                    <ul style="margin-top: 10px; padding-left: 20px;">
                        <li>Parents' retirement security assessment</li>
                        <li>Sibling equality considerations</li>
                        <li>Child's ability to maintain mortgage payments</li>
                        <li>Family relationship dynamics</li>
                        <li>Long-term estate planning goals</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function generateHomeEquityReport(model, result, inputs) {
    const method = inputs['he-method'] || 'heloc';
    const parentHomeValue = inputs['he-home-value'] || 750000;
    const currentMortgage = inputs['he-current-mortgage'] || 200000;
    const amountNeeded = inputs['he-amount-needed'] || 100000;
    
    return `
        <div class="detailed-report">
            <div class="report-header" style="
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h2 style="margin: 0 0 10px 0;">${model.name}</h2>
                <h3 style="margin: 0; font-weight: 300;">${model.subtitle}</h3>
                <p style="margin-top: 15px; opacity: 0.9;">${model.description}</p>
            </div>
            
            <div class="executive-summary" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h3 style="margin-top: 0;">📈 Executive Summary</h3>
                <div class="summary-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Selected Method</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #3498db;">
                            ${method === 'reverse' ? 'Reverse Mortgage' : 
                              method === 'heloc' ? 'HELOC' : 
                              method === 'refinance' ? 'Refinance' : 'Second Mortgage'}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Net Benefit</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${result.netBenefit >= 0 ? '#27ae60' : '#e74c3c'}">
                            $${(result.netBenefit || 0).toLocaleString()}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getRiskColor(result.risk || 3)}">
                            ${result.risk || 3}/5
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Equity Available</div>
                        <div style="font-size: 1.3rem; font-weight: bold; color: #9b59b6;">
                            $${((parentHomeValue - currentMortgage) || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
            
            ${result.qualificationNote ? `
            <div class="qualification-notice" style="
                background: ${result.qualificationNote.includes('Likely qualified') ? '#d4edda' : '#fff3cd'};
                border-left: 4px solid ${result.qualificationNote.includes('Likely qualified') ? '#28a745' : '#ffc107'};
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            ">
                <strong>Qualification Status:</strong> ${result.qualificationNote}
            </div>
            ` : ''}
            
            <div class="scenario-analysis">
                <h3>🔄 Scenario Analysis</h3>
                
                ${result.scenarios ? `
                <div class="scenarios-comparison" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                    <!-- Reverse Mortgage Scenario -->
                    <div class="scenario" style="
                        background: ${method === 'reverse' ? '#f0f8ff' : '#f8f9fa'};
                        padding: 20px;
                        border-radius: 8px;
                        border: 2px solid ${method === 'reverse' ? '#3498db' : '#ddd'};
                    ">
                        <h4 style="color: ${method === 'reverse' ? '#3498db' : '#666'}; margin-top: 0;">
                            ${result.scenarios.reverseMortgage?.scenarioName || 'Reverse Mortgage'}
                        </h4>
                        
                        <div class="scenario-details">
                            <div class="scenario-metrics">
                                ${generateScenarioMetrics(result.scenarios.reverseMortgage)}
                            </div>
                            
                            ${result.scenarios.reverseMortgage?.equityExhaustionYear ? `
                            <div class="warning" style="
                                background: #fff3cd;
                                border-left: 4px solid #ffc107;
                                padding: 10px;
                                margin-top: 15px;
                                border-radius: 4px;
                            ">
                                ⚠️ <strong>Equity Exhaustion:</strong> Reverse mortgage debt exceeds home equity in year ${result.scenarios.reverseMortgage.equityExhaustionYear}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Traditional Loan Scenario -->
                    <div class="scenario" style="
                        background: ${method !== 'reverse' ? '#f0f8ff' : '#f8f9fa'};
                        padding: 20px;
                        border-radius: 8px;
                        border: 2px solid ${method !== 'reverse' ? '#3498db' : '#ddd'};
                    ">
                        <h4 style="color: ${method !== 'reverse' ? '#3498db' : '#666'}; margin-top: 0;">
                            ${result.scenarios.traditionalLoan?.scenarioName || 'Traditional Loan'}
                        </h4>
                        
                        <div class="scenario-details">
                            <div class="scenario-metrics">
                                ${generateScenarioMetrics(result.scenarios.traditionalLoan)}
                            </div>
                            
                            <div style="margin-top: 15px; padding: 10px; background: #f1f1f1; border-radius: 6px;">
                                <strong>Repayment Responsibility:</strong> ${result.repaymentResponsibility || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>
                
                ${result.comparison ? `
                <div class="comparison-result" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                ">
                    <h4 style="margin-top: 0; color: white;">📊 Comparison Results</h4>
                    <div class="comparison-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem;">Net Benefit Difference</div>
                            <div style="font-size: 1.3rem; font-weight: bold;">
                                $${(result.comparison.netBenefitDifference || 0).toLocaleString()}
                            </div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">
                                ${result.comparison.netBenefitDifference >= 0 ? 'Reverse Mortgage leads by' : 'Traditional Loan leads by'}
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem;">Total Cost Difference</div>
                            <div style="font-size: 1.3rem; font-weight: bold;">
                                $${(result.comparison.totalCostDifference || 0).toLocaleString()}
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem;">Recommendation</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: #a3e4d7;">
                                ${result.comparison.recommendation || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
                ` : `
                <div class="single-scenario" style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 15px;
                ">
                    <h4 style="margin-top: 0;">Selected Method Analysis</h4>
                    <div class="scenario-metrics">
                        ${generateScenarioMetrics(result)}
                    </div>
                </div>
                `}
            </div>
            
            <!-- Add formulas, assumptions, risk assessment similar to three-thirty report -->
            
        </div>
    `;
}

// =============================================
// REPORT GENERATION FUNCTIONS
// =============================================

function generateHomeEquityReport(results) {
    // This function creates a printable detailed report
    const report = {
        title: "Home Equity Strategy Analysis Report",
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        
        // Executive Summary
        executiveSummary: {
            recommendedStrategy: results.comparison.recommendedScenario === 'traditional' ? 
                'Traditional Home Equity Loan' : 'Reverse Mortgage',
            recommendationStrength: results.comparison.recommendationStrength,
            familyWealthDifference: `$${Math.abs(results.comparison.familyWealthDifference).toLocaleString()}`,
            riskLevel: results.risks.riskLevel,
            keyTakeaway: results.keyTakeaways[0] || "Carefully consider cash flow vs wealth accumulation trade-offs"
        },
        
        // Detailed Analysis
        analysis: {
            scenarios: {
                reverseMortgage: results.reverseMortgage,
                traditionalLoan: results.traditionalLoan
            },
            comparison: results.comparison,
            riskAssessment: results.risks
        },
        
        // Assumptions Used
        assumptions: {
            analysisPeriod: "30 years",
            homeAppreciation: "4% annually",
            childMortgageRate: "4.5%",
            propertyCosts: "Property tax 1%, Insurance 0.35%, Maintenance 1.5%",
            rentInflation: "3% annually",
            investmentReturn: "6% (opportunity cost)"
        },
        
        // Financial Projections
        projections: generateFinancialProjections(results),
        
        // Recommendations
        recommendations: generateRecommendations(results)
    };
    
    return report;
}

function generateFinancialProjections(results) {
    const projections = [];
    
    // 5-year projections
    for (let year = 5; year <= 30; year += 5) {
        projections.push({
            year: year,
            reverseMortgage: {
                childEquity: Math.round(results.reverseMortgage.childEquity * (year / 30)),
                parentEquity: Math.round(results.reverseMortgage.parentNetEquity * (year / 30)),
                totalDebt: Math.round(results.reverseMortgage.reverseMortgage.startingBalance * 
                    Math.pow(1 + parseFloat(results.reverseMortgage.reverseMortgage.interestRate) / 100, year))
            },
            traditionalLoan: {
                childEquity: Math.round(results.traditionalLoan.childEquity * (year / 30)),
                parentEquity: Math.round(results.traditionalLoan.parentNetEquity * (year / 30)),
                remainingBalance: Math.round(results.traditionalLoan.parentLoan.remainingBalance * 
                    Math.max(0, 1 - (year / results.traditionalLoan.parentLoan.term)))
            }
        });
    }
    
    return projections;
}

function generateRecommendations(results) {
    const recommendations = [];
    const comparison = results.comparison;
    const risks = results.risks;
    
    if (comparison.recommendedScenario === 'traditional') {
        recommendations.push({
            priority: 'high',
            action: 'Proceed with Traditional Home Equity Loan',
            reason: 'Higher family wealth accumulation with manageable risk',
            timeline: 'Immediate'
        });
        
        if (risks.overallRisk >= 4) {
            recommendations.push({
                priority: 'medium',
                action: 'Consider debt insurance or payment protection',
                reason: 'Mitigate high debt service ratio risk',
                timeline: 'Before finalizing loan'
            });
        }
    } else {
        recommendations.push({
            priority: 'high',
            action: 'Proceed with Reverse Mortgage',
            reason: 'Better cash flow preservation for retirement',
            timeline: 'After qualification confirmation'
        });
        
        if (!results.reverseMortgage.qualificationEligible) {
            recommendations.push({
                priority: 'critical',
                action: 'Schedule consultation with reverse mortgage specialist',
                reason: 'Qualification assessment needed',
                timeline: 'Immediate'
            });
        }
    }
    
    // Universal recommendations
    recommendations.push({
        priority: 'medium',
        action: 'Review insurance coverage for both properties',
        reason: 'Protect assets against unexpected events',
        timeline: 'Within 30 days'
    });
    
    recommendations.push({
        priority: 'low',
        action: 'Create contingency plan for interest rate changes',
        reason: 'Prepare for potential rate increases',
        timeline: 'Within 90 days'
    });
    
    return recommendations;
}

function generateScenarioMetrics(scenario) {
    if (!scenario) return '<p>No scenario data available</p>';
    
    return `
        <div style="margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                <span>Child Net Benefit:</span>
                <strong style="color: ${scenario.childNetBenefit >= 0 ? '#27ae60' : '#e74c3c'}">
                    $${(scenario.childNetBenefit || 0).toLocaleString()}
                </strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                <span>Child's Equity (30y):</span>
                <strong>$${(scenario.childEquity30 || 0).toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                <span>Monthly Payment:</span>
                <strong>$${(scenario.childMonthlyPayment || 0).toLocaleString()}</strong>
            </div>
            ${scenario.childAdditionalMonthlyPayment ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                <span>+ Loan Payment:</span>
                <strong>$${(scenario.childAdditionalMonthlyPayment || 0).toLocaleString()}</strong>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                <span>Total Interest:</span>
                <strong>$${((scenario.childInterestPaid || 0) + (scenario.loanInterestPaid || 0)).toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                <span>Debt Service Ratio:</span>
                <strong>${scenario.debtServiceRatio || 'N/A'}</strong>
            </div>
            ${scenario.downPaymentCovered ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background: ${scenario.downPaymentCovered >= 100 ? '#d4edda' : '#fff3cd'}; border-radius: 4px; margin-top: 10px;">
                <span>Down Payment Covered:</span>
                <span>${scenario.downPaymentCovered.toFixed(1)}%</span>
            </div>
            ` : ''}
        </div>
    `;
}

function generateGenericReport(model, result, inputs) {
    return `
        <div class="detailed-report">
            <div class="report-header" style="
                background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h2 style="margin: 0 0 10px 0;">${model.name}</h2>
                <h3 style="margin: 0; font-weight: 300;">${model.subtitle}</h3>
                <p style="margin-top: 15px; opacity: 0.9;">${model.description}</p>
            </div>
            
            <div class="executive-summary" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
            ">
                <h3 style="margin-top: 0;">📈 Executive Summary</h3>
                <p>Detailed calculation report for ${model.name} strategy.</p>
                
                <div class="key-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Net Benefit</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${result.netBenefit >= 0 ? '#27ae60' : '#e74c3c'}">
                            $${(result.netBenefit || 0).toLocaleString()}
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getRiskColor(result.risk || 3)}">
                            ${result.risk || 3}/5
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="calculation-details">
                <h3>🔢 Calculation Details</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 10px;">
                    <pre style="
                        background: #2c3e50;
                        color: white;
                        padding: 15px;
                        border-radius: 6px;
                        overflow-x: auto;
                        font-family: 'Courier New', monospace;
                    ">
${JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    `;
}

function generateRecommendationText(modelId, result) {
    const netBenefit = result.netBenefit || 0;
    const risk = result.risk || 3;
    
    if (modelId === 'three-thirty') {
        if (netBenefit > 100000) {
            return `This strategy is <strong>highly recommended</strong>. The three-year savings plan provides substantial financial benefits compared to immediate parent financing, with manageable risk and a clear path to home ownership.`;
        } else if (netBenefit > 0) {
            return `This strategy is <strong>recommended</strong>. While the benefits are moderate, it represents a solid approach to achieving home ownership through disciplined savings.`;
        } else {
            return `This strategy <strong>requires careful consideration</strong>. The financial benefits are limited, and alternative approaches may be more suitable for your situation.`;
        }
    }
    
    // Generic recommendation for other models
    if (netBenefit > 150000) {
        return `⭐ <strong>Excellent choice!</strong> This strategy shows exceptional financial benefits with reasonable risk.`;
    } else if (netBenefit > 50000) {
        return `✅ <strong>Strong recommendation.</strong> Positive financial outcome with manageable risk factors.`;
    } else if (netBenefit > 0) {
        return `⚠️ <strong>Consider carefully.</strong> Limited financial benefits with potential risk factors to weigh.`;
    } else {
        return `❌ <strong>Not recommended.</strong> This strategy shows negative financial outcomes.`;
    }
}

function addReportStyles() {
    // Check if styles already added
    if (document.getElementById('report-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'report-styles';
    style.textContent = `
        .report-tab.active {
            color: blue;
            background: white !important;
            border-bottom-color: #3498db !important;
            font-weight: bold !important;
        }
        
        .detailed-report h3 {
            color: #2c3e50;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .detailed-report h4 {
            color: #34495e;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        
        .detailed-report table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .detailed-report th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
        }
        
        .detailed-report td {
            padding: 10px 12px;
            border: 1px solid #ddd;
        }
        
        .detailed-report tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        .detailed-report .formula-box {
            background: #f1f1f1;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            border-left: 4px solid #3498db;
        }
        
        .detailed-report .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        .detailed-report .warning {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 10px 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        .detailed-report .success {
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 10px 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        @media print {
            .report-tabs, .reports-actions, .close-modal {
                display: none !important;
            }
            
            .modal-content {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                box-shadow: none !important;
            }
            
            .detailed-report {
                page-break-inside: avoid;
            }
            
            .scenarios-grid {
                page-break-inside: avoid;
            }
        }
    `;
    
    document.head.appendChild(style);
}

function printDetailedReports() {
    window.print();
}

function exportReportsToPDF() {
    alert('PDF export functionality would be implemented here. In a production environment, this would use a library like jsPDF or generate a server-side PDF.');
}

// Utility function to get risk color
function getRiskColor(riskLevel) {
    if (riskLevel <= 2) return '#2ecc71';
    if (riskLevel <= 3) return '#f39c12';
    if (riskLevel <= 4) return '#e74c3c';
    return '#8e44ad';
}

// Utility function to get risk label
function getRiskLabel(riskLevel) {
    if (riskLevel <= 1.5) return 'Very Low';
    if (riskLevel <= 2.5) return 'Low';
    if (riskLevel <= 3.5) return 'Medium';
    if (riskLevel <= 4.5) return 'High';
    return 'Very High';
}*/

// ============================================
// DETAILED CALCULATION REPORT FUNCTIONS
// ============================================

function showDetailedCalculation(modelId) {
    console.log(`Showing detailed calculation for: ${modelId}`);
    
    // Get model results and inputs
    const modelResults = allResults[modelId] || JSON.parse(localStorage.getItem('modelResults'))[modelId];
    const modelInputsData = modelInputs[modelId] || JSON.parse(localStorage.getItem('modelInputs'))[modelId];
    
    if (!modelResults) {
        alert('No calculation data available for this model.');
        return;
    }
    
    // Create modal for detailed report
    const modal = document.createElement('div');
    modal.className = 'detailed-calculation-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
        overflow-y: auto;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'detailed-calculation-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    // Generate detailed report HTML based on model type
    let reportHTML = generateDetailedReportHTML(modelId, modelResults, modelInputsData);
    
    modalContent.innerHTML = `
        <div class="detailed-report-header" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px 12px 0 0;
            position: sticky;
            top: 0;
            z-index: 10;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; font-size: 1.8rem;">📊 ${MODELS[modelId].name} - Detailed Calculation Report</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${MODELS[modelId].subtitle}</p>
                </div>
                <button onclick="this.closest('.detailed-calculation-modal').remove();" 
                        style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            font-size: 1.5rem;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                    ×
                </button>
            </div>
        </div>
        
        <div class="detailed-report-body" style="padding: 30px;">
            <div class="quick-summary" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #667eea;
            ">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    <div class="summary-item">
                        <div style="font-size: 0.9rem; color: #666;">Child's Net Benefit</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${modelResults.netBenefit > 0 ? '#27ae60' : '#e74c3c'}">
                            $${formatNumber(modelResults.childBeneiftValue || modelResults.netBenefit || 0)}
                        </div>
                    </div>
                    <div class="summary-item">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getRiskColor(modelResults.risk)}">
                            ${getRiskText(modelResults.risk)} (${modelResults.risk}/5)
                        </div>
                    </div>
                    <div class="summary-item">
                        <div style="font-size: 0.9rem; color: #666;">Time to Home</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">
                            ${modelResults.timeToHome || 0} years
                        </div>
                    </div>
                    <div class="summary-item">
                        <div style="font-size: 0.9rem; color: #666;">Success Probability</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2ecc71;">
                            ${modelResults.successRate || modelResults.successProbability || 0}%
                        </div>
                    </div>
                </div>
            </div>
            
            ${reportHTML}
        </div>
        
        <div class="detailed-report-footer" style="
            padding: 20px 30px;
            border-top: 1px solid #eee;
            background: #f9f9f9;
            border-radius: 0 0 12px 12px;
            display: flex;
            justify-content: space-between;
        ">
            <div style="color: #666; font-size: 0.9rem;">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
            <button onclick="printDetailedReport('${modelId}')" style="
                background: #2ecc71;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                🖨️ Print Report
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add styles for the report
    addDetailedReportStyles();
}

function generateDetailedReportHTML(modelId, results, inputs) {
    switch(modelId) {
        case 'three-thirty':
            return generateThreeThirtyReport(results, inputs);
        case 'co-investing':
            return generateCoInvestingReport(results, inputs);
        case 'multi-gen':
            return generateMultiGenReport(results, inputs);
        case 'early-inheritance':
            return generateEarlyInheritanceReport(results, inputs);
        case 'home-equity':
            return generateHomeEquityReport(results, inputs);
        default:
            return generateGenericReport(results, inputs);
    }
}

function generateThreeThirtyReport(results, inputs) {
    return `
        <div class="report-section">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                📈 Scenario Analysis: Save vs Parent Loan
            </h3>
            
            <div class="scenario-comparison" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 20px 0;
            ">
                <!-- Scenario 1: Parent Loan -->
                <div class="scenario" style="border: 1px solid #e74c3c; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #e74c3c; margin-top: 0;">🔴 Parent Loan Scenario (Immediate Purchase)</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Parent Loan Amount</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario1DownPayment)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Mortgage Amount</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario1MortgageAmount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Monthly Parent Loan Payment</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario1ParentLoanPayment)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Monthly Mortgage Payment</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario1MonthlyPayment)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Monthly Payment</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber((results.scenario1ParentLoanPayment || 0) + results.scenario1MonthlyPayment)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Interest Paid (30 yrs)</td>
                            <td style="text-align: right; font-weight: bold; color: #e74c3c;">$${formatNumber(results.scenario1TotalInterest)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Home Value After 30 Years</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario1HomeValue)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Child's Equity After 30 Years</td>
                            <td style="text-align: right; font-weight: bold; font-size: 1.1rem;">$${formatNumber(results.scenario1Equity)}</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Scenario 2: Three for Thirty -->
                <div class="scenario" style="border: 1px solid #2ecc71; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #2ecc71; margin-top: 0;">🟢 Three for Thirty Scenario (Save First)</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Years of Saving</td>
                            <td style="text-align: right; font-weight: bold;">${results.timeToHome || 3} years</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Savings Accumulated</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario2SavingsAmount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Down Payment Achieved</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario2DownPayment)} (${results.scenario2DownPaymentPercent}%)</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Mortgage Amount</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario2MortgageAmount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Monthly Mortgage Payment</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario2MonthlyPayment)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Interest Paid (27 yrs)</td>
                            <td style="text-align: right; font-weight: bold; color: #e74c3c;">$${formatNumber(results.scenario2TotalInterest)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Home Value After 27 Years</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.scenario2HomeValue)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Child's Equity After 27 Years</td>
                            <td style="text-align: right; font-weight: bold; font-size: 1.1rem;">$${formatNumber(results.scenario2Equity)}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <!-- Comparison Summary -->
            <div class="comparison-summary" style="
                background: #e8f4fc;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            ">
                <h4 style="color: #2980b9; margin-top: 0;">📊 Financial Comparison</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #bdc3c7;">Equity Difference</td>
                        <td style="text-align: right; font-weight: bold; color: ${results.equityDifference > 0 ? '#27ae60' : '#e74c3c'};">
                            $${formatNumber(results.equityDifference)} ${results.equityDifference > 0 ? 'more with saving' : 'more with parent loan'}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #bdc3c7;">Total Cost Difference</td>
                        <td style="text-align: right; font-weight: bold; color: ${results.costDifference > 0 ? '#27ae60' : '#e74c3c'};">
                            $${formatNumber(results.costDifference)} ${results.costDifference > 0 ? 'cheaper with saving' : 'cheaper with parent loan'}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #bdc3c7;">Down Payment Goal</td>
                        <td style="text-align: right; font-weight: bold; color: ${results.meetsDownPaymentGoal ? '#27ae60' : '#e74c3c'};">
                            ${results.meetsDownPaymentGoal ? '✅ Achieved' : '❌ Not Achieved'} (${results.successRate}% of target)
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Input Parameters -->
            <div class="input-parameters" style="margin-top: 30px;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #95a5a6; padding-bottom: 10px;">
                    ⚙️ Input Parameters Used
                </h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
                    <div class="param-item">
                        <span style="color: #666;">Child Annual Income:</span>
                        <strong>$${formatNumber(inputs['tt-child-income'] || 60000)}</strong>
                    </div>
                    <div class="param-item">
                        <span style="color: #666;">Savings Rate:</span>
                        <strong>${inputs['tt-savings-rate'] || 70}%</strong>
                    </div>
                    <div class="param-item">
                        <span style="color: #666;">Target Down Payment:</span>
                        <strong>$${formatNumber(inputs['tt-target-downpayment'] || 80000)}</strong>
                    </div>
                    <div class="param-item">
                        <span style="color: #666;">Home Price:</span>
                        <strong>$${formatNumber(inputs['tt-home-price'] || 400000)}</strong>
                    </div>
                    <div class="param-item">
                        <span style="color: #666;">Parent Loan Rate:</span>
                        <strong>${inputs['tt-parent-loan-rate'] || 5}%</strong>
                    </div>
                    <div class="param-item">
                        <span style="color: #666;">Savings Years:</span>
                        <strong>${inputs['tt-savings-years'] || 3} years</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateCoInvestingReport(results, inputs) {
    return `
        <div class="report-section">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                📈 Co-Investing Analysis: Stock Investment vs Real Estate Loan
            </h3>
            
            <div class="comparison-section" style="margin: 20px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Stock Investment Scenario -->
                    <div style="border: 1px solid #f39c12; border-radius: 8px; padding: 20px;">
                        <h4 style="color: #f39c12; margin-top: 0;">💰 Keep in Stocks</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Initial Investment</td>
                                <td style="text-align: right;">$${formatNumber(inputs['ci-investment-amount'] || 200000)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Annual Return</td>
                                <td style="text-align: right;">${inputs['ci-stock-return'] || 6}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Time Horizon</td>
                                <td style="text-align: right;">${inputs['ci-time-horizon'] || 30} years</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Future Value</td>
                                <td style="text-align: right; font-weight: bold;">$${formatNumber(results.stockAfterTax)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Tax Paid</td>
                                <td style="text-align: right;">$${formatNumber(results.stockAfterTax - (inputs['ci-investment-amount'] || 200000) * Math.pow(1 + (inputs['ci-stock-return'] || 6)/100, inputs['ci-time-horizon'] || 30))}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Lending Scenario -->
                    <div style="border: 1px solid #2ecc71; border-radius: 8px; padding: 20px;">
                        <h4 style="color: #2ecc71; margin-top: 0;">🏠 Lend to Child</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Loan Amount</td>
                                <td style="text-align: right;">$${formatNumber(results.downpaymentAmount || inputs['ci-loan-amount'] || 200000)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Interest Rate</td>
                                <td style="text-align: right;">${inputs['ci-loan-rate'] || 5}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Home Price</td>
                                <td style="text-align: right;">$${formatNumber(results.homePrice || inputs['ci-home-price'] || 400000)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Future Home Value</td>
                                <td style="text-align: right; font-weight: bold;">$${formatNumber(results.homeFutureValue)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Parent Interest (After Tax)</td>
                                <td style="text-align: right;">$${formatNumber(results.parentInterestAfterTax)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Child's Position -->
            <div class="child-position" style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            ">
                <h4 style="color: #2c3e50; margin-top: 0;">👨‍👩‍👧‍👦 Child's Financial Position</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div>
                        <span style="color: #666;">Child's Equity in Home:</span>
                        <strong style="float: right;">$${formatNumber(results.childEquity)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Rent Savings vs Buying:</span>
                        <strong style="float: right; color: #27ae60;">$${formatNumber(results.childRentSavings)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Monthly Mortgage Payment:</span>
                        <strong style="float: right;">$${formatNumber(results.monthlyMortgagePayment)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Monthly Parent Loan Payment:</span>
                        <strong style="float: right;">$${formatNumber(results.monthlyTotalPayment - results.monthlyMortgagePayment)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Debt Service Ratio:</span>
                        <strong style="float: right;">${results.debtServiceRatio}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Mortgage to Income Ratio:</span>
                        <strong style="float: right;">${results.mortgageToIncomeRatio}</strong>
                    </div>
                </div>
            </div>
            
            <!-- Family Wealth Analysis -->
            <div class="family-wealth" style="margin: 20px 0;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #9b59b6; padding-bottom: 10px;">
                    💰 Family Wealth Impact
                </h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px; font-weight: bold;">Total Lending Scenario Value</td>
                        <td style="padding: 12px; text-align: right; font-weight: bold; color: ${results.netFamilyBenefit > 0 ? '#27ae60' : '#e74c3c'}">
                            $${formatNumber(results.lendingScenarioValue)}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">Stock Investment Value</td>
                        <td style="padding: 12px; text-align: right;">$${formatNumber(results.stockAfterTax)}</td>
                    </tr>
                    <tr style="background: #e8f4fc;">
                        <td style="padding: 12px; font-weight: bold;">Net Family Benefit</td>
                        <td style="padding: 12px; text-align: right; font-weight: bold; color: ${results.netFamilyBenefit > 0 ? '#27ae60' : '#e74c3c'}">
                            $${formatNumber(results.netFamilyBenefit)}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">Opportunity Cost</td>
                        <td style="padding: 12px; text-align: right; color: ${results.opportunityCost > 0 ? '#27ae60' : '#e74c3c'}">
                            $${formatNumber(results.opportunityCost)}
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    `;
}

function generateMultiGenReport(results, inputs) {
    return `
        <div class="report-section">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                🏡 Multi-Generation Living Analysis
            </h3>
            
            <!-- Construction Details -->
            <div class="construction-details" style="margin: 20px 0;">
                <h4 style="color: #e67e22; margin-top: 0;">🏗️ Construction Details</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Build Type</td>
                                <td style="text-align: right; font-weight: bold;">${inputs['mg-build-type'] || 'laneway'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Build Cost</td>
                                <td style="text-align: right; font-weight: bold;">$${formatNumber(results.buildCost)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Construction Loan Term</td>
                                <td style="text-align: right;">${results.constructionLoanTerm || 25} years</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Monthly Construction Payment</td>
                                <td style="text-align: right; font-weight: bold;">$${formatNumber(results.monthlyConstructionPayment)}</td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Years Living Together</td>
                                <td style="text-align: right;">${results.livingYears || 10} years</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Child's Equity Share</td>
                                <td style="text-align: right; font-weight: bold;">${results.childEquityPercentage}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Parent's Equity Share</td>
                                <td style="text-align: right;">${results.parentEquityPercentage}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Future Property Value</td>
                                <td style="text-align: right; font-weight: bold;">$${formatNumber(results.futurePropertyValue)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Child's Financial Analysis -->
            <div class="child-analysis" style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #d35400; margin-top: 0;">👶 Child's Financial Analysis</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div>
                        <span style="color: #666;">Total Payments Made:</span>
                        <strong style="float: right; color: #e74c3c;">$${formatNumber(results.childTotalPayments)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Child's Equity Value:</span>
                        <strong style="float: right; color: #27ae60;">$${formatNumber(results.childEquityValue)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Rent Savings:</span>
                        <strong style="float: right; color: #27ae60;">$${formatNumber(results.rentSavingsVsLoanPayments)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Net Benefit:</span>
                        <strong style="float: right; color: ${results.childNetBenefit > 0 ? '#27ae60' : '#e74c3c'}; font-size: 1.1rem;">
                            $${formatNumber(results.childNetBenefit)}
                        </strong>
                    </div>
                </div>
                <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
                    <div style="font-size: 0.9rem; color: #666;">Benefit to Cost Ratio:</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${parseFloat(results.benefitToCostRatio) > 1 ? '#27ae60' : '#e74c3c'}">
                        ${results.benefitToCostRatio}
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                        ${parseFloat(results.benefitToCostRatio) > 1 ? 
                          '✅ For every $1 invested, child gets more than $1 back' : 
                          '⚠️ For every $1 invested, child gets less than $1 back'}
                    </div>
                </div>
            </div>
            
            <!-- Parent's Financial Analysis -->
            <div class="parent-analysis" style="background: #e8f4fc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2980b9; margin-top: 0;">👴 Parent's Financial Analysis</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                    <div>
                        <span style="color: #666;">Original Property Value:</span>
                        <strong style="float: right;">$${formatNumber(results.futurePropertyValue - results.valueAddedByConstruction)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Value Added by Construction:</span>
                        <strong style="float: right; color: #27ae60;">$${formatNumber(results.valueAddedByConstruction)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Parent's Future Equity:</span>
                        <strong style="float: right; color: #27ae60;">$${formatNumber(results.parentFutureEquity)}</strong>
                    </div>
                    <div>
                        <span style="color: #666;">Parent's Net Benefit:</span>
                        <strong style="float: right; color: ${results.parentNetBenefit > 0 ? '#27ae60' : '#e74c3c'}; font-size: 1.1rem;">
                            $${formatNumber(results.parentNetBenefit)}
                        </strong>
                    </div>
                </div>
            </div>
            
            <!-- Annual Return Analysis -->
            <div class="return-analysis" style="margin: 20px 0;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #95a5a6; padding-bottom: 10px;">
                    📊 Return on Investment Analysis
                </h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
                    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="font-size: 2rem; color: #3498db;">${results.annualReturnOnInvestment}%</div>
                        <div style="color: #666; margin-top: 5px;">Annual Return</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="font-size: 2rem; color: ${results.successProbability > 70 ? '#2ecc71' : '#e74c3c'}">
                            ${results.successProbability}%
                        </div>
                        <div style="color: #666; margin-top: 5px;">Success Probability</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="font-size: 2rem; color: #e67e22;">${results.timeToHome} yrs</div>
                        <div style="color: #666; margin-top: 5px;">Time to Benefit</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateEarlyInheritanceReport(results, inputs) {
    return `
        <div class="report-section">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                💰 Early vs Late Inheritance Analysis
            </h3>
            
            <div class="scenario-comparison" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 20px 0;
            ">
                <!-- Early Inheritance Scenario -->
                <div class="scenario" style="border: 1px solid #2ecc71; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #2ecc71; margin-top: 0;">🟢 Early Inheritance (Buy Now)</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Inheritance Received</td>
                            <td style="text-align: right;">$${formatNumber(inputs['ei-early-amount'] || 100000)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Used as Down Payment</td>
                            <td style="text-align: right;">${inputs['ei-early-amount'] ? Math.min(inputs['ei-early-amount'] || 100000, (inputs['ei-home-price'] || 500000) * 0.2) : 100000}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Home Price</td>
                            <td style="text-align: right;">$${formatNumber(inputs['ei-home-price'] || 500000)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Monthly Mortgage Payment</td>
                            <td style="text-align: right;">$${formatNumber(results.earlyScenario.monthlyMortgagePayment)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Debt Service Ratio</td>
                            <td style="text-align: right;">${results.earlyScenario.debtServiceRatio}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Future Home Value</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.earlyScenario.futureHomeValue)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Child's Equity</td>
                            <td style="text-align: right; font-weight: bold; font-size: 1.1rem; color: #27ae60;">
                                $${formatNumber(results.earlyScenario.childEquity)}
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Late Inheritance Scenario -->
                <div class="scenario" style="border: 1px solid #e74c3c; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #e74c3c; margin-top: 0;">🔴 Late Inheritance (Rent & Wait)</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Inheritance Received</td>
                            <td style="text-align: right;">$${formatNumber(inputs['ei-late-amount'] || 750000)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Years Until Inheritance</td>
                            <td style="text-align: right;">${inputs['ei-years-until-late'] || 30} years</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Monthly Rent</td>
                            <td style="text-align: right;">$${formatNumber(inputs['ei-monthly-rent'] || 1500)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Rent Paid</td>
                            <td style="text-align: right; color: #e74c3c;">$${formatNumber(results.lateScenario.totalRentCost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">First Year Rent/Income</td>
                            <td style="text-align: right;">${results.lateScenario.firstYearRentRatio}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Late Inheritance Value</td>
                            <td style="text-align: right; font-weight: bold;">$${formatNumber(results.lateScenario.lateInheritanceValue)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Child's Net Wealth</td>
                            <td style="text-align: right; font-weight: bold; font-size: 1.1rem; color: #27ae60;">
                                $${formatNumber(results.lateScenario.childNetWealth)}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <!-- Financial Comparison -->
            <div class="financial-comparison" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin: 20px 0;
            ">
                <h4 style="margin-top: 0; color: white;">⚖️ Financial Comparison</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Net Benefit Difference</div>
                        <div style="font-size: 2rem; font-weight: bold; margin: 10px 0;">
                            $${formatNumber(results.netBenefit)}
                        </div>
                        <div style="font-size: 0.9rem;">
                            ${results.netBenefit > 0 ? '✅ Early inheritance is better' : '⚠️ Late inheritance is better'}
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Equity vs Rent Difference</div>
                        <div style="font-size: 2rem; font-weight: bold; margin: 10px 0; color: ${results.equityVsRentDifference > 0 ? '#2ecc71' : '#e74c3c'}">
                            $${formatNumber(results.equityVsRentDifference)}
                        </div>
                        <div style="font-size: 0.9rem;">
                            ${results.equityVsRentDifference > 0 ? 'Equity outweighs rent costs' : 'Rent costs exceed equity gains'}
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Recommendation</div>
                        <div style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">
                            ${results.recommendation}
                        </div>
                        <div style="font-size: 0.9rem;">
                            Success: ${results.successProbability}%
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Rent History (if available) -->
            ${results.rentHistory ? `
            <div class="rent-history" style="margin: 20px 0;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #95a5a6; padding-bottom: 10px;">
                    📅 Rent Payment Projection
                </h4>
                <div style="max-height: 200px; overflow-y: auto; margin-top: 15px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8f9fa; position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 10px; text-align: left;">Year</th>
                                <th style="padding: 10px; text-align: right;">Annual Rent</th>
                                <th style="padding: 10px; text-align: right;">Cumulative</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.rentHistory.slice(0, 10).map(year => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">Year ${year.year}</td>
                                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${formatNumber(year.annualRent)}</td>
                                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${formatNumber(year.cumulativeRent)}</td>
                                </tr>
                            `).join('')}
                            ${results.rentHistory.length > 10 ? `
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: center; color: #666;">
                                        ... and ${results.rentHistory.length - 10} more years
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
            
            <!-- Retirement Impact -->
            <div class="retirement-impact" style="
                background: ${results.retirementImpact === 'significant' ? '#fff8e1' : '#e8f7e8'};
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid ${results.retirementImpact === 'significant' ? '#e74c3c' : '#2ecc71'};
            ">
                <h4 style="margin-top: 0; color: ${results.retirementImpact === 'significant' ? '#d35400' : '#27ae60'}">
                    ${results.retirementImpact === 'significant' ? '⚠️' : '✅'} Retirement Impact Assessment
                </h4>
                <p>
                    ${results.retirementImpact === 'significant' ? 
                      'Early inheritance may significantly impact retirement goals. Consider consulting a financial advisor.' :
                      'Early inheritance has minimal impact on retirement goals.'}
                </p>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    Assessment: <strong>${results.retirementImpact}</strong>
                </div>
            </div>
        </div>
    `;
}

function generateHomeEquityReport(results, inputs) {
    return `
        <div class="report-section">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                🏠 Home Equity Analysis: ${inputs['he-method'] === 'reverse' ? 'Reverse Mortgage' : 'HELOC/Traditional Loan'}
            </h3>
            
            <!-- Method Selection -->
            <div class="method-info" style="margin: 20px 0;">
                <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 2rem;">
                        ${inputs['he-method'] === 'reverse' ? '🏦' : '💰'}
                    </div>
                    <div>
                        <h4 style="margin: 0; color: #2c3e50;">
                            Selected Method: ${inputs['he-method'] === 'reverse' ? 'Reverse Mortgage' : 'HELOC/Traditional Loan'}
                        </h4>
                        <p style="margin: 5px 0 0 0; color: #666;">
                            ${inputs['he-method'] === 'reverse' ? 
                              'No monthly payments required from parents. Debt accumulates and is repaid when home is sold.' :
                              'Traditional loan structure with regular monthly payments.'}
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Parent's Home Details -->
            <div class="parent-home" style="background: #e8f4fc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2980b9; margin-top: 0;">🏡 Parent's Home Details</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #bdc3c7;">Current Home Value</td>
                                <td style="text-align: right;">$${formatNumber(inputs['he-home-value'] || 750000)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #bdc3c7;">Current Mortgage</td>
                                <td style="text-align: right;">$${formatNumber(inputs['he-current-mortgage'] || 200000)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #bdc3c7;">Available Equity</td>
                                <td style="text-align: right; font-weight: bold; color: #27ae60;">
                                    $${formatNumber((inputs['he-home-value'] || 750000) - (inputs['he-current-mortgage'] || 200000))}
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #bdc3c7;">Amount Needed</td>
                                <td style="text-align: right;">$${formatNumber(inputs['he-amount-needed'] || 100000)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #bdc3c7;">Interest Rate</td>
                                <td style="text-align: right;">${inputs['he-new-rate'] || 5.5}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #bdc3c7;">Repayment Responsibility</td>
                                <td style="text-align: right; font-weight: bold;">${inputs['he-repayment'] || 'parents'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Child's Home Details -->
            <div class="child-home" style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #d35400; margin-top: 0;">👶 Child's Home Purchase</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f39c12;">Purchase Price</td>
                                <td style="text-align: right;">$${formatNumber(results.traditionalLoan?.childHome?.purchasePrice || (inputs['he-amount-needed'] || 100000) / 0.2)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f39c12;">Down Payment (20%)</td>
                                <td style="text-align: right; font-weight: bold;">$${formatNumber(inputs['he-amount-needed'] || 100000)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f39c12;">Mortgage Amount</td>
                                <td style="text-align: right;">$${formatNumber((inputs['he-amount-needed'] || 100000) / 0.2 - (inputs['he-amount-needed'] || 100000))}</td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f39c12;">Monthly Mortgage Payment</td>
                                <td style="text-align: right;">$${formatNumber(results.traditionalLoan?.childMortgage?.monthlyPayment || 
                                    calculateMonthlyPayment(
                                        (inputs['he-amount-needed'] || 100000) / 0.2 - (inputs['he-amount-needed'] || 100000),
                                        0.045/12,
                                        25*12
                                    )
                                )}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f39c12;">Future Home Value (30 yrs)</td>
                                <td style="text-align: right; font-weight: bold; color: #27ae60;">
                                    $${formatNumber(results.traditionalLoan?.childHome?.futureValue || 
                                        ((inputs['he-amount-needed'] || 100000) / 0.2) * Math.pow(1.04, 30)
                                    )}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Financial Outcomes -->
            <div class="financial-outcomes" style="margin: 20px 0;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #9b59b6; padding-bottom: 10px;">
                    💰 Financial Outcomes After 30 Years
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">
                    <div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h5 style="margin-top: 0; color: #2980b9;">Child's Position</h5>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Equity in Home</td>
                                <td style="text-align: right; font-weight: bold; color: #27ae60;">
                                    $${formatNumber(results.traditionalLoan?.childEquity || 0)}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Payments Made</td>
                                <td style="text-align: right; color: #e74c3c;">
                                    $${formatNumber(results.traditionalLoan?.payments?.childTotalAdditional || 0)}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold;">Net Benefit</td>
                                <td style="text-align: right; font-weight: bold; font-size: 1.1rem; color: ${results.childNetBenefit > 0 ? '#27ae60' : '#e74c3c'}">
                                    $${formatNumber(results.traditionalLoan?.childNetBenefit || 0)}
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h5 style="margin-top: 0; color: #2980b9;">Parent's Position</h5>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Home Equity After 30 yrs</td>
                                <td style="text-align: right;">$${formatNumber(results.traditionalLoan?.parentHome?.futureValue || 
                                    (inputs['he-home-value'] || 750000) * Math.pow(1.04, 30)
                                )}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Net Equity</td>
                                <td style="text-align: right; font-weight: bold; color: #27ae60;">
                                    $${formatNumber(results.traditionalLoan?.parentNetEquity || 0)}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold;">Total Payments Made</td>
                                <td style="text-align: right; color: #e74c3c;">
                                    $${formatNumber(results.traditionalLoan?.payments?.parentTotal || 0)}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Risk Assessment -->
            ${results.risks ? `
            <div class="risk-assessment" style="
                background: ${results.risks.overallRisk >= 4 ? '#ffeaea' : '#fff8e1'};
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid ${getRiskColor(results.risks.overallRisk)};
            ">
                <h4 style="margin-top: 0; color: ${getRiskColor(results.risks.overallRisk)}">
                    ⚠️ Risk Assessment: ${results.risks.riskLevel}
                </h4>
                
                ${results.risks.riskFactors.length > 0 ? `
                <div style="margin-top: 15px;">
                    <h5 style="margin-bottom: 10px; color: #e74c3c;">Identified Risks:</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${results.risks.riskFactors.map(risk => `<li>${risk}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${results.risks.mitigationStrategies.length > 0 ? `
                <div style="margin-top: 15px;">
                    <h5 style="margin-bottom: 10px; color: #27ae60;">Mitigation Strategies:</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${results.risks.mitigationStrategies.map(strategy => `<li>${strategy}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
                    Overall Risk Score: <strong>${results.risks.overallRisk}/5</strong>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function generateGenericReport(results, inputs) {
    return `
        <div class="report-section">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                📊 Detailed Calculation Report
            </h3>
            
            <!-- Key Results -->
            <div class="key-results" style="margin: 20px 0;">
                <h4 style="color: #2c3e50;">Key Financial Results</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">
                    <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 0.9rem; color: #666;">Net Benefit</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${results.netBenefit > 0 ? '#27ae60' : '#e74c3c'}">
                            $${formatNumber(results.netBenefit)}
                        </div>
                    </div>
                    <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 0.9rem; color: #666;">Risk Level</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${getRiskColor(results.risk)}">
                            ${getRiskText(results.risk)} (${results.risk}/5)
                        </div>
                    </div>
                    <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 0.9rem; color: #666;">Time to Benefit</div>
                        <div style="font-size: 2rem; font-weight: bold; color: #3498db;">
                            ${results.timeToHome || results.timeToBenefit || 0} years
                        </div>
                    </div>
                    <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 0.9rem; color: #666;">Success Probability</div>
                        <div style="font-size: 2rem; font-weight: bold; color: #2ecc71;">
                            ${results.successRate || results.successProbability || 0}%
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- All Results Data -->
            <div class="all-results" style="margin: 20px 0;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #95a5a6; padding-bottom: 10px;">
                    📋 All Calculation Data
                </h4>
                <div style="max-height: 300px; overflow-y: auto; margin-top: 15px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8f9fa; position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 10px; text-align: left;">Metric</th>
                                <th style="padding: 10px; text-align: right;">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(results).map(([key, value]) => {
                                if (typeof value === 'object') return '';
                                return `
                                    <tr>
                                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatKey(key)}</td>
                                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">
                                            ${typeof value === 'number' ? `$${formatNumber(value)}` : value}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function addDetailedReportStyles() {
    // Add styles if not already present
    if (!document.getElementById('detailed-report-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'detailed-report-styles';
        styleSheet.textContent = `
            .detailed-calculation-modal {
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .detailed-calculation-content {
                animation: slideUp 0.3s ease-out;
            }
            
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .report-section h4 {
                margin-top: 25px;
                margin-bottom: 15px;
            }
            
            .param-item {
                padding: 10px;
                background: white;
                border-radius: 6px;
                border: 1px solid #eee;
            }
            
            .scenario {
                transition: transform 0.3s ease;
            }
            
            .scenario:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            
            @media print {
                .detailed-calculation-modal {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: auto;
                    background: white;
                    padding: 0;
                }
                
                .detailed-calculation-content {
                    max-height: none;
                    box-shadow: none;
                    border-radius: 0;
                }
                
                button {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return Math.round(num).toLocaleString();
}

function getRiskColor(risk) {
    if (risk <= 2) return '#2ecc71'; // Green
    if (risk <= 3) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
}

function getRiskText(risk) {
    if (risk <= 2) return 'Low';
    if (risk <= 3) return 'Medium';
    if (risk <= 4) return 'High';
    return 'Very High';
}

function formatKey(key) {
    // Convert camelCase or snake_case to readable text
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function printDetailedReport(modelId) {
    const modal = document.querySelector('.detailed-calculation-modal');
    if (!modal) return;
    
    const originalContent = modal.innerHTML;
    
    // Create print-friendly version
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Detailed Calculation Report - ${MODELS[modelId].name}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        color: #333;
                    }
                    h1, h2, h3, h4 {
                        color: #2c3e50;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th, td {
                        padding: 10px;
                        border: 1px solid #ddd;
                        text-align: left;
                    }
                    th {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .summary-box {
                        background: #f8f9fa;
                        padding: 20px;
                        margin: 20px 0;
                        border-left: 4px solid #3498db;
                    }
                    .scenario-box {
                        border: 1px solid #ddd;
                        padding: 15px;
                        margin: 15px 0;
                        page-break-inside: avoid;
                    }
                    @media print {
                        body {
                            margin: 20px;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>${MODELS[modelId].name}</h1>
                <h2>${MODELS[modelId].subtitle}</h2>
                <p><em>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</em></p>
                ${modal.querySelector('.detailed-report-body').innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.print();
    };
}

// ============================================
// MODIFY COMPARISON PAGE TO ADD DETAILED VIEW BUTTONS
// ============================================

function addDetailedViewButtons() {
    console.log('Adding detailed view buttons...');
    
    // Try multiple selectors for comparison table
    let comparisonTable = document.querySelector('.comparison-table');
    if (!comparisonTable) {
        comparisonTable = document.querySelector('table');
    }
    
    // Try multiple selectors for strategy cards
    let strategyCards = document.querySelectorAll('.strategy-card');
    if (strategyCards.length === 0) {
        strategyCards = document.querySelectorAll('.strategy-card, .model-card, [class*="card"]');
    }
    
    console.log(`Found: comparisonTable=${comparisonTable ? 'Yes' : 'No'}, strategyCards=${strategyCards.length}`);
    
    // Add buttons to comparison table rows
    if (comparisonTable) {
        console.log('Processing comparison table rows...');
        const rows = comparisonTable.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            const modelCell = row.querySelector('td:first-child');
            if (modelCell && !modelCell.querySelector('.view-details-btn')) {
                const modelName = modelCell.textContent.trim().split('\n')[0]; // Get first line only
                const modelId = getModelIdByName(modelName);
                
                if (modelId) {
                    console.log(`Adding button for model: ${modelName} (ID: ${modelId})`);
                    
                    // Create button container
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.cssText = 'margin-top: 5px;';
                    
                    const button = document.createElement('button');
                    button.className = 'view-details-btn';
                    button.innerHTML = '📊 View Details';
                    button.style.cssText = `
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 0.85rem;
                        cursor: pointer;
                        transition: background 0.3s;
                        display: inline-block;
                    `;
                    button.onmouseover = () => button.style.background = '#2980b9';
                    button.onmouseout = () => button.style.background = '#3498db';
                    button.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showDetailedCalculation(modelId);
                    };
                    
                    buttonContainer.appendChild(button);
                    modelCell.appendChild(buttonContainer);
                }
            }
        });
    }
    
    // Add buttons to strategy cards
    strategyCards.forEach(card => {
        if (!card.querySelector('.view-details-btn')) {
            // Try to find model name in various places
            let modelName = '';
            const titleElement = card.querySelector('h3, h2, .model-name, .strategy-title');
            if (titleElement) {
                modelName = titleElement.textContent.trim().split('\n')[0];
            } else {
                // Try to get text from the card
                modelName = card.textContent.trim().split('\n')[0].split(':')[0];
            }
            
            const modelId = getModelIdByName(modelName);
            
            if (modelId) {
                console.log(`Adding button to strategy card for model: ${modelName} (ID: ${modelId})`);
                
                // Create button container
                const buttonContainer = document.createElement('div');
                buttonContainer.style.cssText = 'margin-top: 15px; text-align: center;';
                
                const button = document.createElement('button');
                button.className = 'view-details-btn';
                button.innerHTML = '📊 View Detailed Calculation';
                button.style.cssText = `
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: background 0.3s;
                    width: 100%;
                    max-width: 250px;
                `;
                button.onmouseover = () => button.style.background = '#2980b9';
                button.onmouseout = () => button.style.background = '#3498db';
                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showDetailedCalculation(modelId);
                };
                
                buttonContainer.appendChild(button);
                
                // Add to card - try different positions
                const actionsDiv = card.querySelector('.strategy-actions, .card-actions, .actions');
                if (actionsDiv) {
                    actionsDiv.appendChild(buttonContainer);
                } else {
                    card.appendChild(buttonContainer);
                }
            }
        }
    });
    
    // Add CSS styles if not already present
    if (!document.querySelector('#view-details-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'view-details-styles';
        styleSheet.textContent = `
            .view-details-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .view-details-btn:active {
                transform: translateY(0);
            }
            
            @media (max-width: 768px) {
                .view-details-btn {
                    padding: 8px 12px !important;
                    font-size: 0.8rem !important;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    console.log('Finished adding detailed view buttons');
}

function getModelIdByName(modelName) {
    if (!modelName) return null;
    
    // Clean up the model name
    const cleanName = modelName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .trim();
    
    console.log(`Looking for model ID for: "${modelName}" (cleaned: "${cleanName}")`);
    
    // Try exact match first
    for (const [id, model] of Object.entries(MODELS)) {
        const modelCleanName = model.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s-]/g, '')
            .trim();
            
        if (modelCleanName === cleanName) {
            console.log(`Exact match found: ${id}`);
            return id;
        }
    }
    
    // Try partial match
    for (const [id, model] of Object.entries(MODELS)) {
        const modelCleanName = model.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s-]/g, '')
            .trim();
            
        if (cleanName.includes(modelCleanName) || modelCleanName.includes(cleanName)) {
            console.log(`Partial match found: ${id}`);
            return id;
        }
        
        // Also check if model name contains key words
        const keyWords = ['three', 'thirty', 'co-invest', 'multi', 'generation', 'early', 'inheritance', 'home', 'equity'];
        for (const word of keyWords) {
            if (cleanName.includes(word) && modelCleanName.includes(word)) {
                console.log(`Keyword match found for "${word}": ${id}`);
                return id;
            }
        }
    }
    
    console.log(`No match found for: "${modelName}"`);
    return null;
}

