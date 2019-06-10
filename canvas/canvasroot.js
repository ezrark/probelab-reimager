import GenerateUuid from '../generateuuid';
import Canvas from './canvas';

export default class CanvasRoot {
	constructor(Canvas=undefined, remote=undefined) {
		this.data = {
			Canvas,
			remote,
			sentCommands: new Map()
		};

		if (remote) {
			remote.on('resolve', (uuid, data) => {
				const command = this.data.sentCommands.get(uuid);
				if (command) {
					this.data.sentCommands.delete(uuid);
					command.resolve(data);
				}
			});

			remote.on('reject', (uuid, data) => {
				const command = this.data.sentCommands.get(uuid);
				if (command) {
					this.data.sentCommands.delete(uuid);
					command.reject(data);
				}
			});
		}

	}

	async init() {
		await this.registerFont('fonts/OpenSans-Bold.ttf', { family: 'Open Sans Bold' });
		await this.registerFont('fonts/Comic Sans MS.ttf', { family: 'Comic Sans MS' });
	}

	sendRemote(command, args) {
		if (this.data.remote)
			return new Promise((resolve ,reject) => {
				const uuid = GenerateUuid.v4();
				this.data.sentCommands.set(uuid, {resolve, reject, uuid});
				this.data.remote.send(command, args, uuid);
			});
		return Promise.reject('No remote connected');
	}

	async registerFont(uri, css) {
		if (this.data.Canvas)
			await this.data.Canvas.registerFont(uri, css);
		else if (this.data.remote)
			await this.sendRemote('registerFont', [uri, css]);
	}

	async createCanvas(width, height) {
		if (this.data.Canvas)
			return new Canvas(this.data.Canvas.createCanvas(width, height));
		else if (this.data.remote)
			return new Canvas(undefined, await this.sendRemote('createCanvas', [width, height]));
	}
}
