const fs = require('fs');

function readMASFile(uri) {
	let rawData = fs.readFileSync(uri, {encoding: 'utf8'}).split('\r\n');
	rawData = rawData.length === 1 ? rawData[0].split('\n') : rawData;

	return rawData.reduce((output, line) => {
		const [rawName, data] = line.split(':');
		const [name, units] = rawName.toLowerCase().trim().substring(1).split('-');

		if (name && data && name !== 'spectrum' && name !== 'endofdata')
			output[name.trim()] = {
				units: units ? units.trim() : '',
				data: data.trim()
			};

		return output;
	}, {});
}

function readEntryFile(uri) {
	let rawData = fs.readFileSync(uri, {encoding: 'utf8'}).replace(/�/gi, '\u00a0').split('\r\n');
	rawData = rawData.length === 1 ? rawData[0].split('\n') : rawData;

	let output = {
		points: [],
		layers: [],
		data: {
			spectra: '',
			base: '',
			grey: '',
			raw: ''
		}
	};

	for (let i = 0; i < rawData.length; i++) {
		const data = rawData[i];
		const ext = data.split('.').pop();

		if (data.startsWith('#')) {
			output.points.push({
				type: data.split(' ')[1].toLowerCase(),
				file: rawData[i + 1],
				values: rawData[i + 2].split(',').map(num => parseInt(num))
			});
			i += 2;
		} else
			switch(ext) {
				case 'si':
					output.data.raw = data;
					break;
				case 'siref':
				case 'psref':
					output.data.base = data;
					break;
				case 'sitif':
					output.data.grey = data;
					break;
				case 'simcs':
					const name = data.toLowerCase().split(' ');
					const element = name.pop().split('.')[0];
					const type = name.pop();
					output.layers.push({
						element: `${element} ${type}`,
						file: data
					});
					break;
			}
	}

	return output;
}

module.exports = {
	readMASFile,
	readEntryFile
};