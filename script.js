const MODULES = ['A', 'B', 'C', 'D'];

function normalizeSetReps(value) {
    if (value === 'max' || value === 'MAX') return 'max';
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

// Stato dell'applicazione
let data = JSON.parse(localStorage.getItem('gymTrackerData')) || {
    settimane: {
        1: { A: [], B: [], C: [], D: [] }
    }
};

let currentWeek = 1;
let currentModule = 'A';

// Elementi DOM
const currentWeekDisplay = document.getElementById('currentWeekDisplay');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const addWeekBtn = document.getElementById('addWeekBtn');
const exerciseForm = document.getElementById('exerciseForm');
const workoutList = document.getElementById('workoutList');
const moduleTabs = document.getElementById('moduleTabs');
const moduleSelect = document.getElementById('moduleSelect');
const toggleAllExercisesBtn = document.getElementById('toggleAllExercisesBtn');
const filterWeightBtn = document.getElementById('filterWeightBtn');
let weightOnlyMode = false;

function normalizeData() {
    if (!data.settimane || typeof data.settimane !== 'object') {
        data.settimane = {};
    }

    Object.keys(data.settimane).forEach((weekKey) => {
        const weekValue = data.settimane[weekKey];

        if (Array.isArray(weekValue)) {
            data.settimane[weekKey] = {
                A: weekValue,
                B: [],
                C: [],
                D: []
            };
            return;
        }

        data.settimane[weekKey] = {
            A: Array.isArray(weekValue.A) ? weekValue.A.map((exercise) => ({
                ...exercise,
                expanded: exercise.expanded !== false,
                serie: Array.isArray(exercise.serie) ? exercise.serie.map((set) => ({
                    kg: Number(set.kg) || 0,
                    reps: normalizeSetReps(set.reps)
                })) : []
            })) : [],
            B: Array.isArray(weekValue.B) ? weekValue.B.map((exercise) => ({
                ...exercise,
                expanded: exercise.expanded !== false,
                serie: Array.isArray(exercise.serie) ? exercise.serie.map((set) => ({
                    kg: Number(set.kg) || 0,
                    reps: normalizeSetReps(set.reps)
                })) : []
            })) : [],
            C: Array.isArray(weekValue.C) ? weekValue.C.map((exercise) => ({
                ...exercise,
                expanded: exercise.expanded !== false,
                serie: Array.isArray(exercise.serie) ? exercise.serie.map((set) => ({
                    kg: Number(set.kg) || 0,
                    reps: normalizeSetReps(set.reps)
                })) : []
            })) : [],
            D: Array.isArray(weekValue.D) ? weekValue.D.map((exercise) => ({
                ...exercise,
                expanded: exercise.expanded !== false,
                serie: Array.isArray(exercise.serie) ? exercise.serie.map((set) => ({
                    kg: Number(set.kg) || 0,
                    reps: normalizeSetReps(set.reps)
                })) : []
            })) : []
        };
    });
}

function getCurrentWeekData() {
    if (!data.settimane[currentWeek]) {
        data.settimane[currentWeek] = { A: [], B: [], C: [], D: [] };
    }

    return data.settimane[currentWeek];
}

function getCurrentModuleExercises() {
    const weekData = getCurrentWeekData();
    return weekData[currentModule] || [];
}

function setModule(moduleName) {
    if (!MODULES.includes(moduleName)) return;

    currentModule = moduleName;
    moduleSelect.value = currentModule;
    renderModuleTabs();
    render();
}

function renderModuleTabs() {
    moduleTabs.innerHTML = MODULES.map((module) => `
        <button
            type="button"
            class="module-tab ${module === currentModule ? 'active' : ''}"
            data-module="${module}"
        >
            Modulo ${module}
        </button>
    `).join('');

    moduleTabs.querySelectorAll('.module-tab').forEach((button) => {
        button.addEventListener('click', () => setModule(button.dataset.module));
    });
}

// Inizializzazione
function init() {
    normalizeData();
    moduleSelect.value = currentModule;
    render();
}

// Salva nel LocalStorage
function saveData() {
    localStorage.setItem('gymTrackerData', JSON.stringify(data));
}

// Renderizza l'interfaccia
function renderStats() {
    const weekData = getCurrentWeekData();
    const statsExercises = document.getElementById('statsExercises');
    const statsSets = document.getElementById('statsSets');
    const statsModules = document.getElementById('statsModules');
    const statsWeek = document.getElementById('statsWeek');

    if (!statsExercises || !statsSets || !statsModules || !statsWeek) return;

    let totalExercises = 0;
    let totalSets = 0;

    Object.values(weekData).forEach((moduleExercises) => {
        if (!Array.isArray(moduleExercises)) return;

        moduleExercises.forEach((exercise) => {
            totalExercises += 1;
            totalSets += Array.isArray(exercise.serie) ? exercise.serie.length : 0;
        });
    });

    statsExercises.textContent = totalExercises;
    statsSets.textContent = totalSets;
    statsModules.textContent = MODULES.length;
    statsWeek.textContent = currentWeek;
}

function render() {
    currentWeekDisplay.textContent = `Settimana ${currentWeek}`;
    moduleSelect.value = currentModule;
    renderModuleTabs();
    renderStats();
    workoutList.innerHTML = '';

    let exercises = getCurrentModuleExercises();
    if (weightOnlyMode) {
        exercises = exercises.filter((exercise) =>
            Array.isArray(exercise.serie) && exercise.serie.some((set) => Number(set.kg) > 0)
        );
    }

    if (exercises.length === 0) {
        workoutList.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Nessun esercizio inserito nel modulo ${currentModule}.</p>`;
        return;
    }

    exercises.forEach((ex, exIndex) => {
        const card = document.createElement('div');
        const isExpanded = ex.expanded !== false;
        card.className = `card exercise-card ${isExpanded ? 'is-open' : 'is-collapsed'}`;

        const setsHTML = ex.serie.map((set, setIndex) => `
            <div class="set-row">
                <span>Set ${setIndex + 1}</span>
                <input type="number" value="${set.kg}" step="0.5" placeholder="Kg" onchange="updateSet(${exIndex}, ${setIndex}, 'kg', this.value)">
                <span>kg</span>
                <input type="text" value="${set.reps === 'max' ? 'max' : set.reps}" placeholder="Reps" onchange="updateSet(${exIndex}, ${setIndex}, 'reps', this.value)">
                <span>reps</span>
                <button class="btn-danger" onclick="deleteSet(${exIndex}, ${setIndex})">&times;</button>
            </div>
        `).join('');

        const methodLabel = ex.method && ex.method !== 'Normale' ? `<div class="exercise-meta"><span>Metodo: ${ex.method}</span></div>` : '';

        card.innerHTML = `
            <div class="exercise-header">
                <h4>${ex.nome}</h4>
                <div class="exercise-actions">
                    <button class="exercise-toggle" type="button" onclick="toggleExercise(${exIndex})">${isExpanded ? 'Chiudi' : 'Apri'}</button>
                    <button class="btn-danger" onclick="deleteExercise(${exIndex})">Elimina</button>
                </div>
            </div>
            ${methodLabel}
            <div class="sets-list">
                ${setsHTML}
            </div>
            <button class="add-set-btn" onclick="addSet(${exIndex})">+ Aggiungi Serie</button>
        `;

        if (!isExpanded) {
            const setsList = card.querySelector('.sets-list');
            if (setsList) {
                setsList.style.display = 'none';
            }
            const addSetBtn = card.querySelector('.add-set-btn');
            if (addSetBtn) {
                addSetBtn.style.display = 'none';
            }
        }

        workoutList.appendChild(card);
    });
}

// Inserimento nuovo esercizio
exerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const moduleName = moduleSelect.value || currentModule;
    const name = document.getElementById('exerciseName').value.trim();
    const numSets = parseInt(document.getElementById('initialSets').value);
    const repsRaw = document.getElementById('initialReps').value.trim();
    const method = document.getElementById('trainingMethod').value;

    const normalizedReps = normalizeSetReps(repsRaw);
    const serie = [];
    for (let i = 0; i < numSets; i++) {
        serie.push({ kg: 0, reps: normalizedReps });
    }

    const weekData = getCurrentWeekData();
    if (!weekData[moduleName]) {
        weekData[moduleName] = [];
    }

    weekData[moduleName].push({
        nome: name,
        serie: serie,
        method,
        expanded: true
    });
    currentModule = moduleName;
    saveData();
    render();

    exerciseForm.reset();
    moduleSelect.value = currentModule;
    document.getElementById('initialSets').value = '3';
});

// Modifica una serie
function updateSet(exIndex, setIndex, field, value) {
    const currentExercises = getCurrentModuleExercises();
    if (!currentExercises[exIndex]) return;

    if (field === 'reps') {
        currentExercises[exIndex].serie[setIndex][field] = normalizeSetReps(value);
    } else {
        currentExercises[exIndex].serie[setIndex][field] = parseFloat(value) || 0;
    }

    saveData();
}

function toggleExercise(exIndex) {
    const currentExercises = getCurrentModuleExercises();
    if (!currentExercises[exIndex]) return;

    currentExercises[exIndex].expanded = !currentExercises[exIndex].expanded;
    saveData();
    render();
}

function toggleAllExercises() {
    const currentExercises = getCurrentModuleExercises();
    if (!currentExercises.length) return;

    const shouldExpand = currentExercises.some((exercise) => exercise.expanded === false);
    currentExercises.forEach((exercise) => {
        exercise.expanded = shouldExpand;
    });

    saveData();
    render();
}

function toggleWeightFilter() {
    weightOnlyMode = !weightOnlyMode;
    filterWeightBtn.textContent = weightOnlyMode ? 'Tutti' : 'Peso';
    render();
}

// Aggiungi una serie ad un esercizio esistente
function addSet(exIndex) {
    const currentExercises = getCurrentModuleExercises();
    const lastSet = currentExercises[exIndex].serie.slice(-1)[0] || { kg: 0, reps: 0 };
    currentExercises[exIndex].serie.push({ ...lastSet });
    currentExercises[exIndex].expanded = true;
    saveData();
    render();
}

// Elimina una serie
function deleteSet(exIndex, setIndex) {
    const currentExercises = getCurrentModuleExercises();
    currentExercises[exIndex].serie.splice(setIndex, 1);
    saveData();
    render();
}

// Elimina intero esercizio
function deleteExercise(exIndex) {
    const currentExercises = getCurrentModuleExercises();
    currentExercises.splice(exIndex, 1);
    saveData();
    render();
}

// Navigazione Settimane
prevWeekBtn.addEventListener('click', () => {
    if (currentWeek > 1) {
        currentWeek--;
        render();
    }
});

nextWeekBtn.addEventListener('click', () => {
    const totalWeeks = Object.keys(data.settimane).length;
    if (currentWeek < totalWeeks) {
        currentWeek++;
        render();
    }
});

moduleSelect.addEventListener('change', (event) => {
    setModule(event.target.value);
});

toggleAllExercisesBtn.addEventListener('click', toggleAllExercises);
filterWeightBtn.addEventListener('click', toggleWeightFilter);

// Aggiungi Nuova Settimana (clona la settimana precedente se esiste)
addWeekBtn.addEventListener('click', () => {
    const MAX_WEEKS = 8;
    const totalWeeks = Object.keys(data.settimane).length;

    if (totalWeeks >= MAX_WEEKS) {
        return;
    }

    const newWeekNum = totalWeeks + 1;

    const currentWeekData = data.settimane[currentWeek] || { A: [], B: [], C: [], D: [] };
    data.settimane[newWeekNum] = {
        A: JSON.parse(JSON.stringify(currentWeekData.A || [])),
        B: JSON.parse(JSON.stringify(currentWeekData.B || [])),
        C: JSON.parse(JSON.stringify(currentWeekData.C || [])),
        D: JSON.parse(JSON.stringify(currentWeekData.D || []))
    };

    currentWeek = newWeekNum;
    saveData();
    render();
});

// Avvio
init();