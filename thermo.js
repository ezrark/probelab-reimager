const sharp = require('sharp');

const constants = require('./constants');
const calculations = require('./calculations');
const Sanitize = require('./sanitize');
const GenerateUuid = require('./generateuuid');
const io = require('./io');

module.exports = class Thermo {
	constructor(entryFile, name, Canvas, uri=undefined, uuid=undefined, previous=undefined) {
		this.data = {
			Canvas,
			uuid: uuid ? uuid : GenerateUuid.v4(),
			uri: uri ? uri : entryFile.uri.split('/').slice(0, -1).join('/') + '/',
			name,
			scale: {},
			metaConstants: {},
			canvas: undefined,
			ctx: undefined,
			scratchCanvas: undefined,
			scratchCtx: undefined,
			integrity: true,
			magnification: 0,
			points: {},
			layers: {},
			files: {
				base: '',
				entry: entryFile.uri,
				points: [],
				layers: []
			},
			metadata: {},
			data: {
				point: {},
				map: {}
			}
		};

		if (!previous) {
			const entryData = io.readEntryFile(this.data.files.entry);

			this.data.files.base = this.data.uri + entryData.data.base;
			this.data.files.layers = entryData.layers;

			this.data.files.layers.push({
				element: 'base',
				file: this.data.files.base
			});

			this.data.points = entryData.points.reduce((points, point) => {
				point.data = io.readMASFile((this.data.uri + point.file));
				point.name = point.file.split('.')[0].split('_pt').pop();
				points[point.name] = point;
				return points;
			}, {});

			this.data.files.points = Object.keys(this.data.points);

			try {
				this.data.data.map = io.readMASFile(this.data.uri + constants.extractedMap.fileFormats.SPECTRA);
				const mag = parseInt(this.data.data.map[constants.extractedMap.MAGNIFICATIONKEY].data);
				if (this.data.magnification !== 0 && this.data.magnification !== mag)
					this.data.integrity = false;
				else
					this.data.magnification = mag;
			} catch (err) {}

			try {
				const mag = parseInt(this.data.points[this.data.files.points[0]].data[constants.pointShoot.MAGNIFICATIONKEY].data);
				if (this.data.magnification !== 0 && this.data.magnification !== mag)
					this.data.integrity = false;
				else
					this.data.magnification = mag;

				if (this.data.integrity)
					this.data.integrity = checkPointIntegrity(this.data.files.points.map(file => this.data.points[file]));
			} catch (err) {}

			this.updateFromDisk();
		} else {
			this.data.scale = JSON.parse(JSON.stringify(previous.data.scale));
			this.data.metaConstants = JSON.parse(JSON.stringify(previous.data.metaConstants));
			this.data.integrity = previous.data.integrity;
			this.data.magnification = previous.data.magnification;
			this.data.points = JSON.parse(JSON.stringify(previous.data.points));
			this.data.layers = JSON.parse(JSON.stringify(previous.data.layers));
			this.data.files = JSON.parse(JSON.stringify(previous.data.files));
			this.data.metadata = JSON.parse(JSON.stringify(previous.data.metadata));
			this.data.data = JSON.parse(JSON.stringify(previous.data.data));
		}
	}

	async init() {
		if (!this.data.layers.base) {
			this.data.layers = (await Promise.all(this.data.files.layers.map(async ({file, element}) => {
				if (element !== 'base') {
					return {
						element,
						sharp: await (await (sharp(this.data.uri + file).raw()).ensureAlpha())
					}
				} else {
					return {
						element,
						sharp: sharp(file)
					}
				}
			}))).reduce((layers, {sharp, element}) => {
				layers[element] = sharp;
				return layers;
			}, {});

			this.data.metadata = await this.data.layers.base.metadata();

			this.data.points = Object.values(this.data.points).reduce((points, point) => {
				const [x, y] = calculations.pointToXY(point, this.data.metadata.width, this.data.metadata.height);
				point.x = x;
				point.y = y;
				points[point.name] = point;
				return points;
			}, {});
		}

		const scratchCanvas = this.data.scratchCanvas = await this.data.Canvas.getOrCreateCanvas('scratchCanvas', 300, 300);
		this.data.scratchCtx = await scratchCanvas.getContext('2d');

		if (!this.data.metaConstants.width)
			this.data.metaConstants = await calculations.calculateConstants(this.data.metadata, this.data.scratchCtx, constants.fonts.OPENSANS);

		const canvas = this.data.canvas = await this.data.Canvas.getOrCreateCanvas(this.data.uuid, this.data.metaConstants.maxWidth, this.data.metaConstants.maxHeight);
		this.data.ctx = await canvas.getContext('2d');
		return this;
	}

	async deleteCanvas() {
		this.data.scratchCtx = undefined;
		this.data.ctx = undefined;

		if (this.data.scratchCanvas)
			await this.data.scratchCanvas.delete();

		if (this.data.canvas)
			await this.data.canvas.delete();

		this.data.canvas = undefined;
		this.data.scratchCanvas = undefined;
		return this;
	}

	updateFromDisk() {}

	async addLayer({name: layerName='', color=constants.colors.white, opacity=0.5}, settings={}) {
		layerName = layerName.toLowerCase();

		if (this.data.scratchCtx === undefined)
			await this.init();

		if (layerName === 'base')
			await this.data.ctx.drawImage(`data:image/png;base64,${(await this.data.layers[layerName].clone().png().toBuffer()).toString('base64')}`, 0, 0, this.data.metadata.width, this.data.metadata.height);
		else if (this.data.layers[layerName]) {
			const image = this.data.layers[layerName];
			const metadata = await image.metadata();
			const rawImage = await image.toBuffer();

			for (let i = 0; i < rawImage.length; i += 4) {
				rawImage[i + 3] = rawImage[i]*opacity;
				rawImage[i] = color.R;
				rawImage[i + 1] = color.G;
				rawImage[i + 2] = color.B;
			}

			const newImage = sharp(Buffer.from(rawImage), {
				raw: {
					width: metadata.width,
					height: metadata.height,
					channels: 4
				}
			});

			await this.data.ctx.drawImage(`data:image/png;base64,${(await newImage.png().toBuffer()).toString('base64')}`, 0, 0, this.data.metadata.width, this.data.metadata.height);
		}

		return this;
	}

	async addScale(type=constants.scale.types.BELOWCENTER, settings={}) {
		settings = Sanitize.scaleSettings(JSON.parse(JSON.stringify(settings)));

		if (this.data.scratchCtx === undefined)
			await this.init();

		const meta = this.data.metadata;

		// Calculate scale and image
		const scale = this.data.scale = await calculations.calculateScale(this.data.metaConstants, this.data.scratchCtx, this.data.magnification, type, settings);
		const ctx = this.data.ctx;

		// So we are using a "Canvas" object that is really just a communication layer to an actual canvas element.
		// This allows a remote canvas (such as one on Electron) to render everything for us and use more native
		//   support for various canvas hardware acceleration or visualization on the front-end.
		// For that reason we can't use setters since they don't support Promises and we don't know if the front-end
		//   module supports synchronous ordered commands (otherwise we can assume everything would happen in-order)

		await ctx.setFont(`${scale.textFontHeight}px "${settings.font}"`);
		await ctx.setTextBaseline('bottom');
		let imageIsDark = typeof settings.belowColor === 'object' && settings.belowColor.RGBA === constants.colors.black.RGBA;

		// Check the luminosity and use white or black background to make it look nice
		if (settings.belowColor === constants.colors.AUTO)
			imageIsDark = (await ctx.findLuminosity(0, 0, meta.width, meta.height)) < .5;

		let textBackgroundIsLight = imageIsDark;

		if (scale.realHeight > scale.imageHeight) {
			await ctx.setFillStyle(imageIsDark ? constants.colors.black.RGBA : constants.colors.white.RGBA);
			await ctx.fillRect(0, scale.imageHeight, scale.realWidth, scale.realHeight - scale.imageHeight);
		} else {
			await ctx.setFillStyle(settings.RGBA === constants.colors.AUTO ?
					`rgba(${
					imageIsDark ? constants.colors.black.R : constants.colors.white.R}, ${
					imageIsDark ? constants.colors.black.G : constants.colors.white.G}, ${
					imageIsDark ? constants.colors.black.B : constants.colors.white.B}, ${
					settings.backgroundOpacity})`
				: settings.RGBA);
			await ctx.fillRect(scale.x, scale.y, scale.width, scale.height);
		}

		if (settings.scaleColor === constants.colors.AUTO && settings.belowColor !== constants.colors.AUTO)
			textBackgroundIsLight = (await ctx.findLuminosity(scale.x, scale.y, scale.width, scale.height)) < .5;

		await ctx.setFillStyle(settings.scaleColor ? settings.scaleColor.RGBA : (textBackgroundIsLight ? constants.colors.white.RGBA : constants.colors.black.RGBA));
		await ctx.fillText(scale.visualScale, scale.textX, scale.textY + scale.textFontHeight);
		await ctx.fillRect(scale.barX, scale.barY, scale.scaleLength, scale.barPixelHeight);
		return this;
	}

	async addPoint(x, y, name='', settings={}) {
		settings = Sanitize.pointSettings(JSON.parse(JSON.stringify(settings)));

		if (this.data.scratchCtx === undefined)
			await this.init();

		const ctx = this.data.ctx;
		await ctx.setTextBaseline('bottom');

		const point = await calculations.calculatePointPosition(this.data.scratchCtx, x, y, this.data.metadata.width, settings.pointSize, settings.pointFontSize, settings.pointFont);

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
		return this;
	}

	async toUrl(settings) {
		settings = Sanitize.writeSettings(JSON.parse(JSON.stringify(settings)));
		if (settings.png.use)
			return 'data:png;base64,' + (await (await this.toSharp()).png(settings.png).toBuffer()).toString('base64');
		else if (settings.webp.use)
			return 'data:webp;base64,' + (await (await this.toSharp()).webp(settings.webp).toBuffer()).toString('base64');
		else if (settings.jpeg.use)
			return 'data:jpeg;base64,' + (await (await this.toSharp()).jpeg(settings.jpeg).toBuffer()).toString('base64');
		else
			return 'data:tiff;base64,' + (await (await this.toSharp()).tiff(settings.tiff).toBuffer()).toString('base64');
	}

	async toSharp() {
		const width = this.data.scale ? this.data.scale.realWidth : this.data.meta.width;
		const height = this.data.scale ? this.data.scale.realHeight : this.data.meta.height;

		const {type, data} = await this.data.ctx.getImageData(0, 0, width, height);
		switch(type) {
			default:
			case 'array':
				return await sharp(Buffer.from(data), {
					raw: {
						width,
						height,
						channels: 4
					}
				});
			case 'raw':
				return await sharp(data, {
					raw:{
						width,
						height,
						channels: 4
					}
				});
			case 'image/png':
				return await sharp(Buffer.from(data.split(',', 2)[1], 'base64'));
		}
	}

	async write(settings={}) {
		settings = Sanitize.writeSettings(JSON.parse(JSON.stringify(settings)));
		let outputUri = settings.uri ? settings.uri : (this.data.files.base.substring(0, this.data.files.base.length - (constants.pointShoot.fileFormats.IMAGERAW.length)) + constants.pointShoot.fileFormats.OUTPUTIMAGE);

		await (await this.toSharp()).tiff(settings.tiff).toFile(outputUri);
		return outputUri;
	}

	async createBuffer(type=undefined, settings={}, points=[], layers=[]) {
		await this.create(type, settings, points, layers);
		settings = Sanitize.writeSettings(JSON.parse(JSON.stringify(settings)));
		return (await this.toSharp()).tiff(settings.tiff).toBuffer();
	}

	async createWrite(type=undefined, settings={}, points=[], layers=[]) {
		await this.create(type, settings, points, layers);
		await this.write(settings);
		return this;
	}

	async create(type=undefined, settings={}, points=[], layers=[]) {
		for (const layer of layers)
			await this.addLayer(layer);

		for (const {x, y, name, pointSettings=settings} of points)
			await this.addPoint(x, y, name, pointSettings);

		if (settings.addPoints && this.data.points)
			for (const point of Object.values(this.data.points))
				await this.addPoint(...calculations.pointToXY(point, this.data.scale.imageWidth, this.data.scale.imageHeight), point.name, settings);

		await this.addScale(type, settings);

		return this;
	}

	serialize() {
		return {
			uri: this.data.uri,
			uuid: this.data.uuid,
			name: this.data.name,
			integrity: this.data.integrity,
			magnification: this.data.magnification,
			points: Object.values(this.data.points).reduce((points, {name, type, values, file, x, y}) => {points[name] = {name, type, values, file, x, y}; return points}, {}),
			layers: this.data.files.layers.reduce((layers, {file, element}) => {layers[element] = {file, element}; return layers}, {}),
			entryFile: this.data.files.entry,
			image: {
				width: this.data.metadata.width,
				height: this.data.metadata.height
			},
			output: {
				width: this.data.scale.realWidth ? this.data.metadata.width : this.data.scale.realWidth,
				height: this.data.scale.realHeight ? this.data.metadata.height : this.data.scale.realHeight
			}
		}
	}

	clone() {
		return new Thermo(this.data.files.entry, this.data.name, this.data.Canvas, undefined, undefined, this);
	}
};

function checkPointIntegrity(points) {
	const expectedData = points[0];

	for (const point of points) {
		for (const key in point.data)
			if (!constants.pointShoot.integrity.SKIPARRAY.includes(key) && !key.startsWith('#quant_'))
				if (expectedData.data[key].data !== point.data[key].data)
					return false;
		if (expectedData.values[2] !== point.values[2])
			if (expectedData.values[3] !== point.values[3])
				return false;
	}
	return true;
}