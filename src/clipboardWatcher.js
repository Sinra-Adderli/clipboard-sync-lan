const fs = require('fs');
const path = require('path');
const os = require('os');
const { clipboard, nativeImage } = require('electron');

/**
 * Класс для отслеживания изменений буфера обмена
 * Обнаруживает изменения текста и файлов, запускает синхронизацию
 */
class ClipboardWatcher {
	constructor(config, clipboardHistory) {
		this.config = config;
		this.clipboardHistory = clipboardHistory;
		this.lastContent = '';
		this.isEnabled = true;
		this.isPaused = false;
		this.watchInterval = null;
		this.onChangeCallback = null;
	}
	
	/**
	 * Начинает отслеживание изменений буфера обмена
	 * @param {Function} onChangeCallback - Функция обратного вызова при изменении буфера обмена
	 */
	async start(onChangeCallback) {
		if (this.watchInterval) {
			this.stop();
		}
		
		this.onChangeCallback = onChangeCallback;
		
		// Первоначальное чтение буфера обмена
		this.readClipboard().catch(err => {
			console.error('Initial clipboard read failed:', err);
		});
		
		// Запускаем периодическую проверку
		this.watchInterval = setInterval(() => {
			if (this.isEnabled && !this.isPaused) {
				this.checkClipboard();
			}
		}, this.config.CLIPBOARD_SYNC_INTERVAL);
	}
	
	/**
	 * Останавливает отслеживание буфера обмена
	 */
	stop() {
		if (this.watchInterval) {
			clearInterval(this.watchInterval);
			this.watchInterval = null;
		}
	}
	
	/**
	 * Приостанавливает отслеживание буфера обмена
	 */
	pause() {
		this.isPaused = true;
	}
	
	/**
	 * Возобновляет отслеживание буфера обмена
	 */
	resume() {
		this.isPaused = false;
	}
	
	/**
	 * Включает отслеживание буфера обмена
	 */
	enable() {
	  	this.isEnabled = true;
	}
	
	/**
	 * Отключает отслеживание буфера обмена
	 */
	disable() {
	  	this.isEnabled = false;
	}
	
	/**
	 * Проверяет буфер обмена на изменения
	 */
	async checkClipboard() {
		try {
			const formats = clipboard.availableFormats();
			
			const hasImage = formats.some(f => f.includes('image'));
			const hasText = formats.some(f => f.includes('text') || f.includes('string'));
			
			if (hasImage) {
				await this.handleImageClipboard();
			} else if (hasText) {
				await this.handleTextClipboard();
			}
		} catch (error) {
			console.error('Clipboard check error:', error.message);
		}
	}
	
	/**
	 * Обрабатывает текстовый буфер обмена
	 */
	async handleTextClipboard() {
		try {
			const currentContent = clipboard.readText();
			
			if (currentContent !== this.lastContent && currentContent.length > 0) {
				this.lastContent = currentContent;
				
				const entry = {
					content: currentContent,
					type: 'text',
					source: os.hostname(),
					timestamp: new Date()
				};
				
				// Добавляем в историю
				this.clipboardHistory.add(entry);
				
				// Вызываем callback
				if (this.onChangeCallback) {
					this.onChangeCallback(entry);
				}
			}
		} catch (error) {
			console.error('Failed to handle text clipboard:', error.message);
		}
	}
	
	/**
	 * Обрабатывает буфер обмена с изображениями
	 */
	async handleImageClipboard() {
		try {
			const image = clipboard.readImage();
			
			if (!image || image.isEmpty()) {
				return;
			}
			
			// Создаем уникальный ID для изображения
			const imageBuffer = image.toPNG();
			const imageHash = this.hashBuffer(imageBuffer);
			
			if (imageHash === this.lastContent) {
				return;
			}
			
			this.lastContent = imageHash;
			
			// Конвертируем в base64
			const base64Image = imageBuffer.toString('base64');
			
			const entry = {
				content: base64Image,
				type: 'image',
				imageData: {
					width: image.getSize().width,
					height: image.getSize().height,
					format: 'png',
					size: imageBuffer.length
				},
				source: os.hostname(),
				timestamp: new Date()
			};
			
			// Добавляем в историю (храним только метаданные, не само изображение)
			this.clipboardHistory.add({
				content: `[Image ${entry.imageData.width}x${entry.imageData.height}]`,
				type: 'image',
				source: entry.source,
				timestamp: entry.timestamp
			});
			
			// Вызываем callback для отправки
			if (this.onChangeCallback) {
				this.onChangeCallback(entry);
			}
		} catch (error) {
			console.error('Failed to handle image clipboard:', error.message);
		}
	}
	
	/**
	 * Создает хеш из буфера для сравнения
	 */
	hashBuffer(buffer) {
	  const crypto = require('crypto');
	  return crypto.createHash('md5').update(buffer).digest('hex');
	}
	
	/**
	 * Читает текущее содержимое буфера обмена
	 */
	async readClipboard() {
		try {
			this.lastContent = clipboard.readText();
			return this.lastContent;
		} catch (error) {
			console.error('Failed to read clipboard:', error);
			return '';
		}
	}
	
	/**
	 * Записывает содержимое в буфер обмена
	 * @param {string} content - Содержимое для записи
	 * @param {string} type - Тип содержимого ('text' или 'image')
	 */
	async writeClipboard(content, type = 'text') {
		try {
			// Временно приостанавливаем отслеживание, чтобы не вызвать собственное изменение
			const wasPaused = this.isPaused;
			this.pause();
			
			if (type === 'image') {
				// Записываем изображение
				const imageBuffer = Buffer.from(content, 'base64');
				const image = nativeImage.createFromBuffer(imageBuffer);
				clipboard.writeImage(image);
				this.lastContent = this.hashBuffer(imageBuffer);
			} else {
				// Записываем текст
				clipboard.writeText(content);
				this.lastContent = content;
			}
			
			// Возобновляем, если не было приостановлено ранее
			if (!wasPaused) {
				setTimeout(() => this.resume(), 500);
			}
		} catch (error) {
			console.error('Failed to write to clipboard:', error.message);
			
			// Возобновляем даже при ошибке
			if (!this.isPaused) {
				setTimeout(() => this.resume(), 500);
			}
			
			throw error;
		}
	}
	
	/**
	 * Сохраняет изображение из base64
	 * @param {Object} imageData - Объект данных изображения
	 * @returns {string} - Путь к сохраненному файлу
	 */
	saveImageFromBase64(imageData) {
		try {
			const tempDir = path.join(os.tmpdir(), this.config.TEMP_FOLDER);
			
			// Создаем временную папку, если она не существует
			if (!fs.existsSync(tempDir)) {
				fs.mkdirSync(tempDir, { recursive: true });
			}
			
			const fileName = `image_${Date.now()}.${imageData.format || 'png'}`;
			const filePath = path.join(tempDir, fileName);
			const buffer = Buffer.from(imageData.content, 'base64');
			
			fs.writeFileSync(filePath, buffer);
			
			return filePath;
		} catch (error) {
			throw new Error(`Failed to save image: ${error.message}`);
		}
	}
	
}

module.exports = ClipboardWatcher;