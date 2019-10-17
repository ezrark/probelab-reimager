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
	let rawData = fs.readFileSync(uri, {encoding: 'utf8'}).replace(/�/gi, '\u00a0').split('#').map(text => {
		const data = text.split('\r\n');
		if (data.length === 1)
			return text.split('\n');
		else
			return data;
	});

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

	for (const line of rawData.shift())
		if (line.length > 1 && line.includes('.'))
			switch (line.split('.')[1].toLowerCase()) {
				case 'psref':
				case 'siref':
					output.data.base = line;
					break;
				case 'si':
					output.data.raw = line;
					break;
				case 'sitif':
					output.data.grey = line;
					break;
				case 'simcs':
					const name = line.toLowerCase().split(' ');
					output.layers.push({
						element: `${name.pop().split('.')[0]} ${name.pop()}`,
						file: line
					});
					break;

			}

	for (const element of rawData) {
		let type = element.shift().split(' ')[1].toLowerCase();
		if (type !== 'imgint')
			output.points.push({
				type,
				file: element.shift(),
				values: element.map(line => line.length > 1 ? line.split(',').filter(x => x !== undefined && x.length > 0).map(num => parseInt(num)) : []).flat()
			});
	}

	return output;
}

module.exports = {
	readMASFile,
	readEntryFile
};