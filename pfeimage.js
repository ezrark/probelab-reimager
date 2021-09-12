const sharp = require('sharp');

const constants = require('./constants.json');
const io = require('./io.js');
const Thermo = require('./thermo.js');
const calculations = require('./calculations');

module.exports = class extends Thermo {
	constructor(pfe, Canvas, image, imageIndex, uuid = undefined) {
		super({uri: pfe.data.uri + `?${imageIndex}`},
			pfe.data.name + ` - ${imageIndex}`,
			0,
			Canvas,
			undefined,
			uuid
		);

		const {image: imageData, points} = image;

		this.data.points = points;
		this.data.files.points = Object.keys(points);
		this.data.magnification = imageData.ImageMag;
		this.data.rawImageData = imageData;
	}

	staticInit() {
		io.checkBIMExists(this.data.files.entry.split('?')[0]);

		this.data.files.base = this.data.files.entry;
		this.data.files.layers = [{
			element: 'base',
			file: this.data.files.base
		}, {
			element: 'solid',
			file: ''
		}];

		//this.data.points = {};
		this.data.files.points = [];
		this.data.data.map = {};
		//this.data.magnification = 40;
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
					const image = sharp(await io.readBIM(this.data.files.base), {
						raw: {
							width: this.data.rawImageData.ImageIx,
							height: this.data.rawImageData.ImageIy,
							channels: 1
						}
					}).flip();

					this.data.layers['base'] = {
						element,
						file: this.data.files.base,
						image,
						metadata: await image.metadata()
					};

					const baseUri = this.data.uri.split('/');
					baseUri.pop();

					this.data.files.base = `${baseUri.join('/')}/${this.data.name}_${this.data.rawImageData.ImageTitle}_${this.data.rawImageData.ImageNumber}`;
				}
			}));
		}

		// Set metadata to be in um
		this.data.stageMetadata = {
			pixelSize: parseFloat((this.data.rawImageData.pixelSize).toFixed(10)),
			maxX: parseFloat((this.data.rawImageData.ImageXMax * 1000).toFixed(15)),
			minX: parseFloat((this.data.rawImageData.ImageXMin * 1000).toFixed(15)),
			maxY: parseFloat((this.data.rawImageData.ImageYMax * 1000).toFixed(15)),
			minY: parseFloat((this.data.rawImageData.ImageYMin * 1000).toFixed(15))
		};

		const xDiffToCenter = this.data.rawImageData.xDiff / 2 * 1000;
		const yDiffToCenter = this.data.rawImageData.yDiff / 2 * 1000;

		this.data.stageMetadata.centerX = this.data.stageMetadata.minX + (this.data.rawImageData.xDirection === constants.stageOrientation.direction.REVERSE ? -xDiffToCenter : xDiffToCenter);
		this.data.stageMetadata.centerY = this.data.stageMetadata.minY + (this.data.rawImageData.xDirection === constants.stageOrientation.direction.REVERSE ? -yDiffToCenter : -yDiffToCenter);

		return await this.internalInit();
	}

	serialize() {
		return this.internalSerialize({
			name: this.data.name
		});
	}
};
