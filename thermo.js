const Jimp = require('jimp');
const Canvas = require('canvas');

const constants = require('./constants');
const calculations = require('./calculations');

Canvas.registerFont('fonts/OpenSans-Bold.ttf', { family: 'Open Sans Bold' });
Canvas.registerFont('fonts/Comic Sans MS.ttf', { family: 'Comic Sans MS' });
const scratchCanvas = Canvas.createCanvas(300, 300);
const scratchCtx = scratchCanvas.getContext('2d');

module.exports = class {
	constructor(entryFile, name, uri=undefined) {
		this.data = {
			uri: uri ? uri : entryFile.uri.split('/').slice(0, -1).join('/') + '/',
			name,
			scale: {},
			image: undefined,
			canvas: undefined,
			integrity: true,
			magnification: 1,
			points: {},
			files: {
				image: '',
				entry: entryFile.uri,
				points: []
			}
		};
		this.updateFromDisk();
	}

	updateFromDisk() {}

	async addScale(type=constants.scale.types.BELOWCENTER, settings={}) {
		settings.belowColor = settings.belowColor ? settings.belowColor : constants.colors.AUTO;
		settings.scaleColor = settings.scaleColor ? settings.scaleColor : constants.colors.AUTO;
		settings.scaleSize = settings.scaleOffsets ? settings.scaleOffsets : constants.scale.AUTOSIZE;
		settings.scaleBarHeight = settings.scaleBarHeight ? settings.scaleBarHeight : constants.scale.AUTOSIZE;
		settings.scaleBarTop = settings.scaleBarTop ? settings.scaleBarTop : constants.scale.SCALEBARTOP;
		settings.pixelSizeConstant = settings.pixelSizeConstant ? settings.pixelSizeConstant : constants.PIXELSIZECONSTANT;
		settings.backgroundOpacity  = settings.backgroundOpacity ? settings.backgroundOpacity : constants.scale.background.AUTOOPACITY;
		settings.font = settings.font ? settings.font : constants.fonts.OPENSANS;

		// Calculate scale and image
		const [scale, rawImage] = await calculations.calculateScale(await Jimp.read(this.data.files.image), scratchCtx, this.data.magnification, type, settings);
		this.data.scale = scale;

		// Background
		settings.backgroundOpacity = (settings.backgroundOpacity < 0 ? 0 : (settings.backgroundOpacity > 100 ? 100 : settings.backgroundOpacity))/100;

		return new Promise(async (resolve, reject) => {
			const canvas = Canvas.createCanvas(scale.realWidth, scale.realHeight);
			const ctx = canvas.getContext('2d');

			const img = new Canvas.Image();
			img.onload = async () => {
				ctx.drawImage(img, 0, 0);
				ctx.font = `${scale.textFontHeight}px "${settings.font}"`;
				ctx.textBaseline = 'bottom';
				let textBackgroundIsBlack = '';

				if (scale.realHeight > scale.imageHeight) {
					let imageIsBlack = settings.belowColor === constants.scale.colors.BLACK;

					// Check the luminosity and use white or black background to make it look nice
					if (settings.belowColor === constants.colors.AUTO)
						imageIsBlack = calculations.sumPixelLuminosity(rawImage, 0, 0, rawImage.bitmap.width, rawImage.bitmap.height) < .5;

					textBackgroundIsBlack = imageIsBlack;
					ctx.fillStyle = imageIsBlack ? constants.colors.black.RGBA : constants.colors.white.RGBA;
					ctx.fillRect(0, scale.imageHeight, scale.realWidth, scale.realHeight - scale.imageHeight);
				} else {
					textBackgroundIsBlack = !!settings.belowColor;
					ctx.fillStyle = `rgba(${settings.belowColor ? settings.belowColor.R : constants.colors.white.R}, ${
						settings.belowColor ? settings.belowColor.G : constants.colors.white.G}, ${
						settings.belowColor ? settings.belowColor.B : constants.colors.white.B}, ${settings.backgroundOpacity})`;
					ctx.fillRect(scale.x, scale.y, scale.width, scale.height);
				}

				if (typeof textBackgroundIsBlack === 'string')
					textBackgroundIsBlack = calculations.sumPixelLuminosity(rawImage, scale.x, scale.y, scale.width, scale.height) < .5;

				ctx.fillStyle = settings.scaleColor ? settings.scaleColor.RGBA : (textBackgroundIsBlack ? constants.colors.white.RGBA : constants.colors.black.RGBA);
				ctx.fillText(scale.visualScale, scale.textX, scale.textY + scale.textFontHeight);
				ctx.fillRect(scale.barX, scale.barY, scale.scaleLength, scale.barPixelHeight);

				this.data.canvas = canvas;
				resolve();
			};
			img.onerror = reject;
			img.src = await rawImage.getBase64Async(Jimp.MIME_PNG);
		});
	}

	async addPoint(x, y, name='', settings={}) {
		settings.pointType = settings.pointType ? settings.pointType : constants.point.types.THERMOINSTANT;
		settings.textColor = settings.textColor ? settings.textColor : constants.colors.red;
		settings.pointSize = settings.pointSize ? settings.pointSize : constants.point.AUTOSIZE;
		settings.pointFontSize = settings.pointFontSize ? settings.pointFontSize : constants.point.AUTOSIZE;
		settings.pointFont = settings.pointFont ? settings.pointFont : constants.fonts.OPENSANS;

		const scale = this.data.scale;
		const canvas = this.data.canvas;
		const ctx = canvas.getContext('2d');
		ctx.textBaseline = 'bottom';

		const point = await calculations.calculatePointPosition(scratchCtx, x, y, scale.imageWidth, settings.pointSize, settings.pointFontSize, settings.pointFont);

		ctx.fillStyle = settings.textColor.RGBA;
		ctx.strokeStyle = settings.textColor.RGBA;
		ctx.font = `${point.fontSize}px "${settings.pointFont}"`;
		ctx.fillText(name, point.fontX, point.fontY);

		ctx.lineWidth = point.eighthSize;

		if (point.size <= 4)
			settings.pointType = constants.point.types.CIRCLE;

		switch(settings.pointType) {
			case constants.point.types.CIRCLE:
				ctx.beginPath();
				ctx.ellipse(point.centerX, point.centerY, point.halfSize, point.halfSize, 0, 0, 2 * Math.PI);
				ctx.fill();
				break;
			case constants.point.types.THERMOINSTANT: // Smallest good looking one is 11
				ctx.fillRect(point.leftX - point.halfSize, point.centerY - point.sixteenthSize, point.pointWidth * 2, point.eighthSize + 1);
				ctx.fillRect(point.centerX - point.sixteenthSize, point.topY - point.halfSize, point.eighthSize + 1, point.pointHeight * 2);
				ctx.strokeRect(point.centerX - point.halfSize, point.centerY - point.halfSize, point.size, point.size);
				break;
			case constants.point.types.THERMOINSTANTROUND: // Smallest good looking one is 11
				ctx.fillRect(point.leftX - point.halfSize, point.centerY - point.sixteenthSize, point.pointWidth * 2, point.eighthSize + 1);
				ctx.fillRect(point.centerX - point.sixteenthSize, point.topY - point.halfSize, point.eighthSize + 1, point.pointHeight * 2);
				ctx.beginPath();
				ctx.ellipse(point.centerX, point.centerY, point.halfSize, point.halfSize, 0, 0, 2 * Math.PI);
				ctx.stroke();
				break;
			case constants.point.types.CROSS:
				ctx.fillRect(point.leftX, point.centerY - point.sixteenthSize, point.pointWidth, point.eighthSize + 1);
				ctx.fillRect(point.centerX - point.sixteenthSize, point.topY, point.eighthSize + 1, point.pointHeight);
				break;
		}
	}

	toBuffer() {
		// Crap... the canvas outputs as BGRA, wtf
		// Convert to RGBA
		let canvasBuffer = this.data.canvas.toBuffer('raw');
		for (let i = 0; canvasBuffer.length > i; i += 4) {
			const hold = canvasBuffer[i];
			canvasBuffer[i] = canvasBuffer[i + 2];
			canvasBuffer[i + 2] = hold;
		}

		return canvasBuffer;
	}

	write(settings={}) {
		return new Promise((resolve, reject) => {
			let outputUri = settings.uri ? settings.uri : (this.data.files.image.substring(0, this.data.files.image.length - (constants.pointShoot.fileFormats.IMAGERAW.length)) + constants.pointShoot.fileFormats.OUTPUTIMAGE);

			new Jimp({
				data: this.toBuffer(),
				width: this.data.scale.realWidth,
				height: this.data.scale.realHeight
			}, async (err, image) => {
				if (err)
					reject(err);
				else
					resolve(await image.writeAsync(outputUri));
			});
		});
	}

	async createBuffer(type=undefined, settings={}, points=[]) {
		await this.create(type, settings, points);
		const buffer = this.toBuffer();
		this.data.canvas = undefined;
		return buffer;
	}

	async createWrite(type=undefined, settings={}, points=[]) {
		await this.create(type, settings, points);
		await this.write(settings);
		this.data.canvas = undefined;
	}

	async create(type=undefined, settings={}, points=[]) {
		await this.addScale(type, settings);

		if (points)
			for (const {x, y, name, settings=settings} of points)
				await this.addPoint(x, y, name, settings);

		if (settings.addPoints && this.data.points)
			for (const point of Object.values(this.data.points)) {
				await this.addPoint(...calculations.pointToXY(point, this.data.scale.imageWidth, this.data.scale.imageHeight), point.name.match(/pt(\d.+)psmsa/miu)[1].slice(0, -1), settings);
			}

		return this;
	}
};