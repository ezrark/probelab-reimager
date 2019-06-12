const Jimp = require('jimp');

const constants = require('./constants');
const calculations = require('./calculations');

module.exports = class {
	constructor(entryFile, name, Canvas, uri=undefined) {
		this.data = {
			Canvas,
			uri: uri ? uri : entryFile.uri.split('/').slice(0, -1).join('/') + '/',
			name,
			scale: {},
			image: undefined,
			canvas: undefined,
			scratchCtx: undefined,
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
		settings.scaleSize = settings.scaleSize ? settings.scaleSize : constants.scale.AUTOSIZE;
		settings.scaleBarHeight = settings.scaleBarHeight ? settings.scaleBarHeight : constants.scale.AUTOSIZE;
		settings.scaleBarTop = settings.scaleBarTop ? settings.scaleBarTop : constants.scale.SCALEBARTOP;
		settings.pixelSizeConstant = settings.pixelSizeConstant ? settings.pixelSizeConstant : constants.PIXELSIZECONSTANT;
		settings.backgroundOpacity  = settings.backgroundOpacity ? settings.backgroundOpacity : constants.scale.background.AUTOOPACITY;
		settings.font = settings.font ? settings.font : constants.fonts.OPENSANS;

		const scratchCanvas = await this.data.Canvas.getOrCreateCanvas('scratchCanvas', 300, 300);
		const scratchCtx = this.data.scratchCtx = await scratchCanvas.getContext('2d');

		// Calculate scale and image
		const [scale, rawImage] = await calculations.calculateScale(await Jimp.read(this.data.files.image), scratchCtx, this.data.magnification, type, settings);
		this.data.scale = scale;

		// Background
		settings.backgroundOpacity = (settings.backgroundOpacity < 0 ? 0 : (settings.backgroundOpacity > 100 ? 100 : settings.backgroundOpacity))/100;

		const canvas = await this.data.Canvas.createCanvas(scale.realWidth, scale.realHeight);
		const ctx = await canvas.getContext('2d');

		// So we are using a "Canvas" object that is really just a communication layer to an actual canvas element.
		// This allows a remote canvas (such as one on Electron) to render everything for us and use more native
		//   support for various canvas hardware acceleration or visualization on the front-end.
		// For that reason we can't use setters since they don't support Promises and we don't know if the front-end
		//   module supports synchronous ordered commands (otherwise we can assume everything would happen in-order)

		await ctx.drawImage(await rawImage.getBase64Async(Jimp.MIME_PNG), 0, 0);
		await ctx.setFont(`${scale.textFontHeight}px "${settings.font}"`);
		await ctx.setTextBaseline('bottom');
		let textBackgroundIsBlack = '';

		if (scale.realHeight > scale.imageHeight) {
			let imageIsBlack = typeof settings.belowColor === 'object' && settings.belowColor.RGBA === constants.colors.black.RGBA;

			// Check the luminosity and use white or black background to make it look nice
			if (settings.belowColor === constants.colors.AUTO)
				imageIsBlack = calculations.sumPixelLuminosity(rawImage, 0, 0, rawImage.bitmap.width, rawImage.bitmap.height) < .5;

			textBackgroundIsBlack = imageIsBlack;
			await ctx.setFillStyle(imageIsBlack ? constants.colors.black.RGBA : constants.colors.white.RGBA);
			await ctx.fillRect(0, scale.imageHeight, scale.realWidth, scale.realHeight - scale.imageHeight);
		} else {
			await ctx.setFillStyle(`rgba(${settings.belowColor ? settings.belowColor.R : constants.colors.white.R}, ${
				settings.belowColor ? settings.belowColor.G : constants.colors.white.G}, ${
				settings.belowColor ? settings.belowColor.B : constants.colors.white.B}, ${settings.backgroundOpacity})`);
			await ctx.fillRect(scale.x, scale.y, scale.width, scale.height);
		}

		if (!settings.scaleColor && typeof textBackgroundIsBlack === 'string')
			textBackgroundIsBlack = calculations.sumPixelLuminosity(rawImage, scale.x, scale.y, scale.width, scale.height) < .5;

		await ctx.setFillStyle(settings.scaleColor ? settings.scaleColor.RGBA : (textBackgroundIsBlack ? constants.colors.white.RGBA : constants.colors.black.RGBA));
		await ctx.fillText(scale.visualScale, scale.textX, scale.textY + scale.textFontHeight);
		await ctx.fillRect(scale.barX, scale.barY, scale.scaleLength, scale.barPixelHeight);

		this.data.canvas = canvas;
	}

	async addPoint(x, y, name='', settings={}) {
		settings.pointType = settings.pointType ? settings.pointType : constants.point.types.THERMOINSTANT;
		settings.textColor = settings.textColor ? settings.textColor : constants.colors.red;
		settings.pointSize = settings.pointSize ? settings.pointSize : constants.point.AUTOSIZE;
		settings.pointFontSize = settings.pointFontSize ? settings.pointFontSize : constants.point.AUTOSIZE;
		settings.pointFont = settings.pointFont ? settings.pointFont : constants.fonts.OPENSANS;

		const scale = this.data.scale;
		if (scale === undefined)
			throw 'Use addScale before calling addPoint, hopefully fixed in the future';

		if (this.data.scratchCtx === undefined) {
			const scratchCanvas = await this.data.Canvas.getOrCreateCanvas('scratchCanvas', 300, 300);
			this.data.scratchCtx = await scratchCanvas.getContext('2d');
		}

		if (this.data.canvas === undefined)
			this.data.canvas = await this.data.Canvas.createCanvas(scale.realWidth, scale.realHeight);

		const canvas = this.data.canvas;
		const ctx = await canvas.getContext('2d');
		await ctx.setTextBaseline('bottom');

		const point = await calculations.calculatePointPosition(this.data.scratchCtx, x, y, scale.imageWidth, settings.pointSize, settings.pointFontSize, settings.pointFont);

		await ctx.setFillStyle(settings.textColor.RGBA);
		await ctx.setStrokeStyle(settings.textColor.RGBA);
		await ctx.setFont(`${point.fontSize}px "${settings.pointFont}"`);
		await ctx.fillText(name, point.fontX, point.fontY);

		await ctx.setLineWidth(point.eighthSize);

		if (point.size <= 4)
			settings.pointType = constants.point.types.CIRCLE;

		switch(settings.pointType) {
			case constants.point.types.CIRCLE:
				await ctx.beginPath();
				await ctx.ellipse(point.centerX, point.centerY, point.halfSize, point.halfSize, 0, 0, 2 * Math.PI);
				await ctx.fill();
				break;
			case constants.point.types.THERMOINSTANT: // Smallest good looking one is 11
				await ctx.fillRect(point.leftX - point.halfSize, point.centerY - point.sixteenthSize, point.pointWidth * 2, point.eighthSize + 1);
				await ctx.fillRect(point.centerX - point.sixteenthSize, point.topY - point.halfSize, point.eighthSize + 1, point.pointHeight * 2);
				await ctx.strokeRect(point.centerX - point.halfSize, point.centerY - point.halfSize, point.size, point.size);
				break;
			case constants.point.types.THERMOINSTANTROUND: // Smallest good looking one is 11
				await ctx.fillRect(point.leftX - point.halfSize, point.centerY - point.sixteenthSize, point.pointWidth * 2, point.eighthSize + 1);
				await ctx.fillRect(point.centerX - point.sixteenthSize, point.topY - point.halfSize, point.eighthSize + 1, point.pointHeight * 2);
				await ctx.beginPath();
				await ctx.ellipse(point.centerX, point.centerY, point.halfSize, point.halfSize, 0, 0, 2 * Math.PI);
				await ctx.stroke();
				break;
			case constants.point.types.CROSS:
				await ctx.fillRect(point.leftX, point.centerY - point.sixteenthSize, point.pointWidth, point.eighthSize + 1);
				await ctx.fillRect(point.centerX - point.sixteenthSize, point.topY, point.eighthSize + 1, point.pointHeight);
				break;
		}
	}

	toBuffer() {
		return this.data.canvas.getBuffer('raw');
	}

	write(settings={}) {
		return new Promise(async (resolve, reject) => {
			let outputUri = settings.uri ? settings.uri : (this.data.files.image.substring(0, this.data.files.image.length - (constants.pointShoot.fileFormats.IMAGERAW.length)) + constants.pointShoot.fileFormats.OUTPUTIMAGE);

			new Jimp({
				data: await this.toBuffer(),
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