export default class Context {
	constructor(canvasRoot, uuid) {
		this.sendRemote = canvasRoot.sendRemote.bind(canvasRoot, uuid);
	}

	async font() {

	}

	async drawImage() {

	}

	async fillRect() {

	}

	async fillText() {

	}

	async beginPath() {

	}

	async fill() {

	}

	async stroke() {

	}

	async ellipse() {

	}

	async set strokeStyle(style) {

	}

	async get strokeStyle() {

	}

	async set textBaseline(value) {

	}

	async get textBaseline() {

	}

	async set fillStyle(style) {

	}

	async get fillStyle() {

	}
}