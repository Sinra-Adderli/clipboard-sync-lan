const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const notifier = require('node-notifier');

const Config = require('./src/config');
const Encryption = require('./src/encryption');
const ClipboardHistory = require('./src/clipboardHistory');
const ClipboardWatcher = require('./src/clipboardWatcher');
const UDPDiscovery = require('./src/udpDiscovery');
const TCPServer = require('./src/tcpServer');
const TCPClient = require('./src/tcpClient');

/**
 * Основной класс приложения
 * Управляет жизненным циклом Electron приложения и координирует все модули
 */
class ClipboardSyncApp {
	constructor() {
		this.config = new Config();
		this.encryption = new Encryption(this.config);
		this.clipboardHistory = new ClipboardHistory(this.config);
		this.clipboardWatcher = new ClipboardWatcher(this.config, this.clipboardHistory);
		this.udpDiscovery = new UDPDiscovery(this.config);
		this.tcpServer = new TCPServer(this.config, this.encryption);
		this.tcpClient = new TCPClient(this.config, this.encryption);
		
		this.mainWindow = null;
		this.tray = null;
		this.mode = null; // 'server' или 'client'
		this.isRunning = false;
		this.password = this.config.DEFAULT_PASSWORD;
		this.autoDiscovery = true;
		this.preferences = { lastMode: null, lastPassword: '', lastServerHost: '' };
		this.prefsPath = path.join(app.getPath('userData'), 'preferences.json');
	}

	loadPreferences() {
		try {
			if (fs.existsSync(this.prefsPath)) {
				const raw = fs.readFileSync(this.prefsPath, 'utf-8');
				const parsed = JSON.parse(raw);
				this.preferences = Object.assign({ lastMode: null, lastPassword: '', lastServerHost: '' }, parsed);
			}
		} catch (error) {
			console.warn('Failed to load preferences:', error);
		}
	}

	savePreferences(patch) {
		try {
			this.preferences = Object.assign({}, this.preferences, patch || {});
			fs.writeFileSync(this.prefsPath, JSON.stringify(this.preferences, null, 2), 'utf-8');
			this.sendToRenderer('preferences-updated', this.preferences);
		} catch (error) {
			console.warn('Failed to save preferences:', error);
		}
	}
	
	init() {
		// Настраиваем обработчики событий Electron приложения
		app.whenReady().then(() => {
		this.createWindow();
		this.createTray();
		this.setupIPC();
		this.loadPreferences();
		
		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				this.createWindow();
			} else if (this.mainWindow && !this.mainWindow.isDestroyed()) {
				// Показываем окно при клике на иконку в Dock
				this.mainWindow.show();
				this.mainWindow.focus();
			}
		});
		});
		
		app.on('window-all-closed', () => {
			if (process.platform !== 'darwin') {
				this.cleanup();
				app.quit();
			}
		});
		
		app.on('before-quit', () => {
			this.cleanup();
		});
	}
	
	/**
	 * Создает главное окно
	 */
	createWindow() {
		// Загружаем иконку для окна (переподбор по платформе)
		let windowIcon = null;
		try {
			let iconPath;
			if (process.platform === 'win32') {
				iconPath = path.join(__dirname, 'assets', 'icon.ico');
			} else if (process.platform === 'darwin') {
				iconPath = path.join(__dirname, 'assets', 'icon.icns');
			} else {
				// linux и прочие — предпочтительно PNG, если появится в assets
				iconPath = path.join(__dirname, 'assets', 'icon.png');
			}
			const candidate = nativeImage.createFromPath(iconPath);
			if (!candidate.isEmpty()) {
				windowIcon = candidate;
			}
		} catch (error) {
			console.warn('Failed to load window icon:', error);
		}

		this.mainWindow = new BrowserWindow({
			width: this.config.WINDOW_WIDTH,
			height: this.config.WINDOW_HEIGHT,
			minWidth: this.config.WINDOW_WIDTH,
			minHeight: this.config.WINDOW_HEIGHT,
			maxWidth: this.config.WINDOW_WIDTH,
			maxHeight: this.config.WINDOW_HEIGHT,
			resizable: this.config.WINDOW_RESIZABLE,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				devTools: false
			},
			title: 'ClipboardSync LAN',
			icon: windowIcon,
			show: false,
			frame: this.config.WINDOW_FRAME,
			titleBarStyle: this.config.WINDOW_TITLE_BAR_STYLE,
			menuBarVisible: this.config.WINDOW_MENU_BAR_VISIBLE,
			autoHideMenuBar: this.config.WINDOW_MENU_BAR_VISIBLE
		});
		
		this.mainWindow.loadFile('renderer/index.html');
		
		// Показываем окно после загрузки
		this.mainWindow.once('ready-to-show', () => {
			this.mainWindow.show();
			// Отправляем сохраненные предпочтения в рендерер
			this.sendToRenderer('preferences-updated', this.preferences);
		});
		
		this.mainWindow.on('close', (event) => {
			if (this.isRunning) {
				event.preventDefault();
				this.mainWindow.hide();
			}
		});
	}
	
	/**
	 * Переключает стиль панели заголовка для отладки
	 */
	toggleTitleBarStyle() {
		const styles = ['default', 'hiddenInset', 'hidden'];
		const currentIndex = styles.indexOf(this.config.WINDOW_TITLE_BAR_STYLE);
		const nextIndex = (currentIndex + 1) % styles.length;
		
		this.config.WINDOW_TITLE_BAR_STYLE = styles[nextIndex];
		
		console.log(`Title bar style changed to: ${this.config.WINDOW_TITLE_BAR_STYLE}`);
		
		// Показываем уведомление
		notifier.notify({
			title: 'Debug Mode',
			message: `Title bar style: ${this.config.WINDOW_TITLE_BAR_STYLE}`,
			sound: false
		});
	}
	
	/**
	 * Создает иконку системного трея
	 */
	createTray() {
		// Создаем иконку трея из файла (переподбор по платформе)
		let trayImage;
		try {
			let trayIconPath;
			if (process.platform === 'win32') {
				trayIconPath = path.join(__dirname, 'assets', 'icon.ico');
				trayImage = nativeImage.createFromPath(trayIconPath);
			} else if (process.platform === 'darwin') {
				const icnsPath = path.join(__dirname, 'assets', 'icon.icns');
				let img = nativeImage.createFromPath(icnsPath);
				if (!img.isEmpty()) {
					img = img.resize({ width: 18, height: 18 });
					img.setTemplateImage(true);
					trayImage = img;
				}
				// Если не удалось — попробуем PNG, если добавите его в assets
				if (!trayImage || trayImage.isEmpty()) {
					const pngPath = path.join(__dirname, 'assets', 'icon.png');
					const png = nativeImage.createFromPath(pngPath);
					if (!png.isEmpty()) {
						png.setTemplateImage(true);
						trayImage = png.resize({ width: 18, height: 18 });
					}
				}
			} else {
				// Linux и прочие — PNG
				const pngPath = path.join(__dirname, 'assets', 'icon.png');
				trayImage = nativeImage.createFromPath(pngPath);
			}

			if (!trayImage || trayImage.isEmpty()) {
				// Фоллбек примитивная иконка
				trayImage = nativeImage.createFromDataURL(
					'data:image/svg+xml;utf8,' +
					encodeURIComponent(
						'<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">\n' +
						'<rect width="16" height="16" fill="#4CAF50"/>\n' +
						'<text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-family="Arial">C</text>\n' +
						'</svg>'
					)
				);
			}
		} catch (error) {
			console.warn('Failed to load tray icon:', error);
			trayImage = nativeImage.createFromDataURL(
				'data:image/svg+xml;utf8,' +
				encodeURIComponent(
					'<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">\n' +
					'<rect width="16" height="16" fill="#4CAF50"/>\n' +
					'<text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-family="Arial">C</text>\n' +
					'</svg>'
				)
			);
		}

		this.tray = new Tray(trayImage);
		
		this.updateTrayMenu();
		
		// Поведение клика по трею по платформам
		if (process.platform === 'darwin') {
			// На macOS по левому клику открываем только контекстное меню
			this.tray.setIgnoreDoubleClickEvents(true);
			this.tray.on('click', () => {
				this.tray.popUpContextMenu();
			});
		} else {
			// На Windows/Linux левый клик — показать/скрыть окно
			this.tray.on('click', () => {
				if (this.mainWindow) {
					if (this.mainWindow.isVisible()) {
						this.mainWindow.hide();
					} else {
						this.mainWindow.show();
					}
				}
			});
			// Правый клик — контекстное меню
			this.tray.on('right-click', () => {
				this.tray.popUpContextMenu();
			});
		}
	}
	
	/**
	 * Обновляет меню трея
	 */
	updateTrayMenu() {
		const contextMenu = Menu.buildFromTemplate([
			{
				label: 'Show Window',
				click: () => {
					if (!this.mainWindow || this.mainWindow.isDestroyed()) {
						this.createWindow();
					} else {
						this.mainWindow.show();
						this.mainWindow.focus();
					}
				}
			},
			{ type: 'separator' },
			{
				label: 'Quit',
				click: () => {
					this.cleanup();
					app.quit();
				}
			}
		]);
		
		this.tray.setContextMenu(contextMenu);
		this.tray.setToolTip(`ClipboardSync - ${this.isRunning ? 'Running' : 'Stopped'}`);
	}
	
	/**
	 * Настраивает IPC обработчики для связи с рендерером
	 */
	setupIPC() {
		// Start sync
		ipcMain.handle('start-sync', async (event, options) => {
			return this.startSync(options);
		});
		
		// Stop sync
		ipcMain.handle('stop-sync', async () => {
			return this.stopSync();
		});
		
		// Get status
		ipcMain.handle('get-status', async () => {
			return this.getStatus();
		});
		
		// Get history
		ipcMain.handle('get-history', async () => {
			return this.clipboardHistory.getAll();
		});
		
		// Copy from history
		ipcMain.handle('copy-from-history', async (event, id) => {
			const entry = this.clipboardHistory.getById(id);
			if (entry) {
				await this.clipboardWatcher.writeClipboard(entry.content);
				return true;
			}
			return false;
		});
		
		// Clear history
		ipcMain.handle('clear-history', async () => {
			this.clipboardHistory.clear();
			return true;
		});
		
		// Set password
		ipcMain.handle('set-password', async (event, password) => {
			this.password = password;
			return true;
		});
		
		// Toggle auto-discovery
		ipcMain.handle('toggle-auto-discovery', async (event, enabled) => {
			this.autoDiscovery = enabled;
			return true;
		});
		
		// Set auto-launch
		ipcMain.handle('set-auto-launch', async (event, enabled) => {
			app.setLoginItemSettings({
				openAtLogin: enabled,
				openAsHidden: false
			});
			return true;
		});

		// Get auto-launch state
		ipcMain.handle('get-auto-launch', async () => {
			const settings = app.getLoginItemSettings();
			return settings.openAtLogin === true;
		});

		// Preferences: get
		ipcMain.handle('get-preferences', async () => {
			return this.preferences;
		});

		// Preferences: save (optional external caller)
		ipcMain.handle('save-preferences', async (event, patch) => {
			this.savePreferences(patch || {});
			return true;
		});
		
		// Get discovered servers
		ipcMain.handle('get-discovered-servers', async () => {
			return this.udpDiscovery.getDiscoveredServers();
		});
		
		ipcMain.handle('reload-window', async () => {
			this.mainWindow.reload();
			return true;
		});
		
		ipcMain.handle('toggle-title-bar', async () => {
			this.toggleTitleBarStyle();
			return true;
		});
		
		ipcMain.handle('toggle-fullscreen', async () => {
			this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
			return true;
		});
	}
	
	/**
	 * Запускает синхронизацию
	 * @param {Object} options - Параметры запуска
	 */
	async startSync(options) {
		if (this.isRunning) {
			return { success: false, error: 'Already running' };
		}
		
		try {
			this.mode = options.mode;
			this.password = options.password || this.config.DEFAULT_PASSWORD;
			
			if (this.mode === this.config.MODE.SERVER) {
				await this.startServerMode();
			} else if (this.mode === this.config.MODE.CLIENT) {
				await this.startClientMode(options.serverHost);
			} else {
				throw new Error('Invalid mode');
			}
			
			this.isRunning = true;
			this.updateTrayMenu();
			this.sendToRenderer('status-changed', this.getStatus());
			// Сохраняем предпочтения последнего запуска
			this.savePreferences({
				lastMode: this.mode,
				lastPassword: this.password,
				lastServerHost: options.serverHost || ''
			});
			
			return { success: true };
		} catch (error) {
			console.error('Failed to start sync:', error);
			return { success: false, error: error.message };
		}
	}
	
	/**
	 * Запускает режим сервера
	 */
	async startServerMode() {
		// Запускаем TCP сервер
		this.tcpServer.start(
			this.password,
			(clientId, message) => this.handleServerMessage(clientId, message),
			(clientId) => this.handleClientConnected(clientId),
			(clientId) => this.handleClientDisconnected(clientId)
		);
		
		// Запускаем UDP обнаружение (режим сервера)
		this.udpDiscovery.start(true);
		
		// Запускаем отслеживание буфера обмена
		await this.clipboardWatcher.start((entry) => this.handleClipboardChange(entry));
		
		console.log('Server mode started');
	}
	
	/**
	 * Запускает режим клиента
	 * @param {string} serverHost - Хост сервера (опционально, автообнаружение если не указан)
	 */
	async startClientMode(serverHost) {
		if (serverHost) {
		// Прямое подключение
		this.connectToServer(serverHost, this.config.TCP_PORT);
		} else if (this.autoDiscovery) {
		// Автообнаружение
		this.udpDiscovery.start(false, (serverInfo) => {
			console.log('Server discovered:', serverInfo);
			this.sendToRenderer('server-discovered', serverInfo);
			
			// Автоподключение к первому обнаруженному серверу
			if (!this.tcpClient.isConnected()) {
				this.connectToServer(serverInfo.ip, serverInfo.port);
			}
		});
		} else {
			throw new Error('Server host required when auto-discovery is disabled');
		}
		
		// Запускаем отслеживание буфера обмена
		await this.clipboardWatcher.start((entry) => this.handleClipboardChange(entry));
		
		console.log('Client mode started');
	}
	
	/**
	 * Подключается к серверу
	 * @param {string} host - Хост сервера
	 * @param {number} port - Порт сервера
	 */
	connectToServer(host, port) {
		this.tcpClient.connect(
			host,
			port,
			this.password,
			(message) => this.handleClientMessage(message),
			() => this.handleConnected(),
			() => this.handleDisconnected()
		);
	}
	
	/**
	 * Останавливает синхронизацию
	 */
	stopSync() {
		if (!this.isRunning) {
			return { success: false, error: 'Not running' };
		}
		
		try {
			// Останавливаем отслеживание буфера обмена
			this.clipboardWatcher.stop();
			
			// Останавливаем UDP обнаружение
			this.udpDiscovery.stop();
			
			// Останавливаем TCP сервер/клиент
			if (this.mode === this.config.MODE.SERVER) {
				this.tcpServer.stop();
			} else {
				this.tcpClient.disconnect();
			}
			
			this.isRunning = false;
			this.mode = null;
			this.updateTrayMenu();
			this.sendToRenderer('status-changed', this.getStatus());
			
			return { success: true };
		} catch (error) {
			console.error('Failed to stop sync:', error);
			return { success: false, error: error.message };
		}
	}
	
	/**
	 * Обрабатывает изменение буфера обмена
	 * @param {Object} entry - Запись буфера обмена
	 */
	async handleClipboardChange(entry) {
		console.log('Clipboard changed:', entry.type);
		
		// Отправляем в рендерер
		this.sendToRenderer('clipboard-changed', entry);
		
		// Отправляем на другие устройства
		if (entry.type === 'text') {
			const message = {
				type: this.config.MESSAGE_TYPE.CLIPBOARD_TEXT,
				content: entry.content,
				source: entry.source,
				timestamp: entry.timestamp
			};
			
			if (this.mode === this.config.MODE.SERVER) {
				this.tcpServer.broadcast(message);
			} else if (this.mode === this.config.MODE.CLIENT && this.tcpClient.isConnected()) {
				this.tcpClient.sendMessage(message);
			}
		} else if (entry.type === 'image') {
			// Отправляем изображение
			try {
				// Проверяем размер
				if (entry.imageData.size > this.config.MAX_FILE_SIZE) {
					console.warn(`Image too large: ${entry.imageData.size} bytes`);
					return;
				}
				
				const message = {
					type: this.config.MESSAGE_TYPE.CLIPBOARD_IMAGE,
					imageData: {
						content: entry.content,
						width: entry.imageData.width,
						height: entry.imageData.height,
						format: entry.imageData.format,
						size: entry.imageData.size
					},
					source: entry.source,
					timestamp: entry.timestamp
				};
				
				if (this.mode === this.config.MODE.SERVER) {
					this.tcpServer.broadcast(message);
				} else if (this.mode === this.config.MODE.CLIENT && this.tcpClient.isConnected()) {
					this.tcpClient.sendMessage(message);
				}
				
				console.log(`Sent image: ${entry.imageData.width}x${entry.imageData.height}, ${entry.imageData.size} bytes`);
			} catch (error) {
				console.error('Failed to send image:', error);
			}
		}
	}
	
	/**
	 * Обрабатывает сообщение от клиента (режим сервера)
	 * @param {string} clientId - Идентификатор клиента
	 * @param {Object} message - Объект сообщения
	 */
	handleServerMessage(clientId, message) {
		if (message.type === this.config.MESSAGE_TYPE.CLIPBOARD_TEXT) {
			this.handleIncomingClipboard(message);
		} else if (message.type === this.config.MESSAGE_TYPE.CLIPBOARD_IMAGE) {
			this.handleIncomingImage(message);
		}
	}
	
	/**
	 * Обрабатывает сообщение от сервера (режим клиента)
	 * @param {Object} message - Объект сообщения
	 */
	handleClientMessage(message) {
		if (message.type === this.config.MESSAGE_TYPE.CLIPBOARD_TEXT) {
			this.handleIncomingClipboard(message);
		} else if (message.type === this.config.MESSAGE_TYPE.CLIPBOARD_IMAGE) {
			this.handleIncomingImage(message);
		}
	}
	
	/**
	 * Обрабатывает входящий текстовый буфер обмена
	 * @param {Object} message - Объект сообщения
	 */
	async handleIncomingClipboard(message) {
		try {
			await this.clipboardWatcher.writeClipboard(message.content);
			
			const entry = {
				content: message.content,
				type: 'text',
				source: message.source,
				timestamp: new Date(message.timestamp)
			};
			
			this.clipboardHistory.add(entry);
			this.sendToRenderer('clipboard-received', entry);
			
			// Показываем уведомление
			notifier.notify({
				title: 'Clipboard Synced',
				message: `New clipboard from: ${message.source}`,
				sound: false
			});
		} catch (error) {
			console.error('Failed to handle incoming clipboard:', error);
		}
	}
	
	/**
	 * Обрабатывает входящее изображение
	 * @param {Object} message - Объект сообщения
	 */
	async handleIncomingImage(message) {
		try {
			// Записываем изображение в буфер обмена
			await this.clipboardWatcher.writeClipboard(message.imageData.content, 'image');
			
			// Сохраняем изображение в файл для истории
			const filePath = this.clipboardWatcher.saveImageFromBase64(message.imageData);
			
			const entry = {
				content: `[Image ${message.imageData.width}x${message.imageData.height}]`,
				type: 'image',
				source: message.source,
				timestamp: new Date(message.timestamp),
				filePath: filePath
			};
			
			this.clipboardHistory.add(entry);
			this.sendToRenderer('image-received', entry);
			
			// Показываем уведомление
			notifier.notify({
				title: 'Image Received',
				message: `Image ${message.imageData.width}x${message.imageData.height} from ${message.source}`,
				sound: false,
				actions: ['Open Image'],
				wait: true
			});
			
			notifier.on('click', () => {
				require('electron').shell.openPath(filePath);
			});
			
			console.log(`Received image: ${message.imageData.width}x${message.imageData.height}`);
		} catch (error) {
			console.error('Failed to handle incoming image:', error);
		}
	}
	
	/**
	 * Обрабатывает подключение клиента (режим сервера)
	 * @param {string} clientId - Идентификатор клиента
	 */
	handleClientConnected(clientId) {
		console.log('Client connected:', clientId);
		this.sendToRenderer('client-connected', { clientId });
		
		// Обновляем статус
		this.sendToRenderer('status-changed', this.getStatus());
		
		// Показываем уведомление
		notifier.notify({
			title: 'Client Connected',
			message: `Client ${clientId} connected`,
			sound: false
		});
	}
	
	/**
	 * Обрабатывает отключение клиента (режим сервера)
	 * @param {string} clientId - Идентификатор клиента
	 */
	handleClientDisconnected(clientId) {
		console.log('Client disconnected:', clientId);
		this.sendToRenderer('client-disconnected', { clientId });
		
		// Обновляем статус
		this.sendToRenderer('status-changed', this.getStatus());
		
		// Показываем уведомление
		notifier.notify({
			title: 'Client Disconnected',
			message: `Client ${clientId} disconnected`,
			sound: false
		});
	}
	
	/**
	 * Handle connected to server (client mode)
	 */
	handleConnected() {
		console.log('Connected to server');
		this.sendToRenderer('status-changed', this.getStatus());
		
		notifier.notify({
			title: 'Connected',
			message: 'Connected to clipboard sync server',
			sound: false
		});
	}
	
	/**
	 * Handle disconnected from server (client mode)
	 */
	handleDisconnected() {
		console.log('Disconnected from server');
		this.sendToRenderer('status-changed', this.getStatus());
		
		notifier.notify({
			title: 'Disconnected',
			message: 'Disconnected from clipboard sync server',
			sound: false
		});
	}
	
	/**
	 * Получает текущий статус
	 * @returns {Object} - Объект статуса
	 */
	getStatus() {
		let status = this.config.STATUS.DISCONNECTED;
		
		if (this.isRunning) {
			if (this.mode === this.config.MODE.SERVER) {
				status = this.tcpServer.getConnectedClients().length > 0
				? this.config.STATUS.CONNECTED
				: this.config.STATUS.WAITING;
			} else if (this.mode === this.config.MODE.CLIENT) {
				status = this.tcpClient.isConnected()
				? this.config.STATUS.CONNECTED
				: this.config.STATUS.WAITING;
			}
		}
		
		return {
			running: this.isRunning,
			mode: this.mode,
			status: status,
			connectedClients: this.mode === this.config.MODE.SERVER
				? this.tcpServer.getConnectedClients().length
				: 0,
			serverInfo: this.mode === this.config.MODE.CLIENT
				? this.tcpClient.getStatus().server
				: null
		};
	}
	
	/**
	 * Отправляет сообщение в процесс рендерера
	 * @param {string} channel - IPC канал
	 * @param {*} data - Данные для отправки
	 */
	sendToRenderer(channel, data) {
		if (this.mainWindow && !this.mainWindow.isDestroyed()) {
			this.mainWindow.webContents.send(channel, data);
		}
	}
	
	/**
	 * Очистка перед выходом
	 */
	cleanup() {
		if (this.isRunning) {
			this.stopSync();
		}
	}
}

// Создаем и инициализируем приложение
const clipboardSyncApp = new ClipboardSyncApp();
clipboardSyncApp.init();