const path = require('path');
const assert = require('assert');
const {describe, it} = require('mocha');

const {scaleSettings, pointSettings, writeSettings} = require('../../sanitize.js');

describe('Sanitize', () => {
	it('should', () => {
		assert.deepStrictEqual(scaleSettings(), {
			'RGBA': false,
			'backgroundOpacity': NaN,
			'belowColor': false,
			'font': 'Open Sans Bold',
			'pixelSizeConstant': 116.73,
			'scaleBarHeight': 0,
			'scaleBarTop': false,
			'scaleColor': false,
			'scaleSize': 0
		});
	});

	it('should', () => {
		assert.deepStrictEqual(pointSettings(), {
			'pointFont': 'Open Sans Bold',
			'pointFontSize': 0,
			'pointSize': 0,
			'pointType': 'fancyCross',
			'textColor': {
				'A': 1,
				'B': 52,
				'G': 63,
				'NAME': 'red',
				'R': 255,
				'RGBA': 'rgba(255, 63, 52, 1)'
			}
		});
	});

	it('should', () => {
		assert.deepStrictEqual(writeSettings(), {
			'acq': {
				'stageUnits': 'mm',
				'use': false,
				'xPolarity': -1,
				'yPolarity': -1
			},
			'jpeg': {
				'chromaSubsampling': undefined,
				'quality': 100,
				'use': false
			},
			'pixelSizeConstant': 116.73,
			'png': {
				'compressionLevel': 9,
				'quality': 100,
				'use': false
			},
			'tiff': {
				'compression': 'none',
				'predictor': 'none',
				'quality': 100,
				'use': false
			},
			'uri': path.resolve('.'),
			'webp': {
				'compression': true,
				'predictor': false,
				'quality': 100,
				'use': false
			}
		});
	});
});