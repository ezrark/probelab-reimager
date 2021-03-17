const Context = require('./context');

module.exports = class Canvas {
	constructor(canvasRoot, uuid) {
		this.data = {
			uuid,
			canvasRoot
		};

		this.sendRemote = canvasRoot.sendRemote.bind(canvasRoot, uuid);
	}

	async delete() {

	}

	async getContext(contextId) {
		return new Context(this.data.canvasRoot, await this.sendRemote('getContext', [contextId]));
	}

	async getBuffer(type = 'raw', quality = 1.0) {
		return await this.sendRemote('getBuffer', [type, quality]);
	}
};