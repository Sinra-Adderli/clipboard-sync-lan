const dgram = require('dgram');
const os = require('os');

/**
 * Класс UDP обнаружения для автоматического поиска устройств в локальной сети
 * Использует UDP broadcast для поиска и объявления серверов
 */
class UDPDiscovery {
	constructor(config) {
		this.config = config;
		this.socket = null;
		this.broadcastInterval = null;
		this.isServer = false;
		this.onServerFoundCallback = null;
		this.discoveredServers = new Map();
	}
	
	/**
	 * Запускает UDP обнаружение
	 * @param {boolean} isServer - Является ли этот экземпляр сервером
	 * @param {Function} onServerFound - Callback при обнаружении сервера
	 */
	start(isServer = false, onServerFound = null) {
		this.isServer = isServer;
		this.onServerFoundCallback = onServerFound;
		
		this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
		
		this.socket.on('error', (err) => {
			console.error('UDP socket error:', err);
			this.stop();
		});
		
		this.socket.on('message', (msg, rinfo) => {
			this.handleMessage(msg, rinfo);
		});
		
		this.socket.bind(this.config.UDP_PORT, () => {
			this.socket.setBroadcast(true);
			console.log(`UDP Discovery listening on port ${this.config.UDP_PORT}`);
			
			if (!this.isServer) {
				// Режим клиента: запускаем рассылку запросов обнаружения
				this.startBroadcasting();
			}
		});
	}
	
	/**
	 * Останавливает UDP обнаружение
	 */
	stop() {
		if (this.broadcastInterval) {
			clearInterval(this.broadcastInterval);
			this.broadcastInterval = null;
		}
		
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
		
		this.discoveredServers.clear();
	}
	
	/**
	 * Запускает рассылку сообщений обнаружения
	 */
	startBroadcasting() {
		// Отправляем первоначальный broadcast сразу
		this.sendBroadcast();
		
		// Затем отправляем периодически
		this.broadcastInterval = setInterval(() => {
			this.sendBroadcast();
		}, this.config.UDP_BROADCAST_INTERVAL);
	}
	
	/**
	 * Отправляет broadcast сообщение обнаружения
	 */
	sendBroadcast() {
		const message = Buffer.from(this.config.DISCOVERY_MESSAGE);
		const broadcastAddress = this.getBroadcastAddress();
		
		if (this.socket && broadcastAddress) {
			this.socket.send(message, this.config.UDP_PORT, broadcastAddress, (err) => {
				if (err) {
					console.error('Failed to send broadcast:', err);
				}
			});
		}
	}
	
	/**
	 * Обрабатывает входящее UDP сообщение
	 * @param {Buffer} msg - Буфер сообщения
	 * @param {Object} rinfo - Информация об удаленном узле
	 */
	handleMessage(msg, rinfo) {
		const message = msg.toString();
		
		// Проверяем, является ли это запросом обнаружения
		if (message === this.config.DISCOVERY_MESSAGE) {
			if (this.isServer) {
				// Режим сервера: отвечаем на запрос обнаружения
				this.respondToDiscovery(rinfo.address);
			}
		}
		// Проверяем, является ли это ответом обнаружения
		else if (message.startsWith(this.config.DISCOVERY_RESPONSE_PREFIX)) {
			if (!this.isServer) {
				// Режим клиента: обрабатываем ответ обнаружения сервера
				this.processServerDiscovery(message, rinfo);
			}
		}
	}
	
	/**
	 * Отвечает на запрос обнаружения (режим сервера)
	 * @param {string} clientAddress - IP адрес клиента
	 */
	respondToDiscovery(clientAddress) {
		const localIP = this.getLocalIPAddress();
		const response = `${this.config.DISCOVERY_RESPONSE_PREFIX}:${localIP}:${this.config.TCP_PORT}`;
		const message = Buffer.from(response);
		
		if (this.socket) {
			this.socket.send(message, this.config.UDP_PORT, clientAddress, (err) => {
			if (err) {
				console.error('Failed to send discovery response:', err);
			} else {
				console.log(`Sent discovery response to ${clientAddress} with port ${this.config.TCP_PORT}`);
			}
			});
		}
	}
	
	/**
	 * Обрабатывает ответ обнаружения сервера (режим клиента)
	 * @param {string} message - Сообщение ответа обнаружения
	 * @param {Object} rinfo - Информация об удаленном узле
	 */
	processServerDiscovery(message, rinfo) {
		try {
			const parts = message.split(':');
			if (parts.length >= 3) {
				const serverIP = parts[1];
				const serverPort = parseInt(parts[2], 10);
				
				// Проверяем, является ли это новым сервером или обновленной информацией
				const serverKey = `${serverIP}:${serverPort}`;
				if (!this.discoveredServers.has(serverKey)) {
					const serverInfo = {
						ip: serverIP,
						port: serverPort,
						hostname: rinfo.address,
						lastSeen: Date.now()
					};
					
					this.discoveredServers.set(serverKey, serverInfo);
					console.log(`Discovered server: ${serverIP}:${serverPort}`);
					
					// Уведомляем callback
					if (this.onServerFoundCallback) {
						this.onServerFoundCallback(serverInfo);
					}
				} else {
					// Обновляем время последнего обнаружения
					const serverInfo = this.discoveredServers.get(serverKey);
					serverInfo.lastSeen = Date.now();
				}
			}
		} catch (error) {
			console.error('Failed to process server discovery:', error);
		}
	}
	
	/**
	 * Получает локальный IP адрес
	 * @returns {string|null} - Локальный IP адрес
	 */
	getLocalIPAddress() {
		const interfaces = os.networkInterfaces();
		
		for (const interfaceName in interfaces) {
			const addresses = interfaces[interfaceName];
			for (const addr of addresses) {
				// Пропускаем внутренние и не-IPv4 адреса
				if (!addr.internal && addr.family === 'IPv4') {
					return addr.address;
				}
			}
		}
		
		return null;
	}
	
	/**
	 * Получает broadcast адрес для локальной сети
	 * @returns {string} - Broadcast адрес
	 */
	getBroadcastAddress() {
		const interfaces = os.networkInterfaces();
		
		for (const interfaceName in interfaces) {
			const addresses = interfaces[interfaceName];
			for (const addr of addresses) {
				if (!addr.internal && addr.family === 'IPv4') {
					// Вычисляем broadcast адрес
					const ip = addr.address.split('.').map(Number);
					const netmask = addr.netmask.split('.').map(Number);
					const broadcast = ip.map((octet, i) => octet | (~netmask[i] & 255));
					return broadcast.join('.');
				}
			}
		}
	  
	  	return '255.255.255.255'; // Резервный глобальный broadcast
	}
	
	/**
	 * Получает список обнаруженных серверов
	 * @returns {Array} - Массив объектов информации о серверах
	 */
	getDiscoveredServers() {
	  	return Array.from(this.discoveredServers.values());
	}
}

module.exports = UDPDiscovery;