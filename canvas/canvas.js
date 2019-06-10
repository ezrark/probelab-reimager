import Context from './context';

export default class Canvas {
	constructor(canvas=undefined, remoteCanvas=undefined) {
		this.data = {
			canvas,
			remoteCanvas
		}
	}

	getContext(contextId) {
		if (this.data.canvas)
			this.data.canvas.getContext(contextId);
		else
			throw 'No canvas created';
	}

	toBuffer(type='raw', quality=0.9) {
		switch(type) {
			default:
			case 'raw':
				if (this.data.canvas)
					return fixBGRA(this.data.canvas.toBuffer(type));
				else if (this.data.remoteCanvas)
					return;
				break;
			case 'png':
				if (this.data.canvas)
					return this.data.canvas.createPNGStream();
				else if (this.data.remoteCanvas)
					return;
				break;
			case 'jpg':
				if (this.data.canvas)
					return this.data.canvas.createJPEGStream({quality});
				else if (this.data.remoteCanvas)
					return;
				break;
		}
	}
}

function fixBGRA(buffer) {
	for (let i = 0; buffer.length > i; i += 4) {
		const hold = buffer[i];
		buffer[i] = buffer[i + 2];
		buffer[i + 2] = hold;
	}

	return buffer;
}