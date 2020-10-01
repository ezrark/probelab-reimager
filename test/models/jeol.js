const assert = require('assert');
const {describe, it, before} = require('mocha');

require('sharp');
const Canvas = require('canvas');
const CanvasRoot = require('../../canvas/canvasroot.js');
const NodeCanvas = require('../../canvas/nodecanvasmodule.js');
const JeolImage = require('../../jeolimage.js');

describe('Initialize', () => {
	it('should fail to initialize a non-existent file', () => {
		assert.throws(() => new JeolImage({name: '64.txt', uri: './test/data/jeol-images/64.txt'}, {}));
	});

	it('should fail to initialize a not-jeol file', () => {
		assert.throws(() => new JeolImage({name: '7.txt', uri: './test/data/jeol-images/7.txt'}, {}));
	});

	it('should create the correct base metadata for a txt entry file with a .tif', () => {
		const jeol = new JeolImage({name: '1.txt', uri: './test/data/jeol-images/1.txt'}, {});

		assert.deepStrictEqual(jeol.data, {
			'Canvas': {},
			'uuid': jeol.data.uuid,
			'uri': './test/data/jeol-images/',
			'name': '1',
			'scale': undefined,
			'scratchCanvas': undefined,
			'scratchCtx': undefined,
			'canvas': undefined,
			'ctx': undefined,
			'metaConstants': {},
			'integrity': true,
			'magnification': 430,
			'points': {},
			'layers': {},
			'files': {
				'base': './test/data/jeol-images/1.tif',
				'entry': './test/data/jeol-images/1.txt',
				'points': [],
				'layers': [
					{
						'element': 'base',
						'file': './test/data/jeol-images/1.tif',
						'cutoffHeight': 1920
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

	it('should create the correct base metadata for a txt entry file with a .jpg', () => {
		const jeol = new JeolImage({name: '5.txt', uri: './test/data/jeol-images/5.txt'}, {});

		assert.deepStrictEqual(jeol.data, {
			'Canvas': {},
			'uuid': jeol.data.uuid,
			'uri': './test/data/jeol-images/',
			'name': '5',
			'scale': undefined,
			'scratchCanvas': undefined,
			'scratchCtx': undefined,
			'canvas': undefined,
			'ctx': undefined,
			'metaConstants': {},
			'integrity': true,
			'magnification': 95,
			'points': {},
			'layers': {},
			'files': {
				'base': './test/data/jeol-images/5.jpg',
				'entry': './test/data/jeol-images/5.txt',
				'points': [],
				'layers': [
					{
						'element': 'base',
						'file': './test/data/jeol-images/5.jpg',
						'cutoffHeight': 960
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

	it('should create the correct base metadata for a txt entry file with a .bmp', () => {
		const jeol = new JeolImage({name: '4.txt', uri: './test/data/jeol-images/4.txt'}, {});

		assert.deepStrictEqual(jeol.data, {
			'Canvas': {},
			'uuid': jeol.data.uuid,
			'uri': './test/data/jeol-images/',
			'name': '4',
			'scale': undefined,
			'scratchCanvas': undefined,
			'scratchCtx': undefined,
			'canvas': undefined,
			'ctx': undefined,
			'metaConstants': {},
			'integrity': true,
			'magnification': 1800,
			'points': {},
			'layers': {},
			'files': {
				'base': './test/data/jeol-images/4.bmp',
				'entry': './test/data/jeol-images/4.txt',
				'points': [],
				'layers': [
					{
						'element': 'base',
						'file': './test/data/jeol-images/4.bmp',
						'cutoffHeight': 960
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

	it('should async initialize the correct base metadata for a txt entry file with a .tif', () => {
		const jeol = new JeolImage({name: '1.txt', uri: './test/data/jeol-images/1.txt'}, canvas);
		assert.doesNotThrow(jeol.init.bind(jeol));
	});

	it('should async initialize the correct base metadata for a txt entry file with a .jpg', () => {
		const jeol = new JeolImage({name: '5.txt', uri: './test/data/jeol-images/5.txt'}, canvas);
		assert.doesNotThrow(jeol.init.bind(jeol));
	});

	it('should async initialize the correct base metadata for a txt entry file with a .bmp', () => {
		const jeol = new JeolImage({name: '4.txt', uri: './test/data/jeol-images/4.txt'}, canvas);
		assert.doesNotThrow(jeol.init.bind(jeol));
	});
});

describe('Thermo Functions', () => {
	let jeolTif;
	let jeolJpg;
	let jeolBmp;
	let jeolBroken;

	before(async () => {
		const nodeCanvas = new NodeCanvas(Canvas);
		const canvas = new CanvasRoot(nodeCanvas);
		await canvas.init();
		jeolTif = new JeolImage({name: '2.txt', uri: './test/data/jeol-images/2.txt'}, canvas);
		jeolJpg = new JeolImage({name: '5.txt', uri: './test/data/jeol-images/5.txt'}, canvas);
		jeolBmp = new JeolImage({name: '4.txt', uri: './test/data/jeol-images/4.txt'}, canvas);
		jeolBroken = new JeolImage({name: 'Standard_BSE_640-800.txt', uri: './test/data/2020-09-16_JEOL bmp/Standard_BSE_640-800.txt'}, canvas);
		await jeolTif.init();
		await jeolJpg.init();
		await jeolBmp.init();
		await jeolBroken.init();
	});

	it('should correctly serialize', () => {
		assert.deepStrictEqual(jeolTif.serialize(), {
			"entryFile": "./test/data/jeol-images/2.txt",
			"image": {
				"height": 1920,
				"width": 2560
			},
			"integrity": true,
			"jeolFile": true,
			"layers": {
				"base": {
					"element": "base",
					"file": "./test/data/jeol-images/2.tif"
				},
				"solid": {
					"element": "solid",
					"file": ""
				}
			},
			"magnification": 370,
			"name": "2",
			"output": {
				"height": 2048,
				"width": 2560
			},
			"points": {},
			"uri": "./test/data/jeol-images/",
			"uuid": jeolTif.data.uuid
		});
		assert.deepStrictEqual(jeolJpg.serialize(), {
			"entryFile": "./test/data/jeol-images/5.txt",
			"image": {
				"height": 960,
				"width": 1280
			},
			"integrity": true,
			"jeolFile": true,
			"layers": {
				"base": {
					"element": "base",
					"file": "./test/data/jeol-images/5.jpg"
				},
				"solid": {
					"element": "solid",
					"file": ""
				}
			},
			"magnification": 95,
			"name": "5",
			"output": {
				"height": 1024,
				"width": 1280
			},
			"points": {},
			"uri": "./test/data/jeol-images/",
			"uuid": jeolJpg.data.uuid
		});
		assert.deepStrictEqual(jeolBmp.serialize(), {
			"entryFile": "./test/data/jeol-images/4.txt",
			"image": {
				"height": 960,
				"width": 1280
			},
			"integrity": true,
			"jeolFile": true,
			"layers": {
				"base": {
					"element": "base",
					"file": "./test/data/jeol-images/4.bmp"
				},
				"solid": {
					"element": "solid",
					"file": ""
				}
			},
			"magnification": 1800,
			"name": "4",
			"output": {
				"height": 1024,
				"width": 1280
			},
			"points": {},
			"uri": "./test/data/jeol-images/",
			"uuid": jeolBmp.data.uuid
		});
		assert.deepStrictEqual(jeolBroken.serialize(), {
			"entryFile": "./test/data/2020-09-16_JEOL bmp/Standard_BSE_640-800.txt",
			"image": {
				"height": 480,
				"width": 640
			},
			"integrity": true,
			"jeolFile": true,
			"layers": {
				"base": {
					"element": "base",
					"file": "./test/data/2020-09-16_JEOL bmp/Standard_BSE_640-800.bmp"
				},
				"solid": {
					"element": "solid",
					"file": ""
				}
			},
			"magnification": 43,
			"name": "Standard_BSE_640-800",
			"output": {
				"height": 512,
				"width": 640
			},
			"points": {},
			"uri": "./test/data/2020-09-16_JEOL bmp/",
			"uuid": jeolBroken.data.uuid
		});
	});

	it('should correctly clone', () => {
		let clone = jeolTif.clone(jeolTif.data.uuid);
		assert.deepStrictEqual(jeolTif.serialize(), clone.serialize());
		clone = jeolJpg.clone(jeolJpg.data.uuid);
		assert.deepStrictEqual(jeolJpg.serialize(), clone.serialize());
		clone = jeolBmp.clone(jeolBmp.data.uuid);
		assert.deepStrictEqual(jeolBmp.serialize(), clone.serialize());
		clone = jeolBroken.clone(jeolBroken.data.uuid);
		assert.deepStrictEqual(jeolBroken.serialize(), clone.serialize());
	});
});