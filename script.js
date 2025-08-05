let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let filter = 'all';
    let selectedIndex = null;

    // Donne une valeur aléatoire CSS variable pour rotation "post-it"
    function getRandomRotation() {
      return Math.random();
    }

    function formatDate(dateStr) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    function getTodayDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    function saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
      const container = document.getElementById('taskContainer');
      container.innerHTML = '';

      // Trier par date
      tasks.sort((a, b) => a.date.localeCompare(b.date));

      // Grouper par date en respectant filtre
      const tasksByDate = {};
      tasks.forEach((task, idx) => {
        if (filter === 'active' && task.completed) return;
        if (filter === 'completed' && !task.completed) return;
        if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
        tasksByDate[task.date].push({ ...task, index: idx });
      });

      for (const date in tasksByDate) {
        const dateSection = document.createElement('div');
        dateSection.className = 'date-section';
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.textContent = formatDate(date);
        dateSection.appendChild(dateHeader);

        const ul = document.createElement('ul');
        ul.className = 'task-list';

        tasksByDate[date].forEach(task => {
          const li = document.createElement('li');
          li.className = 'task-item';
          if (task.completed) li.classList.add('completed');
          li.style.setProperty('--rand', getRandomRotation());
          li.setAttribute('data-index', task.index);

          li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.index})" />
            <span id="task-text-${task.index}">${escapeHtml(task.text)}</span>
            <input id="edit-input-${task.index}" class="edit-input" type="text" value="${escapeHtml(task.text)}" style="display:none;" />
            <button onclick="editTask(${task.index})">✏️ Modifier</button>
            <button onclick="saveEdit(${task.index})" id="save-btn-${task.index}" style="display:none;">💾 Sauvegarder</button>
            <button class="delete-btn" onclick="deleteTask(${task.index})">Supprimer</button>
          `;

          ul.appendChild(li);
        });

        dateSection.appendChild(ul);
        container.appendChild(dateSection);
      }

      updateFilterButtons();
    }

    // Échapper le texte pour éviter problème HTML
    function escapeHtml(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function addTask() {
      const taskInput = document.getElementById('taskInput');
      const taskDate = document.getElementById('taskDate');
      const text = taskInput.value.trim();
      const date = taskDate.value || getTodayDate();

      if (!text) return;

      tasks.push({ text, date, completed: false });
      saveTasks();
      renderTasks();
      taskInput.value = '';
      taskDate.value = '';
    }

    function toggleTask(index) {
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks();
    }

    function deleteTask(index) {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    }

    // Modifier tâche : affiche champ input + bouton sauvegarder, cache texte + bouton modifier
    function editTask(index) {
      document.getElementById(`task-text-${index}`).style.display = 'none';
      document.getElementById(`edit-input-${index}`).style.display = 'inline-block';
      document.getElementById(`save-btn-${index}`).style.display = 'inline-block';

      // cache le bouton modifier
      const btns = document.querySelectorAll(`li[data-index="${index}"] button`);
      btns.forEach(btn => {
        if (btn.textContent.trim() === '✏️ Modifier') btn.style.display = 'none';
      });
    }

    function saveEdit(index) {
      const input = document.getElementById(`edit-input-${index}`);
      const newValue = input.value.trim();
      if (newValue) {
        tasks[index].text = newValue;
        saveTasks();
        renderTasks();
      } else {
        alert('Le texte de la tâche ne peut pas être vide.');
      }
    }

    // Filtrer
    function setFilter(f) {
      filter = f;
      renderTasks();
    }

    // Met à jour visuel des boutons filtre
    function updateFilterButtons() {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      if (filter === 'all') document.getElementById('filter-all').classList.add('active');
      else if (filter === 'active') document.getElementById('filter-active').classList.add('active');
      else if (filter === 'completed') document.getElementById('filter-completed').classList.add('active');
    }

    // Supprimer toutes les tâches avec alerte spéciale si toutes sont actives ou terminées
    function deleteAllTasks() {
      if (tasks.length === 0) return;

      const allCompleted = tasks.every(t => t.completed);
      const allActive = tasks.every(t => !t.completed);

      if (allCompleted) {
        if (!confirm("Attention : Vous supprimez toutes les tâches terminées. Confirmez ?")) return;
      } else if (allActive) {
        if (!confirm("Attention : Vous supprimez toutes les tâches actives. Confirmez ?")) return;
      } else {
        if (!confirm("Confirmez la suppression de toutes les tâches ?")) return;
      }

      tasks = [];
      saveTasks();
      renderTasks();
    }

    // Mode sombre toggle
    const darkBtn = document.getElementById('darkModeToggle');
    darkBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      if(document.body.classList.contains('dark')) {
        darkBtn.textContent = 'Mode clair';
      } else {
        darkBtn.textContent = 'Mode sombre';
      }
    });

    // Ajout tâche au Enter sur input texte
    document.getElementById('taskInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        addTask();
      }
    });

    // Supprimer tâche au Delete si focus sur input texte d'édition
    document.addEventListener('keydown', e => {
      if (e.key === 'Delete') {
        // Si un input d'édition est visible et focusé, supprimer la tâche correspondante
        const inputs = document.querySelectorAll('.edit-input');
        inputs.forEach(input => {
          if (document.activeElement === input) {
            const idx = parseInt(input.id.replace('edit-input-', ''), 10);
            if (!isNaN(idx)) {
              deleteTask(idx);
            }
          }
        });
      }
    });

    renderTasks();