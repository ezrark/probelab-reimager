const GeneralImage = require('../models/image.js');

module.exports = class JeolImage extends GeneralImage {
	constructor({uri, stats}, reimager, needs=[], [tif]) {
		if (tif.getName() !== uri.split('/').pop().split('.')[0])
			throw 'Invalid JeolImage Setup';

		const {x=0, y=0, z=0} = {};

		const position = {
			x: x !== undefined ? x : metadata.cm_stage_pos.slice(0, 1),
			y: y !== undefined ? y : metadata.cm_stage_pos.slice(1, 2),
			z: z !== undefined ? z : metadata.cm_stage_pos.slice(2, 3)
		};

		super({uri, stats}, reimager, undefined, position);
	}
};