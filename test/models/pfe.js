const path = require('path');
const assert = require('assert');
const {describe, it, before} = require('mocha');

require('sharp');
const Canvas = require('canvas');
const CanvasRoot = require('../../canvas/canvasroot.js');
const NodeCanvas = require('../../canvas/nodecanvasmodule.js');
const PFE = require('../../pfe.js');
const PFEImage = require('../../pfeimage.js');

describe('Initialize', () => {

	it('should fail to initialize a non-existent file', () => {
		assert.rejects(async () => {
			const pfe = new PFE({
				name: '2019-08-12_HAHA_Nolen.MDB',
				uri: './test/data/pfe-mdb/2019-08-12_HAHA_Nolen.MDB'
			}, undefined);
			await pfe.init();
		});
	});

	it('should fail to initialize a MDB without a BIM file', () => {
		assert.rejects(async () => {
			const pfe = new PFE({
				name: '2019-08.MDB',
				uri: './test/data/pfe-mdb/2019-08.MDB'
			}, undefined);
			await pfe.init();
		});
	});

	it('should create the correct base metadata for a valid MDB and image index', async () => {
		let pfe = new PFEImage({
			data: {
				name: '2019-08-12_Nolen.MDB',
				uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'
			}
		}, {}, {
			image: {
				ImageMag: 40
			},
			points: {}
		}, 1);

		assert.deepStrictEqual(pfe.data, {
			'Canvas': {},
			'uuid': pfe.data.uuid,
			'uri': path.resolve('./test/data/pfe-mdb/'),
			'name': '2019-08-12_Nolen.MDB - 1',
			'scale': undefined,
			'scratchCanvas': undefined,
			'scratchCtx': undefined,
			'canvas': undefined,
			'ctx': undefined,
			'metaConstants': {},
			'integrity': true,
			'magnification': 40,
			'rawImageData': {
				ImageMag: 40
			},
			'points': {},
			'layers': {},
			'files': {
				'base': path.resolve('./test/data/pfe-mdb/2019-08-12_Nolen.MDB?1'),
				'entry': path.resolve('./test/data/pfe-mdb/2019-08-12_Nolen.MDB?1'),
				'points': [],
				'layers': [
					{
						'element': 'base',
						'file': path.resolve('./test/data/pfe-mdb/2019-08-12_Nolen.MDB?1')
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

	it('should async initialize the correct base metadata for a valid MDB', () => {
		const pfe = new PFE({
			name: '2019-08.MDB',
			uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'
		}, undefined);
		assert.doesNotThrow(pfe.init.bind(pfe));
	});
});

describe('Thermo Functions', () => {
	let pfe;

	before(async () => {
		const nodeCanvas = new NodeCanvas(Canvas);
		const canvas = new CanvasRoot(nodeCanvas);
		await canvas.init();
		pfe = new PFE({
			name: '2019-08-12_Nolen.MDB',
			uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'
		}, canvas);
		await pfe.init();
	}).timeout(10000);

	it('should correctly serialize', () => {
		assert.deepStrictEqual(pfe.getImage(1).serialize(), {
			'entryFile': path.resolve('./test/data/pfe-mdb/2019-08-12_Nolen.MDB?1'),
			'image': {
				'height': 768,
				'width': 1024
			},
			'integrity': true,
			'jeolFile': false,
			'layers': {
				'base': {
					'element': 'base',
					'file': path.resolve('./test/data/pfe-mdb/2019-08-12_Nolen.MDB?1')
				},
				'solid': {
					'element': 'solid',
					'file': ''
				}
			},
			'magnification': 160,
			'name': '2019-08-12_Nolen.MDB - 1',
			'output': {
				'height': 768,
				'width': 1024
			},
			'points': {
				'125': {
					'file': undefined,
					'name': 125,
					'pos': [
						480,
						384
					],
					'type': 'spot',
					'values': [
						0.3356695,
						0.2691472,
						0.7147589,
						0.5382543
					],
					'x': 480,
					'y': 384
				},
				'126': {
					'file': undefined,
					'name': 126,
					'pos': [
						400,
						346
					],
					'type': 'spot',
					'values': [
						0.2794595,
						0.2429471,
						0.7147589,
						0.5382543
					],
					'x': 400,
					'y': 346
				},
				'127': {
					'file': undefined,
					'name': 127,
					'pos': [
						405,
						398
					],
					'type': 'spot',
					'values': [
						0.2827697,
						0.2794371,
						0.7147589,
						0.5382543
					],
					'x': 405,
					'y': 398
				},
				'128': {
					'file': undefined,
					'name': 128,
					'pos': [
						336,
						439
					],
					'type': 'spot',
					'values': [
						0.2347593,
						0.3080371,
						0.7147589,
						0.5382543
					],
					'x': 336,
					'y': 439
				},
				'129': {
					'file': undefined,
					'name': 129,
					'pos': [
						258,
						479
					],
					'type': 'spot',
					'values': [
						0.1807594,
						0.3361371,
						0.7147589,
						0.5382543
					],
					'x': 258,
					'y': 479
				},
				'130': {
					'file': undefined,
					'name': 130,
					'pos': [
						229,
						417
					],
					'type': 'spot',
					'values': [
						0.1602693,
						0.292737,
						0.7147589,
						0.5382543
					],
					'x': 229,
					'y': 417
				},
				'131': {
					'file': undefined,
					'name': 131,
					'pos': [
						487,
						226
					],
					'type': 'spot',
					'values': [
						0.3404594,
						0.1585472,
						0.7147589,
						0.5382543
					],
					'x': 487,
					'y': 226
				},
				'132': {
					'file': undefined,
					'name': 132,
					'pos': [
						517,
						170
					],
					'type': 'spot',
					'values': [
						0.3609696,
						0.1195472,
						0.7147589,
						0.5382543
					],
					'x': 517,
					'y': 170
				},
				'133': {
					'file': undefined,
					'name': 133,
					'pos': [
						443,
						175
					],
					'type': 'spot',
					'values': [
						0.3094697,
						0.1230471,
						0.7147589,
						0.5382543
					],
					'x': 443,
					'y': 175
				},
				'134': {
					'file': undefined,
					'name': 134,
					'pos': [
						630,
						569
					],
					'type': 'spot',
					'values': [
						0.4402595,
						0.3992472,
						0.7147589,
						0.5382543
					],
					'x': 630,
					'y': 569
				}
			},
			'uri': path.resolve('./test/data/pfe-mdb/'),
			'uuid': pfe.getImage(1).data.uuid
		});
	});

	it('should correctly clone', () => {
		let clone = pfe.getImage(1).clone(pfe.getImage(1).data.uuid);
		assert.deepStrictEqual(pfe.getImage(1).serialize(), clone.serialize());
	});
});