/**
 * Переводы
 * Поддерживаемые языки: EN (Английский), RU (Русский), JP (Японский)
 */
const translations = {
	en: {
		// Заголовок
		appTitle: 'ClipboardSync LAN',
		statusConnected: 'Connected',
		statusWaiting: 'Waiting',
		statusDisconnected: 'Disconnected',
		
		// Выбор режима
		modeSelection: 'Mode Selection',
		serverMode: 'Server Mode',
		clientMode: 'Client Mode',
		
		// Настройки подключения
		connectionSettings: 'Connection Settings',
		password: 'Password',
		passwordPlaceholder: 'Create sync password',
		serverIp: 'Server IP (optional for auto-discovery)',
		serverIpPlaceholder: '192.168.1.100',
		startSync: 'Connect',
		stopSync: 'Disconnect',
		
		// Опции
		options: 'Options',
		autoDiscovery: 'Auto-discovery',
		fileSync: 'File Synchronization',
		autoLaunch: 'Auto-launch at startup',
		darkTheme: 'Dark Theme',
		language: 'Language',
		
		// Обнаруженные серверы
		discoveredServers: 'Discovered Servers',
		noServers: 'No servers discovered yet...',
		useServer: 'Use',
		
		// История буфера обмена
		clipboardHistory: 'Clipboard History',
		clear: 'Clear',
		noHistory: 'No clipboard history yet...',
		justNow: 'Just now',
		minutesAgo: 'm ago',
		hoursAgo: 'h ago',
		
		// Информация о подключении
		connectionInfo: 'Connection Info',
		status: 'Status',
		mode: 'Mode',
		connectedClients: 'Connected Clients',
		server: 'Server',
		running: 'Running',
		notRunning: 'Not running',
	
		// Сообщения
		selectMode: 'Please select a mode (Server or Client)',
		enterPassword: 'Please enter a password',
		syncStarted: 'Synchronization started',
		syncStopped: 'Synchronization stopped',
		failedToStart: 'Failed to start',
		failedToStop: 'Failed to stop',
		copiedToClipboard: 'Copied to clipboard',
		clearHistoryConfirm: 'Are you sure you want to clear clipboard history?',
		clipboardReceived: 'Clipboard received from',
		fileReceived: 'File received from',
		clientConnected: 'Client connected',
		clientDisconnected: 'Client disconnected'
	},
	
	ru: {
		// Заголовок
		appTitle: 'ClipboardSync LAN',
		statusConnected: 'Подключено',
		statusWaiting: 'Ожидание',
		statusDisconnected: 'Отключено',
		
		// Выбор режима
		modeSelection: 'Выбор режима',
		serverMode: 'Режим сервера',
		clientMode: 'Режим клиента',
		
		// Настройки подключения
		connectionSettings: 'Настройки подключения',
		password: 'Пароль',
		passwordPlaceholder: 'Придумайте пароль синхронизации',
		serverIp: 'IP сервера (опционально для авто-поиска)',
		serverIpPlaceholder: '192.168.1.100',
		startSync: 'Подключиться',
		stopSync: 'Отключиться',
		
		// Опции
		options: 'Настройки',
		autoDiscovery: 'Автоматический поиск',
		fileSync: 'Синхронизация файлов',
		autoLaunch: 'Автозапуск при старте системы',
		darkTheme: 'Темная тема',
		language: 'Язык',
		
		// Обнаруженные серверы
		discoveredServers: 'Найденные серверы',
		noServers: 'Серверы еще не найдены...',
		useServer: 'Использовать',
		
		// История буфера обмена
		clipboardHistory: 'История буфера обмена',
		clear: 'Очистить',
		noHistory: 'История буфера обмена пуста...',
		justNow: 'Только что',
		minutesAgo: 'мин назад',
		hoursAgo: 'ч назад',
		
		// Информация о подключении
		connectionInfo: 'Информация о подключении',
		status: 'Статус',
		mode: 'Режим',
		connectedClients: 'Подключенные клиенты',
		server: 'Сервер',
		running: 'Работает',
		notRunning: 'Не запущено',
		
		// Сообщения
		selectMode: 'Пожалуйста, выберите режим (Сервер или Клиент)',
		enterPassword: 'Пожалуйста, введите пароль',
		syncStarted: 'Синхронизация запущена',
		syncStopped: 'Синхронизация остановлена',
		failedToStart: 'Не удалось запустить',
		failedToStop: 'Не удалось остановить',
		copiedToClipboard: 'Скопировано в буфер обмена',
		clearHistoryConfirm: 'Вы уверены, что хотите очистить историю буфера обмена?',
		clipboardReceived: 'Буфер обмена получен от',
		fileReceived: 'Файл получен от',
		clientConnected: 'Клиент подключен',
		clientDisconnected: 'Клиент отключен'
	},
  
	jp: {
		// Заголовок
		appTitle: 'ClipboardSync LAN',
		statusConnected: 'せつぞくずみ',
		statusWaiting: 'たいきちゅう',
		statusDisconnected: 'きれ',
		
		// Выбор режима
		modeSelection: 'モードせんたく',
		serverMode: 'サーバーモード',
		clientMode: 'クライアントモード',
		
		// Настройки подключения
		connectionSettings: 'せつぞくせってい',
		password: 'パスワード',
		passwordPlaceholder: 'どうきパスワードをさくせい',
		serverIp: 'サーバーIP（じどうけんしゅつのばあいはにんい）',
		serverIpPlaceholder: '192.168.3.46',
		startSync: 'せつぞく',
		stopSync: 'きれ',
		
		// Опции
		options: 'オプション',
		autoDiscovery: 'じどうけんしゅつ',
		fileSync: 'ファイルどうき',
		autoLaunch: 'きどうじにじどうきどう',
		darkTheme: 'ダークテーマ',
		language: 'げんご',
		
		// Обнаруженные серверы
		discoveredServers: 'けんしゅつされたサーバー',
		noServers: 'まだサーバーがけんしゅつされていません...',
		useServer: 'しよう',
		
		// История буфера обмена
		clipboardHistory: 'クリップボードれきし',
		clear: 'クリア',
		noHistory: 'クリップボードれきしはまだありません...',
		justNow: 'たったいま',
		minutesAgo: 'ふんまえ',
		hoursAgo: 'じかんまえ',
		
		// Информация о подключении
		connectionInfo: 'せつぞくじょうほう',
		status: 'ステータス',
		mode: 'モード',
		connectedClients: 'せつぞくクライアント',
		server: 'サーバー',
		running: 'じっこうちゅう',
		notRunning: 'ていしちゅう',
		
		// Сообщения
		selectMode: 'モードをせんたくしてください（サーバーまたはクライアント）',
		enterPassword: 'パスワードをにゅうりょくしてください',
		syncStarted: 'どうきがかいしされました',
		syncStopped: 'どうきがていしされました',
		failedToStart: 'かいしにしっぱいしました',
		failedToStop: 'ていしにしっぱいしました',
		copiedToClipboard: 'クリップボードにコピーされました',
		clearHistoryConfirm: 'クリップボードれきしをクリアしてもよろしいですか？',
		clipboardReceived: 'クリップボードをじゅしんしました：',
		fileReceived: 'ファイルをじゅしんしました：',
		clientConnected: 'クライアントがせつぞくしました',
		clientDisconnected: 'クライアントがきれました'
	}
};	

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  	module.exports = translations;
}