const constants = require('./constants');
const io = require('./io');

const Thermo = require('./thermo');

module.exports = class extends Thermo {
	constructor(entryFile, Canvas, uri=undefined) {
		const directoryName = entryFile.uri.split('/').slice(-2, -1)[0];
		super(entryFile,
			directoryName.substring(0, directoryName.length - constants.extractedMap.fileFormats.DIRECTORYCONST.length),
			Canvas,
			uri
		);

		this.data.files.base = this.data.uri + this.data.name + constants.extractedMap.fileFormats.IMAGERAW;
	}

	updateFromDisk() {
		const entryData = io.readEntryFile(this.data.files.entry);

		this.data.files.base = this.data.uri + entryData.data.base;
		this.data.files.layers = entryData.layers;

		this.data.layers = entryData.layers.reduce((layers, data) => {
			data.file = this.data.uri + data.file;
			layers[data.element] = data;
			return layers;
		}, {});

		this.data.files.layers.push({
			element: 'base',
			file: this.data.files.base
		});

		this.data.data = io.readMASFile(this.data.uri + constants.extractedMap.fileFormats.SPECTRA);
		this.data.magnification = parseInt(this.data.data[constants.extractedMap.MAGNIFICATIONKEY].data);
	}
};