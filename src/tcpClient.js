const net = require('net');

/**
 * Класс TCP клиента для подключения к серверу
 * Обрабатывает аутентификацию, шифрование данных и отправку сообщений
 */
class TCPClient {
	constructor(config, encryption) {
		this.config = config;
		this.encryption = encryption;
		this.socket = null;
		this.connected = false;
		this.authenticated = false;
		this.buffer = '';
		this.password = config.DEFAULT_PASSWORD;
		this.serverHost = null;
		this.serverPort = config.TCP_PORT;
		this.onMessageCallback = null;
		this.onConnectedCallback = null;
		this.onDisconnectedCallback = null;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;
		this.reconnectDelay = 3000;
	}
	
	/**
	 * Подключается к серверу
	 * @param {string} host - Имя хоста или IP сервера
	 * @param {number} port - Порт сервера
	 * @param {string} password - Пароль для аутентификации
	 * @param {Function} onMessage - Callback для входящих сообщений
	 * @param {Function} onConnected - Callback при подключении
	 * @param {Function} onDisconnected - Callback при отключении
	 */
	connect(host, port, password, onMessage, onConnected, onDisconnected) {
		this.serverHost = host;
		this.serverPort = port || this.config.TCP_PORT;
		this.password = password || this.config.DEFAULT_PASSWORD;
		this.onMessageCallback = onMessage;
		this.onConnectedCallback = onConnected;
		this.onDisconnectedCallback = onDisconnected;
		
		console.log(`Connecting to ${this.serverHost}:${this.serverPort}...`);
		
		this.socket = new net.Socket();
		
		this.socket.connect(this.serverPort, this.serverHost, () => {
			console.log('Connected to server');
			this.connected = true;
			this.reconnectAttempts = 0;
			
			// Отправляем запрос аутентификации
			this.sendAuthRequest();
		});
		
		this.socket.on('data', (data) => {
			this.handleData(data);
		});
		
		this.socket.on('error', (err) => {
			console.error('Connection error:', err);
			this.handleDisconnect();
		});
		
		this.socket.on('close', () => {
			console.log('Connection closed');
			this.handleDisconnect();
		});
	}
	
	/**
	 * Отключается от сервера
	 */
	disconnect() {
		this.reconnectAttempts = this.maxReconnectAttempts; // Предотвращаем автоматическое переподключение
		
		if (this.socket) {
			this.socket.destroy();
			this.socket = null;
		}
		
		this.connected = false;
		this.authenticated = false;
	}
	
	/**
	 * Обрабатывает отключение
	 */
	handleDisconnect() {
		const wasConnected = this.connected;
		this.connected = false;
		this.authenticated = false;
		
		if (wasConnected && this.onDisconnectedCallback) {
			this.onDisconnectedCallback();
		}
		
		// Пытаемся переподключиться
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
			
			setTimeout(() => {
				if (this.serverHost) {
					this.connect(
					this.serverHost,
					this.serverPort,
					this.password,
					this.onMessageCallback,
					this.onConnectedCallback,
					this.onDisconnectedCallback
					);
				}
			}, this.reconnectDelay);
		}
	}
	
	/**
	 * Отправляет запрос аутентификации
	 */
	sendAuthRequest() {
		this.sendMessage({
			type: this.config.MESSAGE_TYPE.AUTH,
			password: this.password
		});
	}
	
	/**
	 * Обрабатывает входящие данные
	 * @param {Buffer} data - Входящие данные
	 */
	handleData(data) {
		// Добавляем данные в буфер
		this.buffer += data.toString();
		
		// Обрабатываем полные сообщения (разделенные переносами строк)
		let newlineIndex;
		while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
			const messageStr = this.buffer.substring(0, newlineIndex);
			this.buffer = this.buffer.substring(newlineIndex + 1);
			
			if (messageStr.trim().length > 0) {
				this.processMessage(messageStr);
			}
		}
	}
	
	/**
	 * Обрабатывает полное сообщение
	 * @param {string} messageStr - Строка сообщения
	 */
	processMessage(messageStr) {
		try {
			// Расшифровываем и парсим сообщение
			const decryptedStr = this.encryption.decrypt(messageStr, this.password);
			const message = JSON.parse(decryptedStr);
			
			// Обрабатываем ответ аутентификации
			if (message.type === this.config.MESSAGE_TYPE.AUTH_SUCCESS) {
			this.authenticated = true;
			console.log('Authentication successful');
			
			if (this.onConnectedCallback) {
				this.onConnectedCallback();
			}
			} else if (message.type === this.config.MESSAGE_TYPE.AUTH_FAIL) {
				console.error('Authentication failed:', message.error);
				this.disconnect();
			} else if (message.type === this.config.MESSAGE_TYPE.PONG) {
				console.log('Received pong from server');
			} else {
				if (this.authenticated && this.onMessageCallback) {
					this.onMessageCallback(message);
				}
			}
		} catch (error) {
			console.error('Failed to process message:', error);
		}
	}
	
	/**
	 * Отправляет сообщение на сервер
	 * @param {Object} message - Объект сообщения
	 */
	sendMessage(message) {
		if (!this.socket || !this.connected) {
			console.error('Not connected to server');
			return false;
		}
		
		try {
			const messageStr = JSON.stringify(message);
			const encrypted = this.encryption.encrypt(messageStr, this.password);
			this.socket.write(encrypted + '\n');
			return true;
		} catch (error) {
			console.error('Failed to send message:', error);
			return false;
		}
	}
	
	/**
	 * Отправляет ping на сервер
	 */
	sendPing() {
	  	this.sendMessage({ type: this.config.MESSAGE_TYPE.PING });
	}
	
	/**
	 * Проверяет, подключен ли и аутентифицирован ли клиент
	 * @returns {boolean}
	 */
	isConnected() {
	  	return this.connected && this.authenticated;
	}
	
	/**
	 * Получает статус подключения
	 * @returns {Object} - Статус подключения
	 */
	getStatus() {
		return {
			connected: this.connected,
			authenticated: this.authenticated,
			server: this.serverHost ? `${this.serverHost}:${this.serverPort}` : null
		};
	}
}

module.exports = TCPClient;