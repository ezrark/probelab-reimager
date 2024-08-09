const GenerateUuid = require('../generateuuid');
const Canvas = require('./canvas');
const fs = require('fs');

module.exports = class CanvasRoot {
	constructor(remote) {
		this.data = {
			remote,
			sentCommands: new Map()
		};

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

	async init() {
		// await this.registerFont('./fonts/ARIAL-Bold.ttf', {family: 'Open Sans Bold'});
		await this.registerFont('./fonts/ARIALBD.TTF', {family: 'Arial Bold'});
		await this.registerFont('${__dirname}/../fonts/Comic Sans MS.ttf', {family: 'Comic Sans MS'});
	}

	sendRemote(namespace, command, args = []) {
		return new Promise((resolve, reject) => {
			const uuid = GenerateUuid.v4();
			this.data.sentCommands.set(uuid, {resolve, reject, uuid});
			this.data.remote.send(namespace, command, args, uuid);
		});
	}

	async getOrCreateCanvas(uuid, width = 300, height = 300) {
		return new Canvas(this, await this.sendRemote('root', 'getOrCreateCanvas', [uuid, width, height]));
	}

	async registerFont(uri, css) {
		await this.sendRemote('root', 'registerFont', [uri, css]);
	}

	async createCanvas(width, height) {
		return new Canvas(this, await this.sendRemote('root', 'createCanvas', [width, height]));
	}
};