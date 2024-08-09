const path = require('path');
const assert = require('assert');
const {describe, it, before} = require('mocha');

require('sharp');
const Canvas = require('canvas');
const CanvasRoot = require('../../canvas/canvasroot.js');
const NodeCanvas = require('../../canvas/nodecanvasmodule.js');
const PointShoot = require('../../pointshoot.js');

describe('Initialize', () => {
	it('should fail to initialize a non-existent file', () => {
		assert.throws(() => new PointShoot({name: 'ahhhhh.test', uri: './test/data/64.p_s'}, {}));
	});

	it('should create the correct base metadata for a PS entry file', () => {
		const ps = new PointShoot({name: '64.p_s', uri: './test/data/64.PS.EDS/64.p_s'}, {});

		assert.deepStrictEqual(ps.data, {
			'Canvas': {},
			'uuid': ps.data.uuid,
			'uri': path.resolve('./test/data/64.PS.EDS/'),
			'name': '64',
			'scale': undefined,
			'scratchCanvas': undefined,
			'scratchCtx': undefined,
			'canvas': undefined,
			'ctx': undefined,
			'metaConstants': {},
			'integrity': true,
			'magnification': 40,
			'points': {
				'1': {
					'type': 'spot',
					'file': '64_pt1.psmsa',
					'values': [
						394,
						241,
						731,
						547
					],
					'data': {
						'format': {
							'units': '',
							'data': 'EMSA/MAS Spectral Data File'
						},
						'version': {
							'units': '',
							'data': '1.0'
						},
						'title': {
							'units': '',
							'data': '64(1)_pt1'
						},
						'date': {
							'units': '',
							'data': '29-MAY-2019'
						},
						'time': {
							'units': '',
							'data': '11'
						},
						'owner': {
							'units': '',
							'data': ''
						},
						'npoints': {
							'units': '',
							'data': '1024'
						},
						'ncolumns': {
							'units': '',
							'data': '1'
						},
						'xunits': {
							'units': '',
							'data': 'keV'
						},
						'yunits': {
							'units': '',
							'data': 'Intensity'
						},
						'datatype': {
							'units': '',
							'data': 'XY'
						},
						'xperchan': {
							'units': '',
							'data': '0.010000000'
						},
						'offset': {
							'units': '',
							'data': '0.000000000'
						},
						'choffset': {
							'units': '',
							'data': '0.000000'
						},
						'signaltype': {
							'units': '',
							'data': 'EDS'
						},
						'xlabel': {
							'units': '',
							'data': 'X-Ray Energy'
						},
						'ylabel': {
							'units': '',
							'data': 'X-Ray Intensity'
						},
						'beamkv': {
							'units': 'kv',
							'data': '7.0'
						},
						'emission': {
							'units': 'ua',
							'data': '0.0000'
						},
						'probecur': {
							'units': 'na',
							'data': '29.7100'
						},
						'beamdiam': {
							'units': 'nm',
							'data': '0.0'
						},
						'magcam': {
							'units': '',
							'data': '40.0'
						},
						'opermode': {
							'units': '',
							'data': 'IMAG'
						},
						'xtiltstge': {
							'units': 'dg',
							'data': '0.000'
						},
						'ytiltstge': {
							'units': 'dg',
							'data': '0.000'
						},
						'xposition': {
							'units': '',
							'data': '-1.140'
						},
						'yposition': {
							'units': '',
							'data': '-51.542'
						},
						'zposition': {
							'units': '',
							'data': '11.185'
						},
						'elevangle': {
							'units': 'dg',
							'data': '39.92'
						},
						'azimangle': {
							'units': 'dg',
							'data': '50.00'
						},
						'solidangl': {
							'units': 'sr',
							'data': '0.0010'
						},
						'livetime': {
							'units': 's',
							'data': '6.397'
						},
						'realtime': {
							'units': 's',
							'data': '8.599'
						},
						'thcwind': {
							'units': 'cm',
							'data': '3.00E-05'
						},
						'tauwind': {
							'units': 'cm',
							'data': '2.00E-06'
						},
						'tdeadlyr': {
							'units': 'cm',
							'data': '1.00E-06'
						},
						'edsdet': {
							'units': '',
							'data': 'SiUTW'
						},
						'comment': {
							'units': '',
							'data': 'The following parameters are defined by Thermo Fisher Scientific'
						},
						'instrument': {
							'units': '',
							'data': 'NSS'
						},
						'detname': {
							'units': '',
							'data': 'UltraDry'
						},
						'contam': {
							'units': '',
							'data': '0.00E+00'
						},
						'contamtype': {
							'units': '',
							'data': 'NONE'
						},
						'workdist': {
							'units': '',
							'data': '10.81'
						},
						'stagerot': {
							'units': '',
							'data': '0.000'
						},
						'slidepos': {
							'units': '',
							'data': '100.000'
						},
						'crystmatl': {
							'units': '',
							'data': 'Si-Drift'
						},
						'crystarea': {
							'units': '',
							'data': '10.000'
						},
						'crystthick': {
							'units': '',
							'data': '0.450'
						},
						'wintype': {
							'units': '',
							'data': 'NORVAR'
						},
						'contmatl': {
							'units': '',
							'data': 'SDD_LELMT'
						},
						'windcoat': {
							'units': '',
							'data': 'ALUMINUM'
						},
						'windthick': {
							'units': '',
							'data': '0.030'
						},
						'deadtime': {
							'units': '',
							'data': '2.202'
						},
						'timecnstnt': {
							'units': '',
							'data': '6400'
						},
						'edsboardrev': {
							'units': '',
							'data': '2'
						},
						'zerowidth': {
							'units': '',
							'data': '64.000'
						},
						'detects': {
							'units': '',
							'data': '184583'
						},
						'converts': {
							'units': '',
							'data': '136751'
						},
						'stores': {
							'units': '',
							'data': '136398'
						},
						'escpksrem': {
							'units': '',
							'data': '1'
						},
						'zeropksrem': {
							'units': '',
							'data': '0'
						},
						'sumpksrem': {
							'units': '',
							'data': '1'
						},
						'zerocutoff': {
							'units': '',
							'data': '0.000'
						},
						'detsubtype': {
							'units': '',
							'data': '2'
						},
						'exponent': {
							'units': '',
							'data': '0.000'
						},
						'lowevadj': {
							'units': '',
							'data': '0.000'
						},
						'beamx': {
							'units': '',
							'data': '-1.000'
						},
						'beamy': {
							'units': '',
							'data': '-1.000'
						},
						'charge': {
							'units': '',
							'data': '0.00E+00'
						},
						'quant_date': {
							'units': '',
							'data': 'Wed May 29 11'
						},
						'quant_chi': {
							'units': '',
							'data': '11.044'
						},
						'wds_angle': {
							'units': '',
							'data': '0.000'
						},
						'fittype': {
							'units': '',
							'data': '1'
						},
						'matrixcorr': {
							'units': '',
							'data': '1'
						},
						'peaklab': {
							'units': '',
							'data': '1.743000  Si Ka  2'
						},
						'quant_atnum': {
							'units': '',
							'data': 'SiK, 14'
						},
						'quant_lntp': {
							'units': '',
							'data': 'SiK, 1'
						},
						'quant_src': {
							'units': '',
							'data': 'SiK, 1'
						},
						'quant_ntcnt': {
							'units': '',
							'data': 'SiK, 16528'
						},
						'quant_cterr': {
							'units': '',
							'data': 'SiK, 240'
						},
						'quant_std': {
							'units': '',
							'data': 'SiK,'
						},
						'quant_cmpd': {
							'units': '',
							'data': 'SiK, SiO2'
						},
						'quant_krt': {
							'units': '',
							'data': 'SiK, 0.33721'
						},
						'quant_kerr': {
							'units': '',
							'data': 'SiK, 0.00490'
						},
						'quant_fitc': {
							'units': '',
							'data': 'SiK, 5.70235e-02'
						},
						'quant_wtcon': {
							'units': '',
							'data': 'SiK, 0.17507'
						},
						'quant_atcon': {
							'units': '',
							'data': 'SiK, 0.12625'
						},
						'quant_cocon': {
							'units': '',
							'data': 'SiK, 0.37454'
						},
						'quant_z': {
							'units': '',
							'data': 'SiK, 1.05358'
						},
						'quant_a': {
							'units': '',
							'data': 'SiK, 1.11481'
						},
						'quant_f': {
							'units': '',
							'data': 'SiK, 1.00000'
						},
						'quant_kfact': {
							'units': '',
							'data': 'SiK, 0.00000'
						},
						'quant_cats': {
							'units': '',
							'data': 'SiK, 0.00000'
						},
						'quant_fitc1': {
							'units': '',
							'data': 'SiK, 1.93615e-03'
						},
						'quant_fitc2': {
							'units': '',
							'data': 'SiK, 3.09071e-03'
						},
						'quant_fit_g': {
							'units': '',
							'data': 'SiK, 1.45554e-01'
						},
						'quant_pmtr0': {
							'units': '',
							'data': 'SiK, 9.96546e-01'
						},
						'quant_pmtr1': {
							'units': '',
							'data': 'SiK, 6.90932e-01'
						},
						'quant_pmtr2': {
							'units': '',
							'data': 'SiK, 3.74615e-02'
						},
						'quant_pmtr3': {
							'units': '',
							'data': 'SiK, 3.58638e+00'
						}
					},
					'name': '1'
				}
			},
			'layers': {},
			'files': {
				'base': path.resolve('./test/data/64.PS.EDS/64.psref'),
				'entry': path.resolve('./test/data/64.PS.EDS/64.p_s'),
				'points': [
					'1'
				],
				'layers': [
					{
						'element': 'base',
						'file': path.resolve('./test/data/64.PS.EDS/64.psref')
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

describe('Thermo Functions', function() {
	this.timeout(30000); // Increase timeout to 30 seconds
	let pointShoot;

	before(async () => {
		console.log('Starting initialization...');
		const nodeCanvas = new NodeCanvas(Canvas);
		const canvas = new CanvasRoot(nodeCanvas);
		await canvas.init();
		console.log('Canvas initialized.');
		pointShoot = new PointShoot({name: '64.p_s', uri: './test/data/64.PS.EDS/64.p_s'}, canvas);
		await pointShoot.init();
		console.log('PointShoot initialized.');
	});

	it('should correctly serialize', () => {
		assert.deepStrictEqual(pointShoot.serialize(), {
			'entryFile': path.resolve('./test/data/64.PS.EDS/64.p_s'),
			'image': {
				'height': 48,
				'width': 64
			},
			'integrity': true,
			'jeolFile': false,
			'layers': {
				'base': {
					'element': 'base',
					'file': path.resolve('./test/data/64.PS.EDS/64.psref')
				},
				'solid': {
					'element': 'solid',
					'file': ''
				}
			},
			'magnification': 40,
			'name': '64',
			'output': {
				'height': 48,
				'width': 64
			},
			'points': {
				'1': {
					'file': '64_pt1.psmsa',
					'name': '1',
					'pos': [
						34,
						21
					],
					'type': 'spot',
					'values': [
						394,
						241,
						731,
						547
					],
					'x': 34,
					'y': 21
			}
			},
			'uri': path.resolve('./test/data/64.PS.EDS/'),
			'uuid': pointShoot.data.uuid
		});
	});

	it('should correctly clone', () => {
		let clone = pointShoot.clone(pointShoot.data.uuid);
		assert.deepStrictEqual(pointShoot.serialize(), clone.serialize());
	});
});