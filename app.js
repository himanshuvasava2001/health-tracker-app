const STORAGE_KEY = 'vitality-health-tracker';

const defaultData = {
  '2026-11-06': {
    steps: 8420,
    water: 2.8,
    sleep: 7.5,
    calories: 2200,
    meals: [
      { name: 'Oatmeal bowl', calories: 320, time: '08:15' },
      { name: 'Chicken salad', calories: 470, time: '13:00' },
      { name: 'Protein smoothie', calories: 260, time: '18:40' }
    ],
    workouts: [
      { name: 'Morning run', duration: 28, calories: 260 },
      { name: 'Strength circuit', duration: 35, calories: 290 }
    ]
  }
};

const state = loadState();
let activeDate = getTodayISO();

const refs = {
  dayPicker: document.getElementById('dayPicker'),
  statsGrid: document.getElementById('statsGrid'),
  weeklyChart: document.getElementById('weeklyChart'),
  mealList: document.getElementById('mealList'),
  workoutList: document.getElementById('workoutList'),
  healthForm: document.getElementById('healthForm'),
  weeklyGoalStatus: document.getElementById('weeklyGoalStatus')
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
  return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getEntry(dateKey) {
  if (!state[dateKey]) {
    state[dateKey] = {
      steps: 0,
      water: 0,
      sleep: 0,
      calories: 0,
      meals: [],
      workouts: []
    };
  }
  return state[dateKey];
}

function getWeekDates() {
  const today = new Date(activeDate + 'T00:00:00');
  const week = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    week.push(date.toISOString().split('T')[0]);
  }
  return week;
}

function calcWeeklyProgress() {
  const weekDates = getWeekDates();
  const values = weekDates.map((date) => {
    const entry = getEntry(date);
    return Math.min(100, Math.round((entry.steps || 0) / 11000 * 100));
  });
  return { weekDates, values };
}

function renderStats(entry) {
  const cards = [
    {
      label: 'Steps',
      value: `${(entry.steps || 0).toLocaleString()} `,
      meta: 'Daily goal: 10k',
      icon: '👟',
      tone: 'blue'
    },
    {
      label: 'Water',
      value: `${(entry.water || 0).toFixed(1)} L`,
      meta: 'Target: 2.5L',
      icon: '💧',
      tone: 'cyan'
    },
    {
      label: 'Sleep',
      value: `${(entry.sleep || 0).toFixed(1)} hrs`,
      meta: 'Target: 8 hrs',
      icon: '😴',
      tone: 'purple'
    },
    {
      label: 'Calories',
      value: `${(entry.calories || 0).toLocaleString()}`,
      meta: 'Balanced intake',
      icon: '🔥',
      tone: 'orange'
    }
  ];

  refs.statsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <div class="stat-top">
            <div>
              <h4>${card.label}</h4>
            </div>
            <div class="stat-icon" style="background:${getTone(card.tone)}">${card.icon}</div>
          </div>
          <p class="stat-value">${card.value}</p>
          <div class="stat-meta">${card.meta}</div>
        </article>
      `
    )
    .join('');
}

function getTone(tone) {
  const tones = {
    blue: 'rgba(37,99,235,0.12)',
    cyan: 'rgba(14,165,233,0.12)',
    purple: 'rgba(168,85,247,0.12)',
    orange: 'rgba(245,158,11,0.12)'
  };
  return tones[tone] || 'rgba(37,99,235,0.12)';
}

function renderWeeklyChart() {
  const { weekDates, values } = calcWeeklyProgress();
  const max = 100;

  refs.weeklyChart.innerHTML = weekDates
    .map((date, index) => {
      const label = new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' });
      const barHeight = Math.max((values[index] / max) * 100, 8);
      return `
        <div class="chart-bar-group">
          <div class="chart-bar" style="height:${barHeight}%"></div>
          <span class="chart-label">${label}</span>
        </div>
      `;
    })
    .join('');

  const latest = values[values.length - 1];
  refs.weeklyGoalStatus.textContent = latest >= 80 ? 'On track' : 'Needs focus';
}

function renderLists(entry) {
  refs.mealList.innerHTML = (entry.meals || []).length
    ? (entry.meals || [])
        .map(
          (meal) => `
            <li class="entry-item">
              <div>
                <strong>${meal.name}</strong>
                <span>${meal.time}</span>
              </div>
              <span class="entry-badge badge-green">${meal.calories} kcal</span>
            </li>
          `
        )
        .join('')
    : '<li class="entry-item"><div><strong>No meals logged</strong><span>Add a meal to track nutrition</span></div></li>';

  refs.workoutList.innerHTML = (entry.workouts || []).length
    ? (entry.workouts || [])
        .map(
          (workout) => `
            <li class="entry-item">
              <div>
                <strong>${workout.name}</strong>
                <span>${workout.duration} min</span>
              </div>
              <span class="entry-badge badge-amber">${workout.calories} kcal</span>
            </li>
          `
        )
        .join('')
    : '<li class="entry-item"><div><strong>No workouts logged</strong><span>Add movement to improve your streak</span></div></li>';
}

function renderDashboard() {
  const entry = getEntry(activeDate);
  renderStats(entry);
  renderWeeklyChart();
  renderLists(entry);
  refs.dayPicker.value = activeDate;
}

function updateEntryFromForm(event) {
  event.preventDefault();
  const entry = getEntry(activeDate);
  entry.steps = Number(document.getElementById('stepsInput').value || 0);
  entry.water = Number(document.getElementById('waterInput').value || 0);
  entry.sleep = Number(document.getElementById('sleepInput').value || 0);
  entry.calories = Number(document.getElementById('caloriesInput').value || 0);
  saveState();
  renderDashboard();
}

function addMeal(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const entry = getEntry(activeDate);

  entry.meals = entry.meals || [];
  entry.meals.push({
    name: formData.get('name'),
    calories: Number(formData.get('calories') || 0),
    time: formData.get('time')
  });

  saveState();
  renderDashboard();
  form.reset();
  closeModal('mealModal');
}

function addWorkout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const entry = getEntry(activeDate);

  entry.workouts = entry.workouts || [];
  entry.workouts.push({
    name: formData.get('name'),
    duration: Number(formData.get('duration') || 0),
    calories: Number(formData.get('calories') || 0)
  });

  saveState();
  renderDashboard();
  form.reset();
  closeModal('workoutModal');
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function populateFormFromEntry() {
  const entry = getEntry(activeDate);
  document.getElementById('stepsInput').value = entry.steps || 0;
  document.getElementById('waterInput').value = entry.water || 0;
  document.getElementById('sleepInput').value = entry.sleep || 0;
  document.getElementById('caloriesInput').value = entry.calories || 0;
}

refs.dayPicker.addEventListener('change', (event) => {
  activeDate = event.target.value || getTodayISO();
  populateFormFromEntry();
  renderDashboard();
});

refs.healthForm.addEventListener('submit', updateEntryFromForm);
document.getElementById('mealForm').addEventListener('submit', addMeal);
document.getElementById('workoutForm').addEventListener('submit', addWorkout);

document.querySelectorAll('[data-target]').forEach((button) => {
  button.addEventListener('click', () => openModal(button.dataset.target));
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => closeModal(button.dataset.close));
});

window.addEventListener('click', (event) => {
  document.querySelectorAll('.modal').forEach((modal) => {
    if (event.target === modal) {
      closeModal(modal.id);
    }
  });
});

refs.dayPicker.value = activeDate;
populateFormFromEntry();
renderDashboard();
