const fs = require('fs');

function readPSMSAFile(uri) {
	const rawData = fs.readFileSync(uri, {encoding: 'utf8'}).split('\r\n');

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

function readPSEntryFile(uri) {
	const rawData = fs.readFileSync(uri, {encoding: 'utf8'}).split('#');

	return rawData.reduce((output, set) => {
		if (!set.startsWith('..2')) {
			const [, name, point] = set.split('\r\n');
			const [x1, y1, x2, y2] = point.split(',').map(num => parseInt(num))

			output.push({name, x1, y1, x2, y2});
		}

		return output
	}, [])
}

module.exports = {
	readPSMSAFile,
	readPointDataFile: readPSEntryFile
};