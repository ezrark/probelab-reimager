const GeneralImage = require('../models/image.js');

module.exports = class ThermoImage extends GeneralImage {
	constructor(imageUri, reimager, metadata, {x=0, y=0, z=0}) {
		super(imageUri, reimager, metadata, {x, y, z});
	}
};