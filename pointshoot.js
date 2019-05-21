const Jimp = require('jimp');

const constants = require('./constants');
const io = require('./io');

module.exports = async () => {
	const fonts = {
		white: {
			small: await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
			normal: await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
			large: await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE),
			super: await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE)
		},
		black: {
			small: await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
			normal: await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
			large: await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK),
			super: await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK)
		}
	};

	return class PointShoot {
		constructor(entryFile, uri=undefined) {
			this.data = {
				uri: uri ? uri : entryFile.name.split('/').slice(0, -1).join('/') + '/',
				image: undefined,
				integrity: true,
				points: {},
				files: {
					image: '',
					entry: entryFile.name,
					points: []
				}
			};
			this.updateFromDisk();
		}

		updateFromDisk() {
			const [expected, points] = io.readPSEntryFile(this.data.files.entry);

			this.data.points = points.reduce((points, point) => {
				try {
					point.data = io.readPSMSAFile(this.data.uri + point.name);
					points[point.name] = point;
				} catch (err) {
					console.warn(err);
				}

				return points;
			});

			this.data.files.points = this.data.points.keys();
			this.data.files.image = expected.imageName;

			checkPointIntegrity(this.data.files.points.map(name => this.data.points[name].data));

			if (this.data.files.points.length !== expected.totalPoints)
				this.data.integrity = false;

			this.data.image = Jimp.read(this.data.files.image);
		}

		async addScale() {

		}

		async writeImage(settings={}) {
			let outputUri = settings.uri ? settings.uri : this.data.uri;
			outputUri = outputUri.replace(/\\/gmi, '/');
			if (!outputUri.endsWith('/'))
				outputUri += '/';

			let outputName = settings.name ? settings.name : this.data.files.image.name.substring(0, this.data.files.image.name.length - (constants.pointShoot.fileFormats.IMAGERAW.length));

			return await this.data.image.writeAsync(outputUri + outputName + outputName.endsWith(constants.pointShoot.fileFormats.OUTPUTIMAGE) ? '' : constants.pointShoot.fileFormats.OUTPUTIMAGE)
		}
	}
};

function checkPointIntegrity(points) {
	const expectedData = points[0];

	for (const point of points)
		for (const key in point)
			if (!constants.pointShoot.integrity.SKIPARRAY.includes(key) && !key.startsWith('#quant_'))
				if (expectedData[key].data !== point[key].data)
					return false;
	return true;
}

async function processPSData(psData) {
	const image = await Jimp.read(psData.imageFile.uri);

	psData.width = image.bitmap.width;
	psData.height = image.bitmap.height;
	psData.image = image;

	const magnification = parseInt(psData.expectedData[constants.pointShoot.MAGNIFICATIONKEY].data);

	psData.pixelSize = calculatePixelSize(magnification, psData.width);
	[psData.scale, psData.scaleLength] = estimateScale(magnification, psData.width, psData.pixelSize);

	const fonts = {
		white: {
			small: await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
			normal: await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
			large: await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
		},
		black: {
			small: await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
			normal: await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
			large: await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
		}
	};

	let scaleBar = '';
	let actualScaleBarLength = 0;
	let prevActualScaleBarLength = 0;

	while (actualScaleBarLength < psData.scaleLength) {
		prevActualScaleBarLength = actualScaleBarLength;

		scaleBar += '–';
		actualScaleBarLength = await Jimp.measureText(fonts.black.small, scaleBar);
	}

	if (Math.abs(prevActualScaleBarLength - psData.scaleLength) < Math.abs(actualScaleBarLength - psData.scaleLength))
		scaleBar = scaleBar.substring(1);

	let pixels = [];

	image.scan(0, 0, 100, 50, (x, y, index) => {
		pixels.push({
			x,
			y,
			color: {
				r: index,
				g: index + 1,
				b: index + 2,
				a: index + 3
			}
		})
	});

	const isBlack = (pixels.reduce((sum, pixel) => {
		return sum + .2126 * pixel.color.r + .7152 * pixel.color.g + .0722 * pixel.color.b;
	}) / pixels.length) < .5;

	await image.print(
		isBlack ? fonts.white.small : fonts.black.small,
		10,
		10,
		scaleBar
	);

	await image.print(
		isBlack ? fonts.white.normal : fonts.black.normal,
		10,
		30,
		'' + psData.scale + 'µm'
	);

	return psData;
}

module.exports = PointShoot;