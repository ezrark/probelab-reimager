const constants = require('./constants');

const Thermo = require('./thermo');

module.exports = class extends Thermo {
	constructor(entryFile, pixelSizeConstant = constants.PIXELSIZECONSTANT, Canvas, uri = undefined) {
		super(entryFile,
			entryFile.name.substring(0, entryFile.name.length - constants.pointShoot.fileFormats.ENTRY.length),
			pixelSizeConstant,
			Canvas,
			uri
		);
	}
};
