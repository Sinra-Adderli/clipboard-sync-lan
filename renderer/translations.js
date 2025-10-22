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
		statusConnected: '接続済み',
		statusWaiting: '待機中',
		statusDisconnected: '切断',
		
		// Выбор режима
		modeSelection: 'モード選択',
		serverMode: 'サーバーモード',
		clientMode: 'クライアントモード',
		
		// Настройки подключения
		connectionSettings: '接続設定',
		password: 'パスワード',
		passwordPlaceholder: '同期パスワードを作成',
		serverIp: 'サーバーIP（自動検出の場合は任意）',
		serverIpPlaceholder: '192.168.3.46',
		startSync: '接続',
		stopSync: '切断',
		
		// Опции
		options: 'オプション',
		autoDiscovery: '自動検出',
		fileSync: 'ファイル同期',
		autoLaunch: '起動時に自動起動',
		darkTheme: 'ダークテーマ',
		language: '言語',
		
		// Обнаруженные серверы
		discoveredServers: '検出されたサーバー',
		noServers: 'まだサーバーが検出されていません...',
		useServer: '使用',
		
		// История буфера обмена
		clipboardHistory: 'クリップボード履歴',
		clear: 'クリア',
		noHistory: 'クリップボード履歴はまだありません...',
		justNow: 'たった今',
		minutesAgo: '分前',
		hoursAgo: '時間前',
		
		// Информация о подключении
		connectionInfo: '接続情報',
		status: 'ステータス',
		mode: 'モード',
		connectedClients: '接続クライアント',
		server: 'サーバー',
		running: '実行中',
		notRunning: '停止中',
		
		// Сообщения
		selectMode: 'モードを選択してください（サーバーまたはクライアント）',
		enterPassword: 'パスワードを入力してください',
		syncStarted: '同期が開始されました',
		syncStopped: '同期が停止されました',
		failedToStart: '開始に失敗しました',
		failedToStop: '停止に失敗しました',
		copiedToClipboard: 'クリップボードにコピーされました',
		clearHistoryConfirm: 'クリップボード履歴をクリアしてもよろしいですか？',
		clipboardReceived: 'クリップボードを受信しました：',
		fileReceived: 'ファイルを受信しました：',
		clientConnected: 'クライアントが接続しました',
		clientDisconnected: 'クライアントが切断しました'
	}
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  	module.exports = translations;
}