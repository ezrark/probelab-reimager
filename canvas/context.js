module.exports = class Context {
	constructor(canvasRoot, uuid) {
		this.sendRemote = canvasRoot.sendRemote.bind(canvasRoot, uuid);
	}

	async getImageData(x, y, width, height) {
		return {
			data: await this.sendRemote('getImageData', [x, y, width, height])
		}
	}

	findLuminosity(x, y, width, height) {
		return this.sendRemote('findLuminosity', [x, y, width, height]);
	}

	drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
		return this.sendRemote('drawImage', [image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight]);
	}

	fillRect(x, y, width, height) {
		return this.sendRemote('fillRect', [x, y, width, height]);
	}

	fillText(text, x, y, maxWidth) {
		return this.sendRemote('fillText', [text, x, y, maxWidth]);
	}

	strokeRect(x, y, width, height) {
		return this.sendRemote('strokeRect', [x, y, width, height]);
	}

	beginPath() {
		return this.sendRemote('beginPath');
	}

	fill() {
		return this.sendRemote('fill');
	}

	stroke() {
		return this.sendRemote('stroke');
	}

	ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
		return this.sendRemote('ellipse', [x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise]);
	}

	measureText(text) {
		return this.sendRemote('measureText', [text]);
	}

	setFont(font) {
		return this.sendRemote('SETfont', font);
	}

	get font() {
		return this.sendRemote('GETfont');
	}

	setStrokeStyle(style) {
		return this.sendRemote('SETstrokeStyle', style);
	}

	get strokeStyle() {
		return this.sendRemote('GETstrokeStyle');
	}

	setTextBaseline(value) {
		return this.sendRemote('SETtextBaseline', value);
	}

	get textBaseline() {
		return this.sendRemote('GETtextBaseline');
	}

	setFillStyle(style) {
		return this.sendRemote('SETfillStyle', style);
	}

	get fillStyle() {
		return this.sendRemote('GETfillStyle');
	}

	setLineWidth(width) {
		return this.sendRemote('SETlineWidth', width);
	}

	get lineWidth() {
		return this.sendRemote('GETlineWidth');
	}
};