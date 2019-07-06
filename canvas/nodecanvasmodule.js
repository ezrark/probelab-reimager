const EventEmitter = require('events');

const GenerateUuid = require('../generateuuid');

// Canvas modules have to be event emitters and allow all supported CanvasRoot, Canvas, and Context functions.
// Yes this is super vague as it's not very straight forward, basically allows you to host the Canvas element anywhere
//   and talk with it via websockets, IPC, or in the standalone case, node-canvas
module.exports = class NodeCanvas extends EventEmitter {
	constructor(Canvas) {
		super();

		this.data = {
			Canvas,
			namespaces: {
				root: this
			}
		}
	}

	async send(namespace, command, args, uuid) {
		const space = this.data.namespaces[namespace];
		if (space) {
			try {
				let data;
				if (command.startsWith('SET'))
					space[command.slice(3)] = args;
				else if (command.startsWith('GET'))
					data = await space[command.slice(3)];
				else
					switch(command) {
						case 'getImageData':
							data = (await space.getImageData(args[0], args[1], args[2], args[3])).data;
							break;
						case 'findLuminosity':
							const pixels = await space.getImageData(args[0], args[1], args[2], args[3]);
							let luminosity = 0;
							for (let i = 0; i < pixels.data.length; i += 4)
								luminosity += ((0.299 * pixels.data[i]) + (0.587 * pixels.data[i+1]) + (0.114 * pixels.data[i+2]))/768;
							data = luminosity/(pixels.data.length/4);
							break;
						case 'drawImage':
							data = await new Promise(async (resolve, reject) => {
								const image = new this.data.Canvas.Image();
								image.onload = async () => {
									resolve(await space.drawImage(image, ...args.filter(arg => typeof arg !== 'string' && arg !== undefined && arg !== null)));
								};
								image.src = args[0];
							});
							break;
						case 'getContext':
							data = await space.getContextOverride(...args);
							break;
						case 'getBuffer':
							data = await space.toBufferOverride(...args);
							break;
						case 'getOrCreateCanvas':
							const innerSpace = this.data.namespaces[args[0]];
							if (innerSpace && innerSpace.width === args[1] && innerSpace.height === args[2])
								data = args[0];
							else
								data = await this.createCanvas(args[1], args[2], args[0]);
							break;
						default:
							if (typeof args === 'object')
								data = await space[command].apply(space, args.filter(arg => arg !== undefined));
							else
								data = await space[command]();
					}
				this.emit('resolve', uuid, data);
			} catch(err) {
				this.emit('reject', uuid, err);
			}
		} else
			this.emit('reject', uuid, {message: 'Namespace does not exist'});
	}

	async registerFont(uri, css) {
		return await this.data.Canvas.registerFont(uri, css);
	}

	async createCanvas(width, height, uuid=undefined) {
		if (uuid === undefined)
			uuid = GenerateUuid.v4();
		const space = await this.data.Canvas.createCanvas(width, height);

		space.getContextOverride = contextId => {
			const uuid = GenerateUuid.v4();
			this.data.namespaces[uuid] = space.getContext(contextId);
			return uuid;
		};

		space.toBufferOverride = (type, quality) => {
			switch(type) {
				default:
					return {type: type, data: space.toBuffer(type, quality)};
				case 'raw':
					return {type: 'raw', data: fixBGRA(space.toBuffer('raw', quality))};
				case 'url':
					return space.toDataURL('image/png');
			}
		};

		this.data.namespaces[uuid] = space;
		return uuid;
	}
};

function fixBGRA(buffer) {
	for (let i = 0; buffer.length > i; i += 4) {
		const hold = buffer[i];
		buffer[i] = buffer[i + 2];
		buffer[i + 2] = hold;
	}

	return buffer;
}