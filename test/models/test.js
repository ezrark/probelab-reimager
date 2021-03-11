const {describe, it} = require('mocha');

describe('Models', () => {
	describe('Point and Shoot', () => {
		require('./pointshoot.js');
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