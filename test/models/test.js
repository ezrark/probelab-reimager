const {describe} = require('mocha');

describe('Models', () => {
	describe('Point and Shoot', () => {
		require('./pointshoot.js');
	});

	describe('Jeol', () => {
		require('./jeol.js');
	});

	describe('PFE', () => {
		require('./pfe.js');
	});
});