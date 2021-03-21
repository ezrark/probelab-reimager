const sharp = require('sharp');

const constants = require('./constants.json');
const io = require('./io.js');
const Thermo = require('./thermo.js');

module.exports = class extends Thermo {
	constructor(pfe, Canvas, image, imageIndex) {
		super({uri: pfe.data.uri + `?${imageIndex}`},
			pfe.data.name + ` - ${imageIndex}`,
			Canvas
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

		return await this.internalInit();
	}

	serialize() {
		return this.internalSerialize({
			name: this.data.name
		});
	}
};
