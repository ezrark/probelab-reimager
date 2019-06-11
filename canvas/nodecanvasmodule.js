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
							if (innerSpace)
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

	registerFont(uri, css) {
		return this.data.Canvas.registerFont(css.uri, css);
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
			if (type === 'raw')
				return fixBGRA(space.toBuffer(type, quality));
			return space.toBuffer(type, quality);
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