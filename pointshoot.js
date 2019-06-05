const constants = require('./constants');
const io = require('./io');

module.exports = require('./thermo')().then(async ([Fonts, Thermo]) => {
	return class extends Thermo {
		constructor(entryFile, uri=undefined) {
			super(entryFile, entryFile.name.substring(0, entryFile.name.length - constants.pointShoot.fileFormats.ENTRY.length), uri);
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

			this.data.integrity = checkPointIntegrity(this.data.files.points.map(name => this.data.points[name].data));

			if (this.data.integrity && this.data.files.points.length !== expected.totalPoints)
				this.data.integrity = false;
		}
	}
});

function checkPointIntegrity(points) {
	const expectedData = points[0];

	for (const point of points)
		for (const key in point)
			if (!constants.pointShoot.integrity.SKIPARRAY.includes(key) && !key.startsWith('#quant_'))
				if (expectedData[key].data !== point[key].data)
					return false;
	return true;
}