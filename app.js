const taskInput = document.getElementById('new-task');
const addTaskBtn = document.getElementById('add-task');
const taskList = document.getElementById('task-list');
const notesArea = document.getElementById('notes-area');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks.forEach(addTaskToDOM);
}

function saveTasks() {
  const tasks = [];
  taskList.querySelectorAll('li').forEach(li => {
    tasks.push({
      text: li.querySelector('span').textContent,
      done: li.classList.contains('done')
    });
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTaskToDOM(task) {
  const li = document.createElement('li');
  if (task.done) li.classList.add('done');
  const span = document.createElement('span');
  span.textContent = task.text;
  li.appendChild(span);
  const controls = document.createElement('div');
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '✓';
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '✕';
  controls.appendChild(toggleBtn);
  controls.appendChild(removeBtn);
  li.appendChild(controls);

  toggleBtn.addEventListener('click', () => {
    li.classList.toggle('done');
    saveTasks();
  });
  removeBtn.addEventListener('click', () => {
    li.remove();
    saveTasks();
  });
  taskList.appendChild(li);
}

addTaskBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  if (!text) return;
  const task = { text, done: false };
  addTaskToDOM(task);
  saveTasks();
  taskInput.value = '';
});

taskInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') addTaskBtn.click();
});

loadTasks();

notesArea.value = localStorage.getItem('notes') || '';
notesArea.addEventListener('input', () => {
  localStorage.setItem('notes', notesArea.value);
});

function setTheme(theme) {
  body.classList.toggle('dark', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const newTheme = body.classList.contains('dark') ? 'light' : 'dark';
  setTheme(newTheme);
});

// Calculator functionality
const openCalcBtn = document.getElementById('open-calculator');
const calculatorSection = document.getElementById('calculator');
const calcInput = document.getElementById('calc-expression');
const calcEvaluate = document.getElementById('calc-evaluate');
const calcClose = document.getElementById('calc-close');
const calcResult = document.getElementById('calc-result');

openCalcBtn.addEventListener('click', () => {
  calculatorSection.classList.remove('hidden');
});

calcClose.addEventListener('click', () => {
  calculatorSection.classList.add('hidden');
  calcInput.value = '';
  calcResult.textContent = '';
});

calcEvaluate.addEventListener('click', () => {
  try {
    const result = Function(`"use strict";return(${calcInput.value})`)();
    calcResult.textContent = result;
  } catch (err) {
    calcResult.textContent = 'Error';
  }
});

// Latin phrases
const latinBtn = document.getElementById('latin-button');
const latinSection = document.getElementById('latin-section');
const latinOutput = document.getElementById('latin-output');
const latinPhrases = [
  'Lorem ipsum dolor sit amet',
  'Carpe diem',
  'Veni, vidi, vici',
  'Alea iacta est'
];

latinBtn.addEventListener('click', () => {
  const phrase = latinPhrases[Math.floor(Math.random() * latinPhrases.length)];
  latinSection.classList.remove('hidden');
  latinOutput.textContent = phrase;
});
