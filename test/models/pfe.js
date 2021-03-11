const assert = require('assert');
const {describe, it, before} = require('mocha');

require('sharp');
const Canvas = require('canvas');
const CanvasRoot = require('../../canvas/canvasroot.js');
const NodeCanvas = require('../../canvas/nodecanvasmodule.js');
const PFEImage = require('../../pfeimage.js');

describe('Initialize', () => {
	it('should fail to initialize a non-existent file', () => {
		assert.throws(() => new PFEImage({data: {name: '2019-08-12_HAHA_Nolen.MDB', uri: './test/data/pfe-mdb/2019-08-12_HAHA_Nolen.MDB'}}, {}, 1));
	});

	it('should fail to initialize a MDB without a BIM file', () => {
		assert.throws(() => new PFEImage({data: {name: '2019-08.MDB', uri: './test/data/pfe-mdb/2019-08.MDB'}}, {}, 1));
	});

	it('should create the correct base metadata for a valid MDB and image index', () => {
		const pfe = new PFEImage({data: {name: '2019-08-12_Nolen.MDB', uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'}}, {}, 1);

		assert.deepStrictEqual(pfe.data, {
			'Canvas': {},
			'uuid': pfe.data.uuid,
			'uri': './test/data/pfe-mdb/',
			'name': '2019-08-12_Nolen.MDB - 1',
			'scale': undefined,
			'scratchCanvas': undefined,
			'scratchCtx': undefined,
			'canvas': undefined,
			'ctx': undefined,
			'metaConstants': {},
			'integrity': true,
			'magnification': 40,
			'points': {},
			'layers': {},
			'files': {
				'base': './test/data/pfe-mdb/2019-08-12_Nolen.MDB?1',
				'entry': './test/data/pfe-mdb/2019-08-12_Nolen.MDB?1',
				'points': [],
				'layers': [
					{
						'element': 'base',
						'file': './test/data/pfe-mdb/2019-08-12_Nolen.MDB?1'
					},
					{
						'element': 'solid',
						'file': ''
					}
				]
			},
			'metadata': {},
			'data': {
				'point': {},
				'map': {}
			},
			'outputFormat': '.png'
		});
	});
});

describe('Async Initialize', async () => {
	let canvas;

	before(async () => {
		const nodeCanvas = new NodeCanvas(Canvas);
		canvas = new CanvasRoot(nodeCanvas);
		await canvas.init();
	});

	it('should async initialize the correct base metadata for a valid MDB and image index', () => {
		const pfe = new PFEImage({data: {name: '2019-08-12_Nolen.MDB', uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'}}, canvas, 1);
		assert.doesNotThrow(pfe.init.bind(pfe));
	});
});

describe('Thermo Functions', () => {
	let pfe;

	before(async () => {
		const nodeCanvas = new NodeCanvas(Canvas);
		const canvas = new CanvasRoot(nodeCanvas);
		await canvas.init();
		pfe = new PFEImage({data: {name: '2019-08-12_Nolen.MDB', uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'}}, canvas, 1);
		await pfe.init();
	});

	it('should correctly serialize', () => {
		assert.deepStrictEqual(pfe.serialize(), {
			"entryFile": "./test/data/pfe-mdb/2019-08-12_Nolen.MDB?1",
			"image": {
				"height": 768,
				"width": 1024
			},
			"integrity": true,
			"jeolFile": false,
			"layers": {
				"base": {
					"element": "base",
					"file": "./test/data/pfe-mdb/2019-08-12_Nolen.MDB?1"
				},
				"solid": {
					"element": "solid",
					"file": ""
				}
			},
			"magnification": 160,
			"name": "2019-08-12_Nolen.MDB - 1",
			"output": {
				"height": 768,
				"width": 1024
			},
			"points": {
				"125": {
					"file": undefined,
					"name": 125,
					"pos": [
						480,
						384
					],
					"type": "spot",
					"values": [
						0.33566951751708984,
						0.2691471576690674,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 480,
					"y": 384
				},
				"126": {
					"file": undefined,
					"name": 126,
					"pos": [
						400,
						346
					],
					"type": "spot",
					"values": [
						0.27945947647094727,
						0.24294710159301758,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 400,
					"y": 346
				},
				"127": {
					"file": undefined,
					"name": 127,
					"pos": [
						405,
						398
					],
					"type": "spot",
					"values": [
						0.28276968002319336,
						0.2794370651245117,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 405,
					"y": 398
				},
				"128": {
					"file": undefined,
					"name": 128,
					"pos": [
						336,
						439
					],
					"type": "spot",
					"values": [
						0.23475933074951172,
						0.30803704261779785,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 336,
					"y": 439
				},
				"129": {
					"file": undefined,
					"name": 129,
					"pos": [
						258,
						479
					],
					"type": "spot",
					"values": [
						0.18075942993164062,
						0.336137056350708,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 258,
					"y": 479
				},
				"130": {
					"file": undefined,
					"name": 130,
					"pos": [
						229,
						417
					],
					"type": "spot",
					"values": [
						0.16026926040649414,
						0.2927370071411133,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 229,
					"y": 417
				},
				"131": {
					"file": undefined,
					"name": 131,
					"pos": [
						487,
						226
					],
					"type": "spot",
					"values": [
						0.34045934677124023,
						0.15854716300964355,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 487,
					"y": 226
				},
				"132": {
					"file": undefined,
					"name": 132,
					"pos": [
						517,
						170
					],
					"type": "spot",
					"values": [
						0.36096954345703125,
						0.11954712867736816,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 517,
					"y": 170
				},
				"133": {
					"file": undefined,
					"name": 133,
					"pos": [
						443,
						175
					],
					"type": "spot",
					"values": [
						0.30946969985961914,
						0.1230471134185791,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 443,
					"y": 175
				},
				"134": {
					"file": undefined,
					"name": 134,
					"pos": [
						630,
						569
					],
					"type": "spot",
					"values": [
						0.4402594566345215,
						0.3992471694946289,
						0.7147588729858398,
						0.5382542610168457
					],
					"x": 630,
					"y": 569
				}
			},
			"uri": "./test/data/pfe-mdb/",
			"uuid": pfe.data.uuid
		});
	});

	it('should correctly clone', () => {
		let clone = pfe.clone(pfe.data.uuid);
		assert.deepStrictEqual(pfe.serialize(), clone.serialize());
	});
});