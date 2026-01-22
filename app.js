/* =============================================
   Calorelia - Application Logic
   ============================================= */

// =============================================
// State Management
// =============================================

const state = {
    foods: [],
    dailyGoals: {
        protein: null,
        calories: null
    },
    history: [],
    showingDifference: false,
    foodCounter: 0
};

// LocalStorage keys
const STORAGE_KEYS = {
    FOODS: 'calorelia_foods',
    GOALS: 'calorelia_goals',
    HISTORY: 'calorelia_history',
    COUNTER: 'calorelia_counter',
    API_KEY: 'calorelia_api_key'
};

// =============================================
// DOM Elements
// =============================================

const elements = {
    // Icons
    iconAI: document.getElementById('iconAI'),
    iconAdd: document.getElementById('iconAdd'),
    iconSettings: document.getElementById('iconSettings'),

    // Main Display
    totalsDisplay: document.getElementById('totalsDisplay'),
    totalsText: document.getElementById('totalsText'),
    foodList: document.getElementById('foodList'),

    // Add Food Modal
    addFoodModal: document.getElementById('addFoodModal'),
    panelPrimary: document.getElementById('panelPrimary'),
    panelSecondary: document.getElementById('panelSecondary'),
    proteinInput: document.getElementById('proteinInput'),
    caloriesInput: document.getElementById('caloriesInput'),
    nameInput: document.getElementById('nameInput'),
    amountInput: document.getElementById('amountInput'),
    arrowToSecondary: document.getElementById('arrowToSecondary'),
    arrowToPrimary: document.getElementById('arrowToPrimary'),
    btnDone: document.getElementById('btnDone'),
    btnCancel: document.getElementById('btnCancel'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    goalProteinInput: document.getElementById('goalProteinInput'),
    goalCaloriesInput: document.getElementById('goalCaloriesInput'),
    btnResetSave: document.getElementById('btnResetSave'),
    btnCloseSettings: document.getElementById('btnCloseSettings'),
    historyContainer: document.getElementById('historyContainer'),

    // AI Modal
    aiModal: document.getElementById('aiModal'),
    aiPanelInput: document.getElementById('aiPanelInput'),
    aiPanelResult: document.getElementById('aiPanelResult'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    aiPromptInput: document.getElementById('aiPromptInput'),
    aiPreviewList: document.getElementById('aiPreviewList'),
    btnAISend: document.getElementById('btnAISend'),
    btnAICancel: document.getElementById('btnAICancel'),
    btnAIConfirm: document.getElementById('btnAIConfirm'),
    btnAIBack: document.getElementById('btnAIBack')
};

// =============================================
// State Extensions
// =============================================
state.pendingAIItems = [];
state.apiKey = '';

// =============================================
// Initialization
// =============================================

function initApp() {
    loadFromStorage();
    renderFoodList();
    updateTotalsDisplay();
    renderHistory();
    setupEventListeners();
    updateDoneButtonState();
}

function loadFromStorage() {
    try {
        const foods = localStorage.getItem(STORAGE_KEYS.FOODS);
        const goals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
        const counter = localStorage.getItem(STORAGE_KEYS.COUNTER);

        if (foods) state.foods = JSON.parse(foods);
        if (goals) state.dailyGoals = JSON.parse(goals);
        if (history) state.history = JSON.parse(history);
        if (counter) state.foodCounter = parseInt(counter, 10);

        const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
        if (apiKey) {
            state.apiKey = apiKey;
            elements.apiKeyInput.value = apiKey;
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(state.foods));
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.dailyGoals));
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
        localStorage.setItem(STORAGE_KEYS.COUNTER, state.foodCounter.toString());
        localStorage.setItem(STORAGE_KEYS.API_KEY, state.apiKey);
    } catch (e) {
        console.error('Error saving to storage:', e);
    }
}

// =============================================
// Event Listeners
// =============================================

function setupEventListeners() {
    // Icon clicks
    elements.iconAI.addEventListener('click', openAIModal);
    elements.iconAdd.addEventListener('click', openAddFoodModal);
    elements.iconSettings.addEventListener('click', openSettingsModal);

    // Totals display click (toggle difference view)
    elements.totalsDisplay.addEventListener('click', toggleDifferenceView);

    // Add Food Modal
    elements.arrowToSecondary.addEventListener('click', showSecondaryPanel);
    elements.arrowToPrimary.addEventListener('click', showPrimaryPanel);
    elements.btnDone.addEventListener('click', handleAddFood);
    elements.btnCancel.addEventListener('click', closeAddFoodModal);

    // Input validation
    elements.proteinInput.addEventListener('input', updateDoneButtonState);
    elements.caloriesInput.addEventListener('input', updateDoneButtonState);

    // Settings Modal
    elements.btnResetSave.addEventListener('click', handleResetAndSave);
    elements.btnCloseSettings.addEventListener('click', closeSettingsModal);
    elements.goalProteinInput.addEventListener('change', handleGoalChange);
    elements.goalCaloriesInput.addEventListener('change', handleGoalChange);

    // AI Modal
    elements.btnAISend.addEventListener('click', handleAISend);
    elements.btnAICancel.addEventListener('click', closeAIModal);
    elements.btnAIConfirm.addEventListener('click', handleAIConfirm);
    elements.btnAIBack.addEventListener('click', showAIInputPanel);
    elements.apiKeyInput.addEventListener('change', () => {
        state.apiKey = elements.apiKeyInput.value;
        saveToStorage();
    });

    // Close modals on backdrop click
    [elements.addFoodModal, elements.settingsModal, elements.aiModal].forEach(modal => {
        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Auto-select text on focus for all number inputs (solves cursor annoyance)
    document.querySelectorAll('input[type="number"], input[type="text"], textarea').forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(() => input.select(), 0);
        });
    });

    // Keyboard handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// =============================================
// Modal Controls
// =============================================

function openAddFoodModal() {
    // Pre-set panel state before opening (no animation needed)
    elements.panelSecondary.classList.add('hidden');
    elements.panelSecondary.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
    elements.panelPrimary.classList.remove('hidden', 'exit-left', 'exit-right', 'enter-left', 'enter-right');

    // Clear inputs
    elements.proteinInput.value = '';
    elements.caloriesInput.value = '';
    elements.nameInput.value = '';
    elements.amountInput.value = '';
    elements.btnDone.disabled = true;

    // Use requestAnimationFrame for smooth opening
    requestAnimationFrame(() => {
        elements.addFoodModal.classList.add('active');
        // Focus after transition starts
        requestAnimationFrame(() => {
            elements.proteinInput.focus();
        });
    });
}

function closeAddFoodModal() {
    elements.addFoodModal.classList.remove('active');
}

function openSettingsModal() {
    // Populate current goals
    if (state.dailyGoals.protein !== null) {
        elements.goalProteinInput.value = state.dailyGoals.protein;
    }
    if (state.dailyGoals.calories !== null) {
        elements.goalCaloriesInput.value = state.dailyGoals.calories;
    }
    elements.settingsModal.classList.add('active');
}

function closeSettingsModal() {
    elements.settingsModal.classList.remove('active');
}

function openAIModal() {
    elements.aiModal.classList.add('active');
}

function closeAIModal() {
    elements.aiModal.classList.remove('active');
}

function closeAllModals() {
    elements.addFoodModal.classList.remove('active');
    elements.settingsModal.classList.remove('active');
    elements.aiModal.classList.remove('active');
}

// =============================================
// Add Food Panel Switching
// =============================================

function showSecondaryPanel() {
    elements.panelPrimary.classList.add('exit-left');

    // Prepare secondary panel
    elements.panelSecondary.classList.remove('hidden');
    elements.panelSecondary.classList.add('enter-right');

    // Trigger transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            elements.panelSecondary.classList.remove('enter-right');
        });
    });

    const onTransitionEnd = () => {
        if (!elements.panelPrimary.classList.contains('exit-left')) return;
        elements.panelPrimary.classList.add('hidden');
        elements.panelPrimary.classList.remove('exit-left');
        elements.panelPrimary.removeEventListener('transitionend', onTransitionEnd);
        elements.nameInput.focus();
    };

    elements.panelPrimary.addEventListener('transitionend', onTransitionEnd, { once: true });
    setTimeout(onTransitionEnd, 300);
}

function showPrimaryPanel() {
    elements.panelSecondary.classList.add('exit-right');

    // Prepare primary panel
    elements.panelPrimary.classList.remove('hidden');
    elements.panelPrimary.classList.add('enter-left');

    // Trigger transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            elements.panelPrimary.classList.remove('enter-left');
        });
    });

    const onTransitionEnd = () => {
        if (!elements.panelSecondary.classList.contains('exit-right')) return;
        elements.panelSecondary.classList.add('hidden');
        elements.panelSecondary.classList.remove('exit-right');
        elements.panelSecondary.removeEventListener('transitionend', onTransitionEnd);
    };

    elements.panelSecondary.addEventListener('transitionend', onTransitionEnd, { once: true });
    setTimeout(onTransitionEnd, 300);
}

function resetAddFoodForm() {
    elements.proteinInput.value = '';
    elements.caloriesInput.value = '';
    elements.nameInput.value = '';
    elements.amountInput.value = '';
    // Reset panels without animation
    elements.panelSecondary.classList.add('hidden');
    elements.panelSecondary.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
    elements.panelPrimary.classList.remove('hidden', 'exit-left', 'exit-right', 'enter-left', 'enter-right');
    updateDoneButtonState();
}

// =============================================
// Food Management
// =============================================

function updateDoneButtonState() {
    const protein = parseFloat(elements.proteinInput.value);
    const calories = parseFloat(elements.caloriesInput.value);

    const isValid = !isNaN(protein) && protein >= 0 &&
        !isNaN(calories) && calories >= 0 &&
        (protein > 0 || calories > 0);

    elements.btnDone.disabled = !isValid;
}

function handleAddFood() {
    const protein = parseFloat(elements.proteinInput.value) || 0;
    const calories = parseFloat(elements.caloriesInput.value) || 0;
    const name = elements.nameInput.value.trim() || null;
    const amount = parseFloat(elements.amountInput.value) || 1;

    // Validation
    if (protein === 0 && calories === 0) {
        return;
    }

    // Increment counter only if no name provided
    if (!name) {
        state.foodCounter++;
    }

    const food = {
        id: Date.now(),
        protein: protein * amount,
        calories: calories * amount,
        name: name,
        displayName: name || `Food ${state.foodCounter}`,
        amount: amount,
        timestamp: new Date().toISOString()
    };

    state.foods.push(food);
    saveToStorage();

    renderFoodList();
    updateTotalsDisplay();
    closeAddFoodModal();
}

function getTotals() {
    return state.foods.reduce((acc, food) => ({
        protein: acc.protein + food.protein,
        calories: acc.calories + food.calories
    }), { protein: 0, calories: 0 });
}

function updateTotalsDisplay() {
    const totals = getTotals();
    const hasGoals = state.dailyGoals.protein !== null && state.dailyGoals.calories !== null;

    if (state.showingDifference && hasGoals) {
        const proteinDiff = totals.protein - state.dailyGoals.protein;
        const caloriesDiff = totals.calories - state.dailyGoals.calories;

        const proteinClass = proteinDiff >= 0 ? 'diff-surplus' : 'diff-deficit';
        const caloriesClass = caloriesDiff >= 0 ? 'diff-surplus' : 'diff-deficit';

        const proteinSign = proteinDiff >= 0 ? '+' : '';
        const caloriesSign = caloriesDiff >= 0 ? '+' : '';

        elements.totalsText.innerHTML = `
            <span class="protein-diff ${proteinClass}">${proteinSign}${Math.round(proteinDiff)}g</span>, 
            <span class="calories-diff ${caloriesClass}">${caloriesSign}${Math.round(caloriesDiff)} cals</span>
        `;
        elements.totalsText.classList.add('showing-difference');
    } else {
        elements.totalsText.textContent = `${Math.round(totals.protein)}g, ${Math.round(totals.calories)} cals`;
        elements.totalsText.classList.remove('showing-difference');
    }
}

function toggleDifferenceView() {
    const hasGoals = state.dailyGoals.protein !== null && state.dailyGoals.calories !== null;

    if (hasGoals) {
        state.showingDifference = !state.showingDifference;
        updateTotalsDisplay();
    }
}

function renderFoodList() {
    elements.foodList.innerHTML = '';

    state.foods.forEach((food, index) => {
        const item = document.createElement('div');
        item.className = 'food-item';
        item.innerHTML = `
            <div class="food-info">
                <span class="food-name">${escapeHtml(food.displayName)}:</span> 
                ${Math.round(food.protein)}g, ${Math.round(food.calories)} cals
            </div>
            <button class="delete-btn" aria-label="Delete food" data-index="${index}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
            </button>
        `;

        item.querySelector('.delete-btn').addEventListener('click', () => removeFood(index));

        elements.foodList.appendChild(item);
    });
}

function removeFood(index) {
    state.foods.splice(index, 1);
    saveToStorage();
    renderFoodList();
    updateTotalsDisplay();
}

// =============================================
// Settings & Goals
// =============================================

function handleGoalChange() {
    const protein = parseFloat(elements.goalProteinInput.value);
    const calories = parseFloat(elements.goalCaloriesInput.value);

    state.dailyGoals.protein = isNaN(protein) ? null : protein;
    state.dailyGoals.calories = isNaN(calories) ? null : calories;

    saveToStorage();
    updateTotalsDisplay();
}

function handleResetAndSave() {
    if (state.foods.length === 0) {
        return;
    }

    const totals = getTotals();
    const today = formatDate(new Date());

    const historyEntry = {
        date: today,
        totalProtein: totals.protein,
        totalCalories: totals.calories,
        foods: [...state.foods]
    };

    // Add to beginning of history (newest first)
    state.history.unshift(historyEntry);

    // Reset current data
    state.foods = [];
    state.foodCounter = 0;
    state.showingDifference = false;

    saveToStorage();
    renderFoodList();
    updateTotalsDisplay();
    renderHistory();
}

function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}-${day}-${year}`;
}

function renderHistory() {
    elements.historyContainer.innerHTML = '';

    state.history.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-header" data-index="${index}">
                <span class="history-date">${entry.date}</span>
                <svg class="history-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </div>
            <div class="history-details">
                <div class="history-details-inner">
                    <div class="history-totals">${Math.round(entry.totalProtein)}g, ${Math.round(entry.totalCalories)} cals</div>
                    ${entry.foods.map(food => `
                        <div class="history-food">${escapeHtml(food.displayName)}: ${Math.round(food.protein)}g, ${Math.round(food.calories)} cals</div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add click handler for expansion
        item.querySelector('.history-header').addEventListener('click', () => {
            item.classList.toggle('expanded');
        });

        elements.historyContainer.appendChild(item);
    });
}

// =============================================
// AI Mode Handlers
// =============================================

async function handleAISend() {
    const prompt = elements.aiPromptInput.value.trim();
    const apiKey = elements.apiKeyInput.value.trim();

    if (!apiKey) {
        alert('Please enter a Gemini API Key');
        return;
    }

    if (!prompt) {
        alert('Please describe what you ate');
        return;
    }

    elements.btnAISend.disabled = true;
    elements.btnAISend.textContent = 'Processing...';

    const systemPrompt = `You are a calorie and protein tracking assistant. 
    Analyze the user's input and extract food items with their protein (in grams) and calories.
    Respond ONLY with a strict JSON array of objects, like this:
    [{"name": "Food Name", "protein": 10, "calories": 200}, ...]
    CRITICAL: For items like "chicken breast", "steak", or "fruit", use the standard size for ONE WHOLE UNIT rather than a 100g default, unless specified.
    Always prioritize "per unit" or "per serving" estimates.
    If amounts are specified (e.g. "2 eggs"), calculate the total for that amount.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Input: ${prompt}` }] }]
            })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error.message || 'API Error');

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error('Malformed response from AI.');

        let jsonString = textResponse;
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonString = jsonMatch[0];

        state.pendingAIItems = JSON.parse(jsonString);
        renderAIPreview();
        showAIResultPanel();
    } catch (e) {
        alert('AI Error: ' + e.message);
    } finally {
        elements.btnAISend.disabled = false;
        elements.btnAISend.textContent = 'Send';
    }
}

function renderAIPreview() {
    elements.aiPreviewList.innerHTML = '';
    state.pendingAIItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'ai-preview-item';
        div.innerHTML = `<strong>${escapeHtml(item.name)}:</strong> ${item.protein}g, ${item.calories} cals`;
        elements.aiPreviewList.appendChild(div);
    });
}

function handleAIConfirm() {
    state.pendingAIItems.forEach(item => {
        const food = {
            id: Date.now() + Math.random(),
            protein: item.protein,
            calories: item.calories,
            name: item.name,
            displayName: item.name,
            amount: 1,
            timestamp: new Date().toISOString()
        };
        state.foods.push(food);
    });

    saveToStorage();
    renderFoodList();
    updateTotalsDisplay();
    closeAIModal();
}

function showAIResultPanel() {
    elements.aiPanelInput.classList.add('hidden');
    elements.aiPanelResult.classList.remove('hidden');
}

function showAIInputPanel() {
    elements.aiPanelResult.classList.add('hidden');
    elements.aiPanelInput.classList.remove('hidden');
}

function openAIModal() {
    elements.aiModal.classList.add('active');
    showAIInputPanel();
}

function closeAIModal() {
    elements.aiModal.classList.remove('active');
}

// =============================================
// Utility Functions
// =============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================
// Initialize App
// =============================================

document.addEventListener('DOMContentLoaded', initApp);
