import Context from './context';

export default class Canvas {
	constructor(canvasRoot, uuid) {
		this.data = {
			uuid,
			canvasRoot
		};

		this.sendRemote = canvasRoot.sendRemote.bind(canvasRoot, uuid);
	}

	async getContext(contextId) {
		return new Context(this.data.canvasRoot, await this.sendRemote('getContext', [contextId]));
	}

	async toBuffer(type='raw', quality=0.9) {
		return await this.sendRemote('toBuffer', [type, quality]);
	}
}