const GeneralImage = require('../models/image.js');

module.exports = class PfeImage extends GeneralImage {
	constructor({uri, stats}, reimager, needs, [metadata]) {
		if (metadata.getName() !== uri.split('/').pop().split('.')[0])
			throw 'Invalid PFE Setup';

		const {x=0, y=0, z=0} = {};
		super({uri, stats}, reimager, metadata, {x, y, z});
	}
};