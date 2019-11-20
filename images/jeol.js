const GeneralImage = require('../models/image.js');
const JeolText = require('../files/jeoltext.js');

module.exports = class JeolImage extends GeneralImage {
	constructor(imageUri, reimager, [tif], [metadata]) {
		const {x=undefined, y=undefined, z=undefined} = {};

		const position = {
			x: x !== undefined ? x : metadata.cm_stage_pos.slice(0, 1),
			y: y !== undefined ? y : metadata.cm_stage_pos.slice(1, 2),
			z: z !== undefined ? z : metadata.cm_stage_pos.slice(2, 3)
		};

		super(imageUri, reimager, metadata, position);
	}
};