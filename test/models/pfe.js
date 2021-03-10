const assert = require('assert');
const {describe, it, before} = require('mocha');

require('sharp');
const Canvas = require('canvas');
const CanvasRoot = require('../../canvas/canvasroot.js');
const NodeCanvas = require('../../canvas/nodecanvasmodule.js');
const PFE = require('../../pfe.js');

describe('#readJeolEntry', () => {
	let pfeBase;

	before(async () => {
		const nodeCanvas = new NodeCanvas(Canvas);
		const canvas = new CanvasRoot(nodeCanvas);
		await canvas.init();
		pfeBase = new PFE({name: '2019-08-12_Nolen.MDB', uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'}, canvas);
		await pfeBase.init();
	});

	it('should read a .txt file', async () => {

	});
});