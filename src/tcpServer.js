const net = require('net');

/**
 * Класс TCP сервера для обработки подключений клиентов
 * Управляет аутентификацией, шифрованием данных и маршрутизацией сообщений
 */
class TCPServer {
	constructor(config, encryption) {
		this.config = config;
		this.encryption = encryption;
		this.server = null;
		this.clients = new Map();
		this.password = config.DEFAULT_PASSWORD;
		this.onMessageCallback = null;
		this.onClientConnectedCallback = null;
		this.onClientDisconnectedCallback = null;
	}
	
	/**
	 * Запускает TCP сервер
	 * @param {string} password - Пароль для аутентификации
	 * @param {Function} onMessage - Callback для входящих сообщений
	 * @param {Function} onClientConnected - Callback при подключении клиента
	 * @param {Function} onClientDisconnected - Callback при отключении клиента
	 */
	start(password, onMessage, onClientConnected, onClientDisconnected) {
		this.password = password || this.config.DEFAULT_PASSWORD;
		this.onMessageCallback = onMessage;
		this.onClientConnectedCallback = onClientConnected;
		this.onClientDisconnectedCallback = onClientDisconnected;
		
		this.server = net.createServer((socket) => {
			this.handleConnection(socket);
		});
		
		this.server.on('error', (err) => {
			if (err.code === 'EADDRINUSE') {
			console.log(`Port ${this.config.TCP_PORT} is busy, trying alternative port...`);
			this.tryAlternativePort();
			} else {
			console.error('Server error:', err);
			}
		});
		
		this.server.listen(this.config.TCP_PORT, () => {
			console.log(`TCP Server listening on port ${this.config.TCP_PORT}`);
		});
	}
	
	/**
	 * Пытается найти альтернативный порт, если основной занят
	 */
	tryAlternativePort() {
		const alternativePorts = [8889, 8890, 8891, 8892, 8893];
		
		for (const port of alternativePorts) {
			const testServer = net.createServer();
			
			testServer.listen(port, () => {
				console.log(`Found free port: ${port}`);
				testServer.close();
				
				// Обновляем конфиг и перезапускаем
				this.config.TCP_PORT = port;
				this.server.listen(port, () => {
					console.log(`TCP Server listening on alternative port ${port}`);
				});
			});
			
			testServer.on('error', (err) => {
				if (err.code === 'EADDRINUSE') {
					// Пробуем следующий порт
					return;
				}
			});
			
			// Если нашли свободный порт, выходим
			if (testServer.listening) {
				break;
			}
		}
	}
	
	/**
	 * Останавливает TCP сервер
	 */
	stop() {
		// Закрываем все подключения клиентов
		this.clients.forEach((clientInfo, clientId) => {
			clientInfo.socket.destroy();
		});
		this.clients.clear();
		
		// Закрываем сервер
		if (this.server) {
			this.server.close(() => {
				console.log('TCP Server stopped');
			});
			this.server = null;
		}
	}
	
	/**
	 * Обрабатывает новое подключение клиента
	 * @param {net.Socket} socket - Сокет клиента
	 */
	handleConnection(socket) {
		const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
		console.log(`Client connected: ${clientId}`);
		
		const clientInfo = {
			socket: socket,
			authenticated: false,
			address: socket.remoteAddress,
			buffer: ''
		};
		
		this.clients.set(clientId, clientInfo);
		
		// Настраиваем обработчики событий сокета
		socket.on('data', (data) => {
			this.handleData(clientId, data);
		});
		
		socket.on('error', (err) => {
			console.error(`Client error ${clientId}:`, err);
		});
		
		socket.on('close', () => {
			console.log(`Client disconnected: ${clientId}`);
			this.clients.delete(clientId);
			
			if (this.onClientDisconnectedCallback) {
				this.onClientDisconnectedCallback(clientId);
			}
		});
	}
	
	/**
	 * Обрабатывает входящие данные от клиента
	 * @param {string} clientId - Идентификатор клиента
	 * @param {Buffer} data - Входящие данные
	 */
	handleData(clientId, data) {
		const clientInfo = this.clients.get(clientId);
		if (!clientInfo) return;
		
		// Добавляем данные в буфер
		clientInfo.buffer += data.toString();
		
		// Обрабатываем полные сообщения (разделенные переносами строк)
		let newlineIndex;
		while ((newlineIndex = clientInfo.buffer.indexOf('\n')) !== -1) {
			const messageStr = clientInfo.buffer.substring(0, newlineIndex);
			clientInfo.buffer = clientInfo.buffer.substring(newlineIndex + 1);
			
			if (messageStr.trim().length > 0) {
				this.processMessage(clientId, messageStr);
			}
		}
	}
	
	/**
	 * Обрабатывает полное сообщение
	 * @param {string} clientId - Идентификатор клиента
	 * @param {string} messageStr - Строка сообщения
	 */
	processMessage(clientId, messageStr) {
		const clientInfo = this.clients.get(clientId);
		if (!clientInfo) return;
		
		try {
			// Пытаемся расшифровать и распарсить сообщение
			const decryptedStr = this.encryption.decrypt(messageStr, this.password);
			const message = JSON.parse(decryptedStr);
			
			// Обрабатываем разные типы сообщений
			if (!clientInfo.authenticated) {
				// Первое сообщение должно быть аутентификацией
				if (message.type === this.config.MESSAGE_TYPE.AUTH) {
					this.handleAuthentication(clientId, message);
				} else {
					this.sendMessage(clientId, {
					type: this.config.MESSAGE_TYPE.AUTH_FAIL,
					error: 'Authentication required'
					});
					clientInfo.socket.destroy();
				}
			} else {
				// Обрабатываем аутентифицированное сообщение
				if (this.onMessageCallback) {
					this.onMessageCallback(clientId, message);
				}
				
				// Обрабатываем ping
				if (message.type === this.config.MESSAGE_TYPE.PING) {
					this.sendMessage(clientId, { type: this.config.MESSAGE_TYPE.PONG });
				}
			}
		} catch (error) {
			console.error(`Failed to process message from ${clientId}:`, error);
			
			if (!clientInfo.authenticated) {
			clientInfo.socket.destroy();
			}
		}
	}
	
	/**
	 * Обрабатывает аутентификацию клиента
	 * @param {string} clientId - Идентификатор клиента
	 * @param {Object} message - Сообщение аутентификации
	 */
	handleAuthentication(clientId, message) {
		const clientInfo = this.clients.get(clientId);
		if (!clientInfo) return;
		
		// Проверяем пароль
		if (message.password === this.password) {
			clientInfo.authenticated = true;
			
			// Отправляем ответ об успехе
			this.sendMessage(clientId, {
				type: this.config.MESSAGE_TYPE.AUTH_SUCCESS
			});
			
			console.log(`Client authenticated: ${clientId}`);
			
			if (this.onClientConnectedCallback) {
				this.onClientConnectedCallback(clientId);
			}
		} else {
			// Отправляем ответ об ошибке
			this.sendMessage(clientId, {
				type: this.config.MESSAGE_TYPE.AUTH_FAIL,
				error: 'Invalid password'
			});
			
			// Закрываем подключение
			setTimeout(() => {
				clientInfo.socket.destroy();
			}, 100);
		}
	}
	
	/**
	 * Отправляет сообщение конкретному клиенту
	 * @param {string} clientId - Идентификатор клиента
	 * @param {Object} message - Объект сообщения
	 */
	sendMessage(clientId, message) {
		const clientInfo = this.clients.get(clientId);
		if (!clientInfo) return;
		
		try {
			const messageStr = JSON.stringify(message);
			const encrypted = this.encryption.encrypt(messageStr, this.password);
			clientInfo.socket.write(encrypted + '\n');
		} catch (error) {
			console.error(`Failed to send message to ${clientId}:`, error);
		}
	}
	
	/**
	 * Рассылает сообщение всем аутентифицированным клиентам
	 * @param {Object} message - Объект сообщения
	 */
	broadcast(message) {
		this.clients.forEach((clientInfo, clientId) => {
			if (clientInfo.authenticated) {
				this.sendMessage(clientId, message);
			}
		});
	}
	
	/**
	 * Получает список подключенных клиентов
	 * @returns {Array} - Массив ID клиентов
	 */
	getConnectedClients() {
		return Array.from(this.clients.keys()).filter(clientId => {
			return this.clients.get(clientId).authenticated;
		});
	}
	
	/**
	 * Получает статус сервера
	 * @returns {Object} - Статус сервера
	 */
	getStatus() {
		return {
			running: this.server !== null,
			port: this.config.TCP_PORT,
			clientCount: this.getConnectedClients().length
		};
	}
}

module.exports = TCPServer;