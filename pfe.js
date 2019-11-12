const io = require('./io.js');
const PFEImage = require('./pfeimage.js');

class PFE {
	constructor(uri, Canvas) {
		this.data = {
			uri,
			Canvas,
			images: new Map(),
			points: new Map()
		};
	}

	async init() {
		const {images, points} = await io.readPFE(this.data.uri);
		this.data.images = Array.from(images.keys()).map(imageNum => new PFEImage(this, this.data.Canvas, imageNum));
		this.data.points = points;
	}

	getImage(num) {
		return this.data.images.get(num);
	}

	getImages() {
		return this.data.images;
	}

	getPoints() {
		return this.data.points;
	}
}