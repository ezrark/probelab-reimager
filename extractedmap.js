const constants = require('./constants');
const io = require('./io');

const Thermo = require('./thermo');

module.exports = class extends Thermo {
	constructor(entryFile, uri=undefined) {
		const directoryName = entryFile.uri.split('/').slice(-2, -1)[0];
		super(entryFile, directoryName.substring(0, directoryName.length - constants.extractedMap.fileFormats.DIRECTORYCONST.length), uri);

		this.data.files.image = this.data.uri + this.data.name + constants.extractedMap.fileFormats.IMAGERAW;
	}

	updateFromDisk() {
		this.data.data = io.readMASFile(this.data.files.entry);
		this.data.magnification = parseInt(this.data.data[constants.extractedMap.MAGNIFICATIONKEY].data);
	}
};