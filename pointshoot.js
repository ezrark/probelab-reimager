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
		const [expected, points] = io.readPSEntryFile(this.data.files.entry);

		this.data.points = points.reduce((points, point) => {
			try {
				point.data = io.readMASFile((this.data.uri + point.name));
				points[point.name] = point;
			} catch (err) {
				console.warn(err);
			}

			return points;
		}, {});

		this.data.files.points = Object.keys(this.data.points);
		this.data.files.image = this.data.uri + expected.imageName;
		this.data.magnification = parseInt(this.data.points[points[0].name].data[constants.pointShoot.MAGNIFICATIONKEY].data);

		this.data.integrity = checkPointIntegrity(this.data.files.points.map(name => this.data.points[name]));

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