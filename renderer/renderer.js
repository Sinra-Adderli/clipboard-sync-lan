const { ipcRenderer } = require('electron');

/**
 * Класс RendererApp для управления интерфейсом и IPC связью
 */
class RendererApp {
	constructor() {
		this.selectedMode = null;
		this.isRunning = false;
		this.currentLang = 'en';
		this.currentTheme = 'dark';
		this.translations = typeof translations !== 'undefined' ? translations : {};
		this.init();
	}
  
	init() {
		this.loadSettings();
		this.applyTheme();
		this.applyLanguage();
		this.setupEventListeners();
		this.setupIPCListeners();
		this.updateStatus();
		this.loadHistory();
		
		// Инициализация автостарта и пользовательских предпочтений из main
		this.initializeFromMain();
	}
	
	/**
	 * Загружает сохраненные настройки из localStorage
	 */
	loadSettings() {
		try {
		const savedLang = localStorage.getItem('app-language');
		const savedTheme = localStorage.getItem('app-theme');
		
		if (savedLang && ['en', 'ru', 'jp'].includes(savedLang)) {
			this.currentLang = savedLang;
		}
		
		if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
			this.currentTheme = savedTheme;
		}
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	}
	
	/**
	 * Сохраняет настройки в localStorage
	 */
	saveSettings() {
		try {
			localStorage.setItem('app-language', this.currentLang);
			localStorage.setItem('app-theme', this.currentTheme);
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	}
	
	/**
	 * Применяет тему оформления
	 */
	applyTheme() {
		if (this.currentTheme === 'dark') {
			document.body.classList.add('dark-theme');
			const themeBtn = document.getElementById('themeSwitcher');
			if (themeBtn) {
				themeBtn.innerHTML = '<i data-feather="sun" class="theme-icon"></i>';
				if (typeof feather !== 'undefined') feather.replace();
			}
		} else {
			document.body.classList.remove('dark-theme');
			const themeBtn = document.getElementById('themeSwitcher');
			if (themeBtn) {
				themeBtn.innerHTML = '<i data-feather="moon" class="theme-icon"></i>';
				if (typeof feather !== 'undefined') feather.replace();
			}
		}
	}
	
	/**
	 * Переключает тему оформления
	 */
	toggleTheme() {
		this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
		this.applyTheme();
		this.saveSettings();
	}
	
	/**
	 * Применяет язык интерфейса
	 */
	applyLanguage() {
		const langSelector = document.getElementById('languageSelector');
		if (langSelector) {
			langSelector.value = this.currentLang;
		}
		
		this.updateAllTranslations();
	}
	
	/**
	 * Изменяет язык интерфейса
	 */
	changeLanguage(lang) {
		if (lang && ['en', 'ru', 'jp'].includes(lang)) {
			this.currentLang = lang;
			this.updateAllTranslations();
			this.saveSettings();
		}
	}
	
	/**
	 * Обновляет все переводы в интерфейсе
	 */
	updateAllTranslations() {
		const lang = this.translations[this.currentLang] || this.translations.en;
		
		// Обновляем элементы с атрибутом data-i18n
		document.querySelectorAll('[data-i18n]').forEach(element => {
		const key = element.getAttribute('data-i18n');
			if (lang[key]) {
				element.textContent = lang[key];
			}
		});
		
		// Обновляем плейсхолдеры
		document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
		const key = element.getAttribute('data-i18n-placeholder');
			if (lang[key]) {
				element.placeholder = lang[key];
			}
		});
		
		// Обновляем иконки Feather
		if (typeof feather !== 'undefined') {
			feather.replace();
		}
		
		// Перерисовываем историю для обновления строк времени
		this.loadHistory();
	}
	
	/**
	 * Получает перевод по ключу
	 */
	t(key) {
		const lang = this.translations[this.currentLang] || this.translations.en;
		return lang[key] || key;
	}
	
	/**
	 * Настраивает обработчики событий интерфейса
	 */
	setupEventListeners() {
		// Переключатель темы
		document.getElementById('themeSwitcher').addEventListener('click', () => {
			this.toggleTheme();
		});
		
		// Выбор языка
		document.getElementById('languageSelector').addEventListener('change', (e) => {
			this.changeLanguage(e.target.value);
		});
		
		// Выбор режима
		document.getElementById('serverModeBtn').addEventListener('click', () => {
			this.selectMode('server');
		});
		
		document.getElementById('clientModeBtn').addEventListener('click', () => {
			this.selectMode('client');
		});
		
		// Кнопки запуска/остановки
		document.getElementById('startBtn').addEventListener('click', () => {
			this.startSync();
		});
		
		document.getElementById('stopBtn').addEventListener('click', () => {
			this.stopSync();
		});
		
		// Очистка истории
		document.getElementById('clearHistoryBtn').addEventListener('click', () => {
			this.clearHistory();
		});
		
		// Переключатели опций
		document.getElementById('autoDiscoveryToggle').addEventListener('change', (e) => {
			ipcRenderer.invoke('toggle-auto-discovery', e.target.checked);
		});
		
		document.getElementById('autoLaunchToggle').addEventListener('change', (e) => {
			ipcRenderer.invoke('set-auto-launch', e.target.checked);
		});
		
		// Поле ввода пароля
		document.getElementById('passwordInput').addEventListener('input', (e) => {
			ipcRenderer.invoke('set-password', e.target.value);
		});
	}
	
	/**
	 * Настраивает IPC обработчики
	 */
	setupIPCListeners() {
		// Изменение статуса
		ipcRenderer.on('status-changed', (event, status) => {
			this.updateStatusDisplay(status);
		});
		
		// Изменение буфера обмена
		ipcRenderer.on('clipboard-changed', (event, entry) => {
			this.addHistoryItem(entry);
		});
		
		// Получение буфера обмена
		ipcRenderer.on('clipboard-received', (event, entry) => {
			this.addHistoryItem(entry);
			this.showNotification(`${this.t('clipboardReceived')} ${entry.source}`);
		});
		
		// Получение файла
		ipcRenderer.on('file-received', (event, entry) => {
			this.addHistoryItem(entry);
			this.showNotification(`${this.t('fileReceived')} ${entry.source}`);
		});
		
		// Обнаружение сервера (не используется в UI, но оставлено для автоподключения)
		ipcRenderer.on('server-discovered', (event, serverInfo) => {
		// Опционально автозаполнение поля хоста сервера в режиме клиента
		if (this.selectedMode === 'client') {
			const serverHostInput = document.getElementById('serverHostInput');
			if (serverHostInput && !serverHostInput.value) {
				serverHostInput.value = serverInfo.ip;
			}
		}
		});
		
		// Подключение клиента
		ipcRenderer.on('client-connected', (event, data) => {
			this.showNotification(`${this.t('clientConnected')}: ${data.clientId}`);
		});
		
		// Отключение клиента
		ipcRenderer.on('client-disconnected', (event, data) => {
			this.showNotification(`${this.t('clientDisconnected')}: ${data.clientId}`);
		});
	}

	/**
	 * Инициализирует состояние из main-процесса (автозапуск, предпочтения)
	 */
	async initializeFromMain() {
		try {
			// Инициализация тумблера автозапуска по фактическому состоянию системы
			const autoLaunch = await ipcRenderer.invoke('get-auto-launch');
			const autoLaunchToggle = document.getElementById('autoLaunchToggle');
			if (autoLaunchToggle) autoLaunchToggle.checked = !!autoLaunch;

			// Загрузка предпочтений
			const prefs = await ipcRenderer.invoke('get-preferences');
			this.applyPreferences(prefs);
		} catch (error) {
			console.error('Failed to initialize from main:', error);
			// Выбираем режим сервера по умолчанию в случае ошибки
			this.selectMode('server');
		}
	}

	/**
	 * Применяет полученные из main предпочтения к UI
	 * @param {{lastMode:string|null,lastPassword:string,lastServerHost:string}} prefs
	 */
	applyPreferences(prefs) {
		const passwordInput = document.getElementById('passwordInput');
		const serverHostInput = document.getElementById('serverHostInput');
		
		if (passwordInput && typeof prefs?.lastPassword === 'string') {
			passwordInput.value = prefs.lastPassword;
		}
		if (serverHostInput && typeof prefs?.lastServerHost === 'string') {
			serverHostInput.value = prefs.lastServerHost;
		}
		
		if (prefs && (prefs.lastMode === 'server' || prefs.lastMode === 'client')) {
			this.selectMode(prefs.lastMode);
		} else {
			this.selectMode('server');
		}
	}
	
	/**
	 * Выбирает режим работы
	 * @param {string} mode - Режим для выбора ('server' или 'client')
	 */
	selectMode(mode) {
		this.selectedMode = mode;
		
		// Обновляем состояния кнопок
		document.getElementById('serverModeBtn').classList.toggle('active', mode === 'server');
		document.getElementById('clientModeBtn').classList.toggle('active', mode === 'client');
		
		// Обновляем иконки
		if (typeof feather !== 'undefined') feather.replace();
		
		// Показываем/скрываем поле ввода хоста сервера для режима клиента
		const serverHostGroup = document.getElementById('serverHostGroup');
		
		if (mode === 'client') {
			serverHostGroup.style.display = 'block';
		} else {
			serverHostGroup.style.display = 'none';
		}
	}
	
	/**
	 * Запускает синхронизацию
	 */
	async startSync() {
		if (!this.selectedMode) {
			alert(this.t('selectMode'));
			return;
		}
		
		const password = document.getElementById('passwordInput').value;
		const serverHost = document.getElementById('serverHostInput').value;
		
		if (!password) {
			alert(this.t('enterPassword'));
			return;
		}
		
		const options = {
			mode: this.selectedMode,
			password: password,
			serverHost: serverHost || null
		};
		
		const result = await ipcRenderer.invoke('start-sync', options);
		
		if (result.success) {
			this.isRunning = true;
			document.getElementById('startBtn').disabled = true;
			document.getElementById('stopBtn').disabled = false;
			document.getElementById('serverModeBtn').disabled = true;
			document.getElementById('clientModeBtn').disabled = true;
			this.showNotification(this.t('syncStarted'));
		} else {
			alert(`${this.t('failedToStart')}: ${result.error}`);
		}
	}
	
	/**
	 * Останавливает синхронизацию
	 */
	async stopSync() {
		const result = await ipcRenderer.invoke('stop-sync');
		
		if (result.success) {
			this.isRunning = false;
			document.getElementById('startBtn').disabled = false;
			document.getElementById('stopBtn').disabled = true;
			document.getElementById('serverModeBtn').disabled = false;
			document.getElementById('clientModeBtn').disabled = false;
			this.showNotification(this.t('syncStopped'));
			this.updateStatus();
		} else {
			alert(`${this.t('failedToStop')}: ${result.error}`);
		}
	}
	
	/**
	 * Обновляет отображение статуса
	 */
	async updateStatus() {
		const status = await ipcRenderer.invoke('get-status');
		this.updateStatusDisplay(status);
	}
	
	/**
	 * Обновляет отображение статуса с объектом статуса
	 * @param {Object} status - Объект статуса
	 */
	updateStatusDisplay(status) {
		const statusDot = document.getElementById('statusDot');
		const statusText = document.getElementById('statusText');
		
		if (!statusDot || !statusText) return;
		
		// Обновляем индикатор статуса
		statusDot.className = 'status-dot';
		if (status.status === 'connected') {
			statusDot.classList.add('connected');
			statusText.textContent = this.t('statusConnected');
		} else if (status.status === 'waiting') {
			statusDot.classList.add('waiting');
			statusText.textContent = this.t('statusWaiting');
		} else {
			statusDot.classList.add('disconnected');
			statusText.textContent = this.t('statusDisconnected');
		}
	}
	
	/**
	 * Загружает историю буфера обмена
	 */
	async loadHistory() {
		const history = await ipcRenderer.invoke('get-history');
		this.renderHistory(history);
	}
	
	/**
	 * Отображает историю буфера обмена
	 * @param {Array} history - Записи истории
	 */
	renderHistory(history) {
		const historyList = document.getElementById('historyList');
		
		if (history.length === 0) {
			historyList.innerHTML = `<p class="empty-message">${this.t('noHistory')}</p>`;
			return;
		}
		
		historyList.innerHTML = '';
		
		history.forEach(entry => {
			const item = document.createElement('div');
			item.className = 'history-item';
			item.dataset.id = entry.id;
			
			const content = entry.type === 'file'
				? `📄 ${entry.content.split(/[/\\]/).pop()}`
				: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '');
			
			item.innerHTML = `
				<div class="history-content">
				<div class="history-text">${this.escapeHtml(content)}</div>
				<div class="history-meta">
					<span class="history-source">${this.escapeHtml(entry.source)}</span>
					<span class="history-time">${this.formatTime(entry.timestamp)}</span>
				</div>
				</div>
			`;
			
			item.addEventListener('click', () => {
				this.copyFromHistory(entry.id);
			});
			
			historyList.appendChild(item);
		});
		
		// Обновляем иконки Feather в элементах истории
		if (typeof feather !== 'undefined') {
			feather.replace();
		}
	}
	
	/**
	 * Добавляет элемент в историю
	 * @param {Object} entry - Запись истории
	 */
	async addHistoryItem(entry) {
		await this.loadHistory();
	}
	
	/**
	 * Копирует из истории
	 * @param {number} id - ID записи
	 */
	async copyFromHistory(id) {
		const success = await ipcRenderer.invoke('copy-from-history', id);
		if (success) {
			this.showNotification(this.t('copiedToClipboard'));
		}
	}
	
	/**
	 * Очищает историю
	 */
	async clearHistory() {
		if (confirm(this.t('clearHistoryConfirm'))) {
			await ipcRenderer.invoke('clear-history');
			await this.loadHistory();
		}
	}
	
	
	/**
	 * Показывает уведомление
	 * @param {string} message - Сообщение уведомления
	 */
	showNotification(message) {
		// Простое отображение уведомления (можно улучшить)
		console.log('Notification:', message);
	}
	
	/**
	 * Форматирует временную метку
	 * @param {Date|string} timestamp - Временная метка
	 * @returns {string} - Отформатированное время
	 */
	formatTime(timestamp) {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = Math.floor((now - date) / 1000);
		
		if (diff < 60) {
			return this.t('justNow');
		} else if (diff < 3600) {
			const minutes = Math.floor(diff / 60);
			return `${minutes}${this.t('minutesAgo')}`;
		} else if (diff < 86400) {
			const hours = Math.floor(diff / 3600);
			return `${hours}${this.t('hoursAgo')}`;
		} else {
			return date.toLocaleDateString();
		}
	}
	
	/**
	 * Экранирует HTML
	 * @param {string} text - Текст для экранирования
	 * @returns {string} - Экранированный текст
	 */
	escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}
}

// Инициализируем приложение когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
	const app = new RendererApp();

	// Убеждаемся, что иконки Feather загружены
	if (typeof feather !== 'undefined') {
		feather.replace();
	}
});