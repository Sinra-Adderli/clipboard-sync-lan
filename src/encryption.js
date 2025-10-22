const crypto = require('crypto');

/**
 * Класс для шифрования данных при передаче
 * Использует AES-256-CBC с случайным вектором инициализации
 */
class Encryption {
	constructor(config) {
	  	this.config = config;
	  	this.algorithm = config.ENCRYPTION_ALGORITHM;
	}
	
	/**
	 * Генерирует ключ шифрования из пароля
	 * @param {string} password - Пароль пользователя
	 * @returns {Buffer} - 32-байтный ключ шифрования
	 */
	generateKey(password) {
	  	return crypto.createHash('sha256').update(password).digest();
	}
	
	/**
	 * Шифрует текстовые данные
	 * @param {string} text - Исходный текст для шифрования
	 * @param {string} password - Пароль для шифрования
	 * @returns {string} - Зашифрованные данные в формате: iv:encryptedData
	 */
	encrypt(text, password) {
		try {
			const key = this.generateKey(password);
			const iv = crypto.randomBytes(16);
			const cipher = crypto.createCipheriv(this.algorithm, key, iv);
			
			let encrypted = cipher.update(text, 'utf8', 'hex');
			encrypted += cipher.final('hex');
			
			return iv.toString('hex') + ':' + encrypted;
		} catch (error) {
			throw new Error(`Encryption failed: ${error.message}`);
		}
	}
	
	/**
	 * Расшифровывает текстовые данные
	 * @param {string} encryptedText - Зашифрованные данные в формате: iv:encryptedData
	 * @param {string} password - Пароль для расшифровки
	 * @returns {string} - Расшифрованный исходный текст
	 */
	decrypt(encryptedText, password) {
		try {
			const parts = encryptedText.split(':');
			if (parts.length !== 2) {
				throw new Error('Invalid encrypted data format');
			}
			
			const key = this.generateKey(password);
			const iv = Buffer.from(parts[0], 'hex');
			const encrypted = Buffer.from(parts[1], 'hex');
			
			const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
			
			let decrypted = decipher.update(encrypted);
			decrypted = Buffer.concat([decrypted, decipher.final()]);
			
			return decrypted.toString('utf8');
		} catch (error) {
			throw new Error(`Decryption failed: ${error.message}`);
		}
	}
	
	/**
	 * Шифрует JSON объект
	 * @param {Object} obj - Объект для шифрования
	 * @param {string} password - Пароль для шифрования
	 * @returns {string} - Зашифрованная JSON строка
	 */
	encryptObject(obj, password) {
		const jsonStr = JSON.stringify(obj);
		return this.encrypt(jsonStr, password);
	}
	
	/**
	 * Расшифровывает JSON объект
	 * @param {string} encryptedText - Зашифрованная JSON строка
	 * @param {string} password - Пароль для расшифровки
	 * @returns {Object} - Расшифрованный объект
	 */
	decryptObject(encryptedText, password) {
		const jsonStr = this.decrypt(encryptedText, password);
		return JSON.parse(jsonStr);
	}
}

module.exports = Encryption;