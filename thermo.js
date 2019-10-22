const fs = require('fs').promises;

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
			}, {
				element: 'solid',
				file: ''
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

	async addLayerFile(uri) {
		const filename = uri.toLowerCase().replace(/\\/g, '/').split('/').pop().split(' ');
		const element = filename.pop().split('.')[0];
		const type = filename.pop();
		const layerElement = `${element} ${type}`;

		const image = await (await sharp(uri).raw().ensureAlpha());

		this.data.layers[layerElement] = {
			element: layerElement,
			file: uri,
			image,
			metadata: await image.metadata()
		};
	}

	async init() {
		if (!this.data.layers.base) {
			await Promise.all(this.data.files.layers.map(async ({file, element}) => {
				if (element !== 'base')
					if (element !== 'solid')
						return this.addLayerFile(this.data.uri + file);
					else
						this.data.layers['solid'] = {
							element,
							file: '',
							image: undefined,
							metadata: {}
						};
				else {
					const image = sharp(file);
					this.data.layers['base'] = {
						element,
						file: this.data.uri + file,
						image,
						metadata: await image.metadata()
					}
				}
			}));

			this.data.metadata = this.data.layers.base.metadata;

			this.data.points = Object.values(this.data.points).reduce((points, point) => {
				point.pos = calculations.pointToXY(point.values, this.data.metadata.width, this.data.metadata.height);
				point.x = point.pos[0];
				point.y = point.pos[1];
				points[point.name] = point;
				switch(point.type) {
					case 'rect':
						point.pos = calculations.rectToXY(point.values, this.data.metadata.width, this.data.metadata.height);
						break;
					case 'circle':
						point.pos = calculations.circleToXY(point.values, this.data.metadata.width, this.data.metadata.height);
						break;
					case 'polygon':
						point.pos = calculations.polyToXY(point.values, this.data.metadata.width, this.data.metadata.height);
						break;
				}

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
			await this.data.ctx.drawImage(`data:image/png;base64,${(await this.data.layers[layerName].image.clone().png().toBuffer()).toString('base64')}`, 0, 0, this.data.metadata.width, this.data.metadata.height);
		else if (layerName === 'solid') {
			await this.data.ctx.setFillStyle(color.RGBA);
			await this.data.ctx.fillRect(0, 0, this.data.metadata.width, this.data.metadata.height);
		} else if (this.data.layers[layerName]) {
			const image = this.data.layers[layerName];
			const metadata = image.metadata;
			const rawImage = await image.image.toBuffer();

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

	async addPoly(points, name='', settings={}) {
		settings = Sanitize.pointSettings(JSON.parse(JSON.stringify(settings)));

		if (this.data.scratchCtx === undefined)
			await this.init();

		const ctx = this.data.ctx;
		await ctx.setTextBaseline('bottom');

		const poly = await calculations.calculatePoly(this.data.scratchCtx, points, this.data.metadata.width, settings.pointSize, settings.pointFontSize, settings.pointFont);

		await ctx.setFillStyle(settings.textColor.RGBA);
		await ctx.setStrokeStyle(settings.textColor.RGBA);
		await ctx.setFont(`${poly.fontSize}px "${settings.pointFont}"`);
		await ctx.fillText(name, poly.fontX, poly.fontY);

		await ctx.setLineWidth(poly.lineWidth);
		await ctx.setLineJoin('round');
		await ctx.beginPath();
		await ctx.moveTo(points[0].x, points[0].y);
		for (const {x, y} of points)
			await ctx.lineTo(x, y);
		await ctx.lineTo(points[0].x, points[0].y);
		await ctx.stroke();

		return this;
	}

	async addRectangle(topX, topY, botX, botY, name='', settings={}) {
		settings = Sanitize.pointSettings(JSON.parse(JSON.stringify(settings)));

		if (this.data.scratchCtx === undefined)
			await this.init();

		const ctx = this.data.ctx;
		await ctx.setTextBaseline('bottom');

		const rect = await calculations.calculateRectangle(this.data.scratchCtx, topX, topY, botX, botY, this.data.metadata.width, settings.pointSize, settings.pointFontSize, settings.pointFont);

		await ctx.setFillStyle(settings.textColor.RGBA);
		await ctx.setStrokeStyle(settings.textColor.RGBA);
		await ctx.setFont(`${rect.fontSize}px "${settings.pointFont}"`);
		await ctx.fillText(name, rect.fontX, rect.fontY);

		await ctx.setLineWidth(rect.lineWidth);

		await ctx.strokeRect(topX, topY, rect.width, rect.height);

		return this;
	}

	async addCircle(x, y, radius, name='', settings={}) {
		settings = Sanitize.pointSettings(JSON.parse(JSON.stringify(settings)));

		if (this.data.scratchCtx === undefined)
			await this.init();

		const ctx = this.data.ctx;
		await ctx.setTextBaseline('bottom');

		const circle = await calculations.calculateCircle(this.data.scratchCtx, x, y, radius, this.data.metadata.width, settings.pointSize, settings.pointFontSize, settings.pointFont);

		await ctx.setFillStyle(settings.textColor.RGBA);
		await ctx.setStrokeStyle(settings.textColor.RGBA);
		await ctx.setFont(`${circle.fontSize}px "${settings.pointFont}"`);
		await ctx.fillText(name, circle.fontX, circle.fontY);

		await ctx.setLineWidth(circle.lineWidth);

		await ctx.beginPath();
		await ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
		await ctx.stroke();

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

		let outputUri = settings.uri ? settings.uri : (this.data.files.base.substring(0, this.data.files.base.length - (constants.pointShoot.fileFormats.IMAGERAW.length)));

		if (settings.acq.use) {
			const TWIPSWidth = this.data.metaConstants.width * constants.pictureSnapApp.TWIPSPERPIXEL; //(this.data.metaConstants.width / this.data.metadata.density) * constants.pictureSnapApp.TWIPSPERINCH;
			const TWIPSHeight = this.data.metaConstants.height * constants.pictureSnapApp.TWIPSPERPIXEL; //(this.data.metaConstants.height / this.data.metadata.density) * constants.pictureSnapApp.TWIPSPERINCH;

			const refPoint = this.data.points['1'];

			const pixelSize = await calculations.calculatePixelSize(this.data.magnification, this.data.metaConstants.width, settings.pixelSizeConstant);

			const xPos = parseFloat(refPoint.data.xposition.data) - (refPoint.x * pixelSize / 1000);
			const yPos = parseFloat(refPoint.data.yposition.data) - (refPoint.y * pixelSize / 1000);

			await fs.writeFile(outputUri + '.acq',
				[
					'[stage]',
					'ACQFileVersion="1"',
					'PictureSnap mode="1"',
					`X_Polarity="${parseInt(refPoint.data.beamx.data)}"`,
					`Y_Polarity="${parseInt(refPoint.data.beamy.data)}"`,
					'Stage_Units=mm',
					'ACQScreenDPI="1"',
					'Number of calibration points="3"',
					'Number of Z calibration points="3"',
					`Screen reference point1 (twips)="0,0"`,
					`Stage reference point1="${xPos},${yPos}"`,
					`Stage Z reference point1="${refPoint.data.zposition.data}"`,
					`Screen reference point2 (twips)="${TWIPSWidth},${TWIPSHeight}"`,
					`Stage reference point2="${xPos + (this.data.metaConstants.width * pixelSize / 1000)},${yPos + (this.data.metaConstants.height * pixelSize / 1000)}"`,
					`Stage Z reference point2="${refPoint.data.zposition.data}"`,
					`Screen reference point3 (twips)="${TWIPSWidth},0"`,
					`Stage reference point3="${xPos + (this.data.metaConstants.width * pixelSize / 1000)},${yPos}"`,
					`Stage Z reference point3="${refPoint.data.zposition.data}"`,
					'Screen Z reference point1 (dummy)="0"',
					'Screen Z reference point2 (dummy)="0"',
					'Screen Z reference point3 (dummy)="0"'
				].join('\n')
			);
		}

		if (settings.tiff.use || settings.webp.use || settings.png.use || settings.jpeg.use) {
			if (!settings.uri)
				outputUri = outputUri + (settings.acq.use ? '.jpg' : constants.pointShoot.fileFormats.OUTPUTIMAGE);

			const ext = outputUri.split('.').pop();
			switch (ext) {
				default:
				case 'tiff':
				case 'tif':
					await (await this.toSharp()).tiff(settings.tiff).toFile(outputUri);
					break;
				case 'jpeg':
				case 'jpg':
					await (await this.toSharp()).jpeg(settings.jpeg).toFile(outputUri);
					break;
				case 'png':
					await (await this.toSharp()).png(settings.png).toFile(outputUri);
					break;
				case 'webp':
					await (await this.toSharp()).webp(settings.webp).toFile(outputUri);
					break;
				case 'acq':
					break;
			}
			return outputUri;
		}
		return settings.uri;
	}

	async createBuffer(type=undefined, settings={}, points=[], layers=[]) {
		await this.create(type, settings, points, layers);
		settings = Sanitize.writeSettings(JSON.parse(JSON.stringify(settings)));

		if (settings.tiff.use)
			return (await this.toSharp()).tiff(settings.tiff).toBuffer();
		if (settings.jpeg.use)
			return (await this.toSharp()).jpeg(settings.jpeg).toBuffer();
		if (settings.png.use)
			return (await this.toSharp()).png(settings.png).toBuffer();
		if (settings.webp.use)
			return (await this.toSharp()).webp(settings.webp).toBuffer();
	}

	async createWrite(type=undefined, settings={}, points=[], layers=[]) {
		await this.create(type, settings, points, layers);
		await this.write(settings);
		return this;
	}

	async create(type=undefined, settings={}, points=[], layers=[]) {
		for (const layer of layers)
			await this.addLayer(layer);

		for (const {x, y, topX, topY, botX, botY, radius, polyPoints, name, type='spot', pointSettings=settings} of points)
			switch(type) {
				default:
				case 'spot':
					await this.addPoint(x, y, name, pointSettings);
					break;
				case 'rect':
					await this.addRectangle(topX, topY, botX, botY, name, pointSettings);
					break;
				case 'circle':
					await this.addCircle(x, y, radius, name, pointSettings);
					break;
				case 'polygon':
					await this.addPoly(polyPoints, name, pointSettings);
					break;
			}

		if (settings.addPoints && this.data.points)
			for (const point of Object.values(this.data.points))
				switch(point.type) {
					default:
					case 'spot':
						await this.addPoint(
							...point.pos,
							point.name,
							settings
						);
						break;
					case 'rect':
						await this.addRectangle(
							...point.pos,
							point.name,
							settings
						);
						break;
					case 'circle':
						await this.addCircle(
							...point.pos,
							point.name,
							settings
						);
						break;
					case 'polygon':
						await this.addPoly(
							point.pos,
							point.name,
							settings
						);
						break;
				}

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
			points: Object.values(this.data.points).reduce((points, {name, type, values, file, x, y, pos}) => {points[name] = {name, type, values, file, x, y, pos}; return points}, {}),
			layers: Object.values(this.data.layers).reduce((layers, {file, element}) => {layers[element] = {file, element}; return layers}, {}),
			entryFile: this.data.files.entry,
			image: {
				width: this.data.metadata.width,
				height: this.data.metadata.height
			},
			output: {
				width: this.data.scale.realWidth ? this.data.scale.realWidth : this.data.metadata.width,
				height: this.data.scale.realHeight ? this.data.scale.realHeight : this.data.metadata.height
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