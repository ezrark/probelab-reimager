const GeneralImage = require('../models/image.js');

module.exports = class ThermoImage extends GeneralImage {
	constructor(imageUri, reimager, needs=[], [metadata]) {
		if (needs.length > 0 && metadata.getName() !== 'Extracted Spectrum')
			throw 'Invalid ThermoImage Setup';
		else if (needs.length === 0 && metadata.getName() === 'Extracted Spectrum')
			throw 'Invalid ThermoImage Setup';

		const {x=0, y=0, z=0} = {};
		super(imageUri, reimager, metadata, {x, y, z});
	}
};