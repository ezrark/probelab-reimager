const fs = require('fs').promises;

const Canvas = require('canvas');

const constants = require('./newConstants.json');
const NodeCanvas = require('./canvas/nodecanvasmodule.js');
const CanvasRoot = require('./canvas/canvasroot.js');
const InputStructure = require('./inputstructure.js');

const Directory = require('./models/directory.js');

module.exports = class ReImager {
	constructor({
		            canvas = new CanvasRoot(new NodeCanvas(Canvas)),
		            maxCanvases = 1,
		            inputStructure = new InputStructure(constants.inputStructures)
	            }) {
		this.data = {
			canvas,
			maxCanvases,
			inputStructure,

		};

		canvas.init();
	}

	async initializeDir(uri) {
		const file = {
			name,
			uri,
			stats: await fs.stat(uri)
		};

		const dir = new Directory(file, this, this.data.inputStructure);
		dir.refresh();
	}
};