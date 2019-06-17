const sharp = require('sharp');

const constants = require('./constants');
const calculations = require('./calculations');
const Sanitize = require('./sanitize');
const GenerateUuid = require('./generateuuid');

module.exports = class {
	constructor(entryFile, name, Canvas, uri=undefined, uuid=undefined) {
		this.data = {
			Canvas,
			uuid: uuid ? uuid : GenerateUuid.v4(),
			uri: uri ? uri : entryFile.uri.split('/').slice(0, -1).join('/') + '/',
			name,
			scale: {},
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
		settings = Sanitize.scaleSettings(settings);
		const scratchCanvas = await this.data.Canvas.getOrCreateCanvas('scratchCanvas', 300, 300);
		const scratchCtx = this.data.scratchCtx = await scratchCanvas.getContext('2d');

		const tiffInput = sharp(this.data.files.image);
		const rawImage = await tiffInput.clone().raw().toBuffer();
		const meta = await tiffInput.metadata();

		// Calculate scale and image
		const scale = await calculations.calculateScale(meta, scratchCtx, this.data.magnification, type, settings);
		this.data.scale = scale;

		const canvas = this.data.canvas = await this.data.Canvas.getOrCreateCanvas(this.data.uuid, scale.realWidth, scale.realHeight);
		const ctx = await canvas.getContext('2d');

		// So we are using a "Canvas" object that is really just a communication layer to an actual canvas element.
		// This allows a remote canvas (such as one on Electron) to render everything for us and use more native
		//   support for various canvas hardware acceleration or visualization on the front-end.
		// For that reason we can't use setters since they don't support Promises and we don't know if the front-end
		//   module supports synchronous ordered commands (otherwise we can assume everything would happen in-order)

		await ctx.drawImage(`data:image/png;base64,${(await tiffInput.clone().png().toBuffer()).toString('base64')}`, 0, 0);
		await ctx.setFont(`${scale.textFontHeight}px "${settings.font}"`);
		await ctx.setTextBaseline('bottom');
		let textBackgroundIsBlack = '';

		if (scale.realHeight > scale.imageHeight) {
			let imageIsBlack = typeof settings.belowColor === 'object' && settings.belowColor.RGBA === constants.colors.black.RGBA;

			// Check the luminosity and use white or black background to make it look nice
			if (settings.belowColor === constants.colors.AUTO)
				imageIsBlack = calculations.sumPixelLuminosity(rawImage, 0, 0, meta.width, meta.height) < .5;

			textBackgroundIsBlack = imageIsBlack;
			await ctx.setFillStyle(imageIsBlack ? constants.colors.black.RGBA : constants.colors.white.RGBA);
			await ctx.fillRect(0, scale.imageHeight, scale.realWidth, scale.realHeight - scale.imageHeight);
		} else {
			await ctx.setFillStyle(settings.RGBA);
			await ctx.fillRect(scale.x, scale.y, scale.width, scale.height);
		}

		if (!settings.scaleColor && typeof textBackgroundIsBlack === 'string')
			textBackgroundIsBlack = calculations.sumPixelLuminosity(rawImage, scale.x, scale.y, scale.width, scale.height) < .5;

		await ctx.setFillStyle(settings.scaleColor ? settings.scaleColor.RGBA : (textBackgroundIsBlack ? constants.colors.white.RGBA : constants.colors.black.RGBA));
		await ctx.fillText(scale.visualScale, scale.textX, scale.textY + scale.textFontHeight);
		await ctx.fillRect(scale.barX, scale.barY, scale.scaleLength, scale.barPixelHeight);
	}

	async addPoint(x, y, name='', settings={}) {
		settings = Sanitize.pointSettings(settings);

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

	async toPngUrl() {
		return await this.data.canvas.getBuffer('url');
	}

	async toSharp() {
		const {type, data} = await this.data.canvas.getBuffer('raw');
		switch(type) {
			default:
			case 'array':
				return await sharp(Buffer.from(data), {raw: {
						width: this.data.scale.realWidth,
						height: this.data.scale.realHeight,
						channels: 4
					}});
			case 'raw':
				return await sharp(data, {raw: {
					width: this.data.scale.realWidth,
						height: this.data.scale.realHeight,
						channels: 4
				}});
			case 'image/png':
				return await sharp(Buffer.from(data.split(',', 2)[1], 'base64'));
		}
	}

	async write(settings={}) {
		settings = Sanitize.writeSettings(settings);
		let outputUri = settings.uri ? settings.uri : (this.data.files.image.substring(0, this.data.files.image.length - (constants.pointShoot.fileFormats.IMAGERAW.length)) + constants.pointShoot.fileFormats.OUTPUTIMAGE);

		await (await this.toSharp()).tiff(settings.tiff).toFile(outputUri);
		return outputUri;
	}

	async createBuffer(type=undefined, settings={}, points=[]) {
		settings = Sanitize.writeSettings(settings);
		await this.create(type, settings, points);
		return (await this.toSharp()).tiff(settings.tiff).toBuffer();
	}

	async createWrite(type=undefined, settings={}, points=[]) {
		await this.create(type, settings, points);
		await this.write(settings);
	}

	async create(type=undefined, settings={}, points=[]) {
		await this.addScale(type, settings);

		if (points)
			for (const {x, y, name, settings=settings} of points)
				await this.addPoint(x, y, name, settings);

		if (settings.addPoints && this.data.points)
			for (const point of Object.values(this.data.points))
				await this.addPoint(...calculations.pointToXY(point, this.data.scale.imageWidth, this.data.scale.imageHeight), point.name.match(/pt(\d.+)psmsa/miu)[1].slice(0, -1), settings);

		return this;
	}

	serialize() {
		return {
			uri: this.data.uri,
			name: this.data.name,
			integrity: this.data.integrity,
			magnification: this.data.magnification,
			points: this.data.points,
			image: {
				width: this.data.scale.imageWidth,
				height: this.data.scale.imageHeight
			},
			output: {
				width: this.data.scale.realWidth,
				height: this.data.scale.realHeight
			}
		}
	}
};