const hash = require('crypto').createHash;

const assert = require('assert');
const {describe, it} = require('mocha');

const io = require('../../io.js');

describe('#readMASFile', () => {
	it('should read a .psmsa file', () => {
		assert.deepStrictEqual(
			io.readMASFile('test/data/1024.PS.EDS/1024_pt1.psmsa'),
			{
				'format': {'units': '', 'data': 'EMSA/MAS Spectral Data File'},
				'version': {'units': '', 'data': '1.0'},
				'title': {'units': '', 'data': '1024(1)_pt1'},
				'date': {'units': '', 'data': '29-MAY-2019'},
				'time': {'units': '', 'data': '11'},
				'owner': {'units': '', 'data': ''},
				'npoints': {'units': '', 'data': '1024'},
				'ncolumns': {'units': '', 'data': '1'},
				'xunits': {'units': '', 'data': 'keV'},
				'yunits': {'units': '', 'data': 'Intensity'},
				'datatype': {'units': '', 'data': 'XY'},
				'xperchan': {'units': '', 'data': '0.010000000'},
				'offset': {'units': '', 'data': '0.000000000'},
				'choffset': {'units': '', 'data': '0.000000'},
				'signaltype': {'units': '', 'data': 'EDS'},
				'xlabel': {'units': '', 'data': 'X-Ray Energy'},
				'ylabel': {'units': '', 'data': 'X-Ray Intensity'},
				'beamkv': {'units': 'kv', 'data': '7.0'},
				'emission': {'units': 'ua', 'data': '0.0000'},
				'probecur': {'units': 'na', 'data': '29.7100'},
				'beamdiam': {'units': 'nm', 'data': '0.0'},
				'magcam': {'units': '', 'data': '40.0'},
				'opermode': {'units': '', 'data': 'IMAG'},
				'xtiltstge': {'units': 'dg', 'data': '0.000'},
				'ytiltstge': {'units': 'dg', 'data': '0.000'},
				'xposition': {'units': '', 'data': '-1.140'},
				'yposition': {'units': '', 'data': '-51.542'},
				'zposition': {'units': '', 'data': '11.185'},
				'elevangle': {'units': 'dg', 'data': '39.92'},
				'azimangle': {'units': 'dg', 'data': '50.00'},
				'solidangl': {'units': 'sr', 'data': '0.0010'},
				'livetime': {'units': 's', 'data': '15.000'},
				'realtime': {'units': 's', 'data': '20.175'},
				'thcwind': {'units': 'cm', 'data': '3.00E-05'},
				'tauwind': {'units': 'cm', 'data': '2.00E-06'},
				'tdeadlyr': {'units': 'cm', 'data': '1.00E-06'},
				'edsdet': {'units': '', 'data': 'SiUTW'},
				'comment': {
					'units': '',
					'data': 'The following parameters are defined by Thermo Fisher Scientific'
				},
				'instrument': {'units': '', 'data': 'NSS'},
				'detname': {'units': '', 'data': 'UltraDry'},
				'contam': {'units': '', 'data': '0.00E+00'},
				'contamtype': {'units': '', 'data': 'NONE'},
				'workdist': {'units': '', 'data': '10.81'},
				'stagerot': {'units': '', 'data': '0.000'},
				'slidepos': {'units': '', 'data': '100.000'},
				'crystmatl': {'units': '', 'data': 'Si-Drift'},
				'crystarea': {'units': '', 'data': '10.000'},
				'crystthick': {'units': '', 'data': '0.450'},
				'wintype': {'units': '', 'data': 'NORVAR'},
				'contmatl': {'units': '', 'data': 'SDD_LELMT'},
				'windcoat': {'units': '', 'data': 'ALUMINUM'},
				'windthick': {'units': '', 'data': '0.030'},
				'deadtime': {'units': '', 'data': '5.175'},
				'timecnstnt': {'units': '', 'data': '6400'},
				'edsboardrev': {'units': '', 'data': '2'},
				'zerowidth': {'units': '', 'data': '65.000'},
				'detects': {'units': '', 'data': '434643'},
				'converts': {'units': '', 'data': '320418'},
				'stores': {'units': '', 'data': '319577'},
				'escpksrem': {'units': '', 'data': '1'},
				'zeropksrem': {'units': '', 'data': '0'},
				'sumpksrem': {'units': '', 'data': '1'},
				'zerocutoff': {'units': '', 'data': '0.000'},
				'detsubtype': {'units': '', 'data': '2'},
				'exponent': {'units': '', 'data': '0.000'},
				'lowevadj': {'units': '', 'data': '0.000'},
				'beamx': {'units': '', 'data': '-1.000'},
				'beamy': {'units': '', 'data': '-1.000'},
				'charge': {'units': '', 'data': '0.00E+00'},
				'quant_date': {'units': '', 'data': 'Wed May 29 11'},
				'quant_chi': {'units': '', 'data': '174.771'},
				'wds_angle': {'units': '', 'data': '0.000'},
				'fittype': {'units': '', 'data': '1'},
				'matrixcorr': {'units': '', 'data': '1'},
				'peaklab': {'units': '', 'data': '1.743000  Si Ka  2'},
				'quant_atnum': {'units': '', 'data': 'SiK, 14'},
				'quant_lntp': {'units': '', 'data': 'SiK, 1'},
				'quant_src': {'units': '', 'data': 'SiK, 1'},
				'quant_ntcnt': {'units': '', 'data': 'SiK, 38520'},
				'quant_cterr': {'units': '', 'data': 'SiK, 371'},
				'quant_std': {'units': '', 'data': 'SiK,'},
				'quant_cmpd': {'units': '', 'data': 'SiK, SiO2'},
				'quant_krt': {'units': '', 'data': 'SiK, 0.34107'},
				'quant_kerr': {'units': '', 'data': 'SiK, 0.00329'},
				'quant_fitc': {'units': '', 'data': 'SiK, 1.32900e-01'},
				'quant_wtcon': {'units': '', 'data': 'SiK, 0.17691'},
				'quant_atcon': {'units': '', 'data': 'SiK, 0.12757'},
				'quant_cocon': {'units': '', 'data': 'SiK, 0.37846'},
				'quant_z': {'units': '', 'data': 'SiK, 1.05365'},
				'quant_a': {'units': '', 'data': 'SiK, 1.11428'},
				'quant_f': {'units': '', 'data': 'SiK, 1.00000'},
				'quant_kfact': {'units': '', 'data': 'SiK, 0.00000'},
				'quant_cats': {'units': '', 'data': 'SiK, 0.00000'},
				'quant_fitc1': {'units': '', 'data': 'SiK, 5.28024e-03'},
				'quant_fitc2': {'units': '', 'data': 'SiK, 8.22643e-03'},
				'quant_fit_g': {'units': '', 'data': 'SiK, 3.35457e-01'},
				'quant_pmtr0': {'units': '', 'data': 'SiK, 9.94275e-01'},
				'quant_pmtr1': {'units': '', 'data': 'SiK, 1.04732e+00'},
				'quant_pmtr2': {'units': '', 'data': 'SiK, 6.08010e-02'},
				'quant_pmtr3': {'units': '', 'data': 'SiK, 3.08100e+00'}
			}
		);
	});

	it('should throw when file is not found', () => {
		assert.throws(
			io.readMASFile.bind(undefined, 'test/data/1024.PS.EDS/1024_pt1')
		);
	});
});

describe('#readNSSEntry', () => {
	it('should read a .p_s file', () => {
		assert.deepStrictEqual(
			io.readNSSEntry('test/data/1024.PS.EDS/1024.p_s'),
			{
				'points': [{'type': 'spot', 'file': '1024_pt1.psmsa', 'values': [360, 253, 731, 547]}],
				'layers': [],
				'data': {'spectra': '', 'base': '1024.psref', 'grey': '', 'raw': ''}
			}
		);
	});

	it('should read a .csi file', () => {
		assert.deepStrictEqual(
			io.readNSSEntry('test/data/Map64x48.MAP.EDS/Map64x48.csi'),
			{
				'points': [],
				'layers': [],
				'data': {
					'spectra': '',
					'base': 'Map64x48.siref',
					'grey': 'Map64x48 Grey.sitif',
					'raw': 'Map64x48.si'
				}
			}
		);
	});

	it('should read a .csi file with .simcs files', () => {
		assert.deepStrictEqual(
			io.readNSSEntry('test/data/SampleName.MAP.EDS/SampleName.csi'),
			{
				'points': [],
				'layers': [
					{
						'element': 'al spec1',
						'file': 'SampleName Spec1 Al.simcs'
					},
					{
						'element': 'fe spec2',
						'file': 'SampleName Spec2 Fe.simcs'
					},
					{
						'element': 'n spec4',
						'file': 'SampleName Spec4 N.simcs'
					}
				],
				'data': {
					'spectra': '',
					'base': 'SampleName.siref',
					'grey': 'SampleName Grey.sitif',
					'raw': 'SampleName.si'
				}
			}
		);
	});

	it('should read a .csi file with .pc* data', () => {
		assert.deepStrictEqual(
			io.readNSSEntry('test/data/MonzogabbroExample.MAP.EDS/pc.csi'),
			{
				"points": [],
				"layers": [],
				"data": {
					"spectra": "",
					"base": "MonzogabbroExample.siref",
					"grey": "MonzogabbroExample Grey.sitif",
					"raw": "MonzogabbroExample.si"
				}
			}
		);
	});

	it('should read a .csi file with .fz* data', () => {
		assert.deepStrictEqual(
			io.readNSSEntry('test/data/MonzogabbroExample.MAP.EDS/fz.csi'),
			{
				"points": [],
				"layers": [],
				"data": {
					"spectra": "",
					"base": "MonzogabbroExample.siref",
					"grey": "MonzogabbroExample Grey.sitif",
					"raw": "MonzogabbroExample.si"
				}
			}
		);
	});

	it('should throw when file is not found', () => {
		assert.throws(io.readNSSEntry.bind(undefined, 'test/data/1024.PS.EDS/1024'));
	});
});