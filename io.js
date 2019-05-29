const fs = require('fs');

function readMASFile(uri) {
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
	const rawData = fs.readFileSync(uri, {encoding: 'utf8'}).replace(/�/gi, '\u00a0').split('#');

	return rawData.reduce((output, set) => {
		if (set.startsWith('..2')) {
			[, output[0].imageName, output[0].totalPoints] = set.split('\r\n');
		} else {
			const [typeLine, name, point] = set.split('\r\n');

			output[1].push({
				name,
				type: typeLine.split(' ')[1],
				values: point.split(',').map(num => parseInt(num))
			});
		}

		return output
	}, [{imageName: '', totalPoints: 0}, []])
}

module.exports = {
	readMASFile,
	readPSEntryFile
};