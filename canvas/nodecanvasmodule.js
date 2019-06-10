const Canvas = require('canvas');



function fixBGRA(buffer) {
	for (let i = 0; buffer.length > i; i += 4) {
		const hold = buffer[i];
		buffer[i] = buffer[i + 2];
		buffer[i + 2] = hold;
	}

	return buffer;
}