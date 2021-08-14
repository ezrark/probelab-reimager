const sharp = require('sharp');

const constants = require('./constants.json');
const io = require('./io.js');
const Thermo = require('./thermo.js');
const calculations = require('./calculations');

module.exports = class extends Thermo {
	constructor(pfe, Canvas, image, imageIndex, uuid = undefined) {
		super({uri: pfe.data.uri + `?${imageIndex}`},
			pfe.data.name + ` - ${imageIndex}`,
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

		this.data.points = Object.values(this.data.points).reduce((points, point) => {
			const pos = calculations.pointToXYTest(point, {
				width: this.data.layers.base.metadata.width,
				height: this.data.layers.base.metadata.height,
				x: [this.data.rawImageData.ImageXMin, this.data.rawImageData.ImageXMax],
				y: [this.data.rawImageData.ImageYMin, this.data.rawImageData.ImageYMax],
				xDiff: this.data.rawImageData.xDiff,
				yDiff: this.data.rawImageData.yDiff
			});
			point.x1 = pos[0];
			point.y1 = pos[1];
			points[point.name] = point;

			return points;
		}, {});

		return await this.internalInit();
	}

	serialize() {
		return this.internalSerialize({
			name: this.data.name
		});
	}
};
