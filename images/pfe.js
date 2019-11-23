const GeneralImage = require('../models/image.js');

module.exports = class PfeImage extends GeneralImage {
	constructor(imageUri, reimager, needs, [metadata]) {
		if (metadata.getName() !== imageUri.split('/').pop().split('.')[0])
			throw 'Invalid PFE Setup';

		const {x=0, y=0, z=0} = {};
		super(imageUri, reimager, metadata, {x, y, z});
	}
};