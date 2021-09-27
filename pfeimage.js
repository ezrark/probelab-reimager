const sharp = require('sharp');

const constants = require('./constants.json');
const io = require('./io.js');
const Thermo = require('./thermo.js');
const calculations = require('./calculations');

module.exports = class extends Thermo {
	constructor(pfe, Canvas, image, imageIndex, uuid = undefined) {
		super({uri: pfe.data.uri + `?${imageIndex}`},
			image.image.ImageTitle,
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

		let maxX = this.data.rawImageData.ImageXMax;
		let minX = this.data.rawImageData.ImageXMin;
		let maxY = this.data.rawImageData.ImageYMax;
		let minY = this.data.rawImageData.ImageYMin;

		if (this.data.rawImageData.xDirection === constants.stageOrientation.direction.REVERSE) {
			maxX = this.data.rawImageData.ImageXMin;
			minX = this.data.rawImageData.ImageXMax;
		}

		if (this.data.rawImageData.yDirection === constants.stageOrientation.direction.REVERSE) {
			maxY = this.data.rawImageData.ImageYMin;
			minY = this.data.rawImageData.ImageYMax;
		}

		// Set metadata to be in um
		this.data.stageMetadata = {
			x: {
				pixelSize: parseFloat((this.data.rawImageData.pixelSizeX).toFixed(10)),
				max: parseFloat((maxX * 1000).toFixed(15)),
				min: parseFloat((minX * 1000).toFixed(15)),
				center: 0
			},
			y: {
				pixelSize: parseFloat((this.data.rawImageData.pixelSizeY).toFixed(10)),
				max: parseFloat((maxY * 1000).toFixed(15)),
				min:parseFloat((minY * 1000).toFixed(15)),
				center: 0
			}
		};

		const xDiffToCenter = this.data.rawImageData.xDiff / 2 * 1000;
		const yDiffToCenter = this.data.rawImageData.yDiff / 2 * 1000;

		this.data.stageMetadata.x.center = this.data.stageMetadata.x.min + xDiffToCenter;
		this.data.stageMetadata.y.center = this.data.stageMetadata.y.min +  yDiffToCenter;

		return await this.internalInit();
	}

	serialize() {
		return this.internalSerialize({
			name: this.data.name
		});
	}
};
