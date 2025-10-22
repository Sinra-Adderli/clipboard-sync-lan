/**
 * Класс конфигурации для приложения Clipboard Sync
 * Управляет всеми настраиваемыми параметрами и настройками
 */
class Config {
	constructor() {
		// Настройки сети
		this.TCP_PORT = 8888;
		this.UDP_PORT = 41234;
		this.UDP_BROADCAST_INTERVAL = 5000; // 5 секунд
		this.CLIPBOARD_SYNC_INTERVAL = 1000; // 1 секунда
		
		// Протокол обнаружения устройств
		this.DISCOVERY_MESSAGE = 'CLIPBOARD_SYNC_DISCOVERY';
		this.DISCOVERY_RESPONSE_PREFIX = 'CLIPBOARD_SYNC_SERVER';
		
		// Настройки передачи файлов
		this.MAX_FILE_SIZE = 1024 * 1024; // 1 МБ
		this.TEMP_FOLDER = 'clipboard_sync_temp';
		
		// История буфера обмена
		this.HISTORY_SIZE = 10;
		
		// Шифрование
		this.ENCRYPTION_ALGORITHM = 'aes-256-cbc';
		this.KEY_LENGTH = 32; // 256 бит
		
		// Безопасность
		this.DEFAULT_PASSWORD = 'clipboard-sync-default-password';
		this.TRUSTED_DEVICES = [];
		
		// Настройки интерфейса
		this.WINDOW_WIDTH = 400;
		this.WINDOW_HEIGHT = 660;
		this.WINDOW_RESIZABLE = false;
		this.WINDOW_FRAME = true;
		this.WINDOW_TITLE_BAR_STYLE = 'default';
		this.WINDOW_MENU_BAR_VISIBLE = true;
		
		// Режимы работы приложения
		this.MODE = {
			SERVER: 'server',
			CLIENT: 'client'
		};
		
		// Статусы подключения
		this.STATUS = {
			CONNECTED: 'connected',
			WAITING: 'waiting',
			DISCONNECTED: 'disconnected'
		};
		
		// Типы сообщений
		this.MESSAGE_TYPE = {
			AUTH: 'auth',
			AUTH_SUCCESS: 'auth_success',
			AUTH_FAIL: 'auth_fail',
			CLIPBOARD_TEXT: 'clipboard_text',
			CLIPBOARD_IMAGE: 'clipboard_image',
			PING: 'ping',
			PONG: 'pong'
		};
	}
	
	/**
	 * Обновляет TCP порт
	 * @param {number} port - Новый TCP порт
	 */
	setTcpPort(port) {
		if (port < 1024 || port > 65535) {
			throw new Error('TCP port must be between 1024 and 65535');
		}
		this.TCP_PORT = port;
	}
	
	/**
	 * Обновляет UDP порт
	 * @param {number} port - Новый UDP порт
	 */
	setUdpPort(port) {
		if (port < 1024 || port > 65535) {
			throw new Error('UDP port must be between 1024 and 65535');
		}
		this.UDP_PORT = port;
	}
	
	/**
	 * Добавляет доверенное устройство в список
	 * @param {string} deviceId - Идентификатор устройства (IP или имя хоста)
	 */
	addTrustedDevice(deviceId) {
		if (!this.TRUSTED_DEVICES.includes(deviceId)) {
			this.TRUSTED_DEVICES.push(deviceId);
		}
	}
	
	/**
	 * Удаляет доверенное устройство из списка
	 * @param {string} deviceId - Идентификатор устройства
	 */
	removeTrustedDevice(deviceId) {
		const index = this.TRUSTED_DEVICES.indexOf(deviceId);
		if (index > -1) {
			this.TRUSTED_DEVICES.splice(index, 1);
		}
	}
	
	/**
	 * Проверяет, является ли устройство доверенным
	 * @param {string} deviceId - Идентификатор устройства
	 * @returns {boolean}
	 */
	isTrustedDevice(deviceId) {
	  	return this.TRUSTED_DEVICES.length === 0 || this.TRUSTED_DEVICES.includes(deviceId);
	}
}

module.exports = Config;