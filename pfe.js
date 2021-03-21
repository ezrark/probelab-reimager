const io = require('./io.js');
const PFEImage = require('./pfeimage.js');

module.exports = class PFE {
	constructor(entryFile, Canvas) {
		this.data = {
			uri: entryFile.uri,
			name: entryFile.name,
			Canvas,
			images: new Map()
		};
	}

	async init() {
		const images = await io.readPFEEntry(this.data.uri);
		let imageInits = [];

		let i = 0;
		for (let imageData of images) {
			i++;
			const image = new PFEImage(this, this.data.Canvas, imageData, i);
			imageInits.push(image.init());

			this.data.images.set(i, image);
		}

		await Promise.all(imageInits);

		return Array.from(this.data.images.values());
	}

	getImage(num) {
		return this.data.images.get(num);
	}

	getImages() {
		return this.data.images;
	}
};