const constants = require('./constants');
const io = require('./io');

const Thermo = require('./thermo');

module.exports = class extends Thermo {
	constructor(entryFile, Canvas, uri=undefined) {
		super(entryFile,
			entryFile.name.substring(0, entryFile.name.length - constants.pointShoot.fileFormats.ENTRY.length),
			Canvas,
			uri
		);
	}

	updateFromDisk() {
		const psData = io.readEntryFile(this.data.files.entry);

		this.data.files.base = this.data.uri + psData.data.base;

		this.data.files.layers.push({
			element: 'base',
			file: this.data.files.base
		});

		this.data.points = psData.points.reduce((points, point) => {
			point.data = io.readMASFile((this.data.uri + point.file));
			points[point.file] = point;

			return points;
		}, {});

		this.data.files.points = Object.keys(this.data.points);
		this.data.magnification = parseInt(this.data.points[psData.points[0].file].data[constants.pointShoot.MAGNIFICATIONKEY].data);

		this.data.integrity = checkPointIntegrity(this.data.files.points.map(file => this.data.points[file]));

		if (!this.data.integrity && this.data.files.points.length !== parseInt(expected.totalPoints)) {
			this.data.integrity = false;
			console.warn(this.data.name);
		}
	}
};

function checkPointIntegrity(points) {
	const expectedData = points[0];

	for (const point of points) {
		for (const key in point.data)
			if (!constants.pointShoot.integrity.SKIPARRAY.includes(key) && !key.startsWith('#quant_'))
				if (expectedData.data[key].data !== point.data[key].data)
					return false;
		if (expectedData.values[2] !== point.values[2])
			if (expectedData.values[3] !== point.values[3])
				return false;
	}
	return true;
}