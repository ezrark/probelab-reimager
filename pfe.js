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
		const totalImages = await io.getPFEExpectedImages(this.data.uri);
		let imageInits = [];

		for (let imageNum = 0; imageNum < totalImages; imageNum++) {
			const image = new PFEImage(this, this.data.Canvas, imageNum + 1);
			imageInits.push(image.init());

			this.data.images.set(image.data.name, image);
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