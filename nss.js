const constants = require('./constants');

const path = require('path');

const Thermo = require('./thermo');

module.exports = class extends Thermo {
	constructor(entryFile, pixelSizeConstant = constants.PIXELSIZECONSTANT, Canvas, uri = undefined) {
		super(entryFile,
			path.parse(entryFile.name).name,
			pixelSizeConstant,
			Canvas,
			uri
		);
	}
};
