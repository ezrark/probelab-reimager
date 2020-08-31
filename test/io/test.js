const {describe} = require('mocha');

describe('IO', () => {
	describe('Thermo', () => {
		require('./thermo.js');
	});

	describe('Jeol', () => {
		require('./jeol.js');
	});

	describe('PFE', () => {
		require('./pfe.js');
	});
});