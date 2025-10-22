/**
 * Класс для управления историей буфера обмена
 * Хранит последние N записей буфера обмена с метаданными
 */
class ClipboardHistory {
	constructor(config) {
		this.config = config;
		this.history = [];
		this.maxSize = config.HISTORY_SIZE;
	}
	
	/**
	 * Добавляет новую запись в историю
	 * @param {Object} entry - Запись буфера обмена
	 * @param {string} entry.content - Содержимое буфера обмена
	 * @param {string} entry.type - Тип содержимого (text/file)
	 * @param {string} entry.source - Исходное устройство
	 * @param {Date} entry.timestamp - Время копирования
	 */
	add(entry) {
		// Проверяем, существует ли уже такое содержимое в истории
		const existingIndex = this.history.findIndex(
			item => item.content === entry.content && item.type === entry.type
		);
		
		if (existingIndex > -1) {
			// Удаляем существующую запись
			this.history.splice(existingIndex, 1);
		}
		
		// Добавляем запись в начало истории
		this.history.unshift({
			content: entry.content,
			type: entry.type || 'text',
			source: entry.source || 'local',
			timestamp: entry.timestamp || new Date(),
			id: Date.now() + Math.random() // Уникальный ID
		});
		
		// Обрезаем историю до максимального размера
		if (this.history.length > this.maxSize) {
			this.history = this.history.slice(0, this.maxSize);
		}
	}
	
	/**
	 * Получает все записи истории
	 * @returns {Array} - Массив записей истории
	 */
	getAll() {
		return [...this.history];
	}
	
	/**
	 * Получает конкретную запись по ID
	 * @param {number} id - ID записи
	 * @returns {Object|null} - Запись истории или null
	 */
	getById(id) {
	  	return this.history.find(entry => entry.id === id) || null;
	}
	
	/**
	 * Получает последнюю запись
	 * @returns {Object|null} - Последняя запись или null
	 */
	getLatest() {
	  	return this.history.length > 0 ? this.history[0] : null;
	}
	
	/**
	 * Очищает всю историю
	 */
	clear() {
	  this.history = [];
	}
	
	/**
	 * Удаляет конкретную запись по ID
	 * @param {number} id - ID записи
	 */
	remove(id) {
		const index = this.history.findIndex(entry => entry.id === id);
		if (index > -1) {
			this.history.splice(index, 1);
		}
	}
	
	/**
	 * Получает размер истории
	 * @returns {number} - Количество записей
	 */
	size() {
	  	return this.history.length;
	}
	
	/**
	 * Экспортирует историю в JSON
	 * @returns {string} - JSON строка
	 */
	export() {
	  	return JSON.stringify(this.history, null, 2);
	}
	
	/**
	 * Импортирует историю из JSON
	 * @param {string} jsonStr - JSON строка
	 */
	import(jsonStr) {
		try {
			const imported = JSON.parse(jsonStr);
			if (Array.isArray(imported)) {
				this.history = imported.slice(0, this.maxSize);
			}
		} catch (error) {
			throw new Error(`Failed to import history: ${error.message}`);
		}
	}
}

module.exports = ClipboardHistory;