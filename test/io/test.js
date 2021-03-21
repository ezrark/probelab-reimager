const {describe} = require('mocha');

describe('IO', () => {
	describe('Thermo', () => {
		require('./thermo.js');
	});

	describe('Jeol', () => {
		require('./jeol.js');
	});

	describe('PFE', () => {
		if (process.platform === 'win32')
			require('./pfe.js');
		else
			it('should skip PFE in non-windows environments', () => {
			});
	});
});