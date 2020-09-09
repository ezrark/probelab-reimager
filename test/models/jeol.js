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
			'scale': {},
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
			'scale': {},
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
			'scale': {},
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
