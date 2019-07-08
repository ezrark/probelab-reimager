const constants = require('./constants');

const Thermo = require('./thermo');

module.exports = class extends Thermo {
	constructor(entryFile, Canvas, uri=undefined) {
		const directoryName = entryFile.uri.split('/').slice(-2, -1)[0];
		super(entryFile,
			directoryName.substring(0, directoryName.length - constants.extractedMap.fileFormats.DIRECTORYCONST.length),
			Canvas,
			uri
		);
	}
};
