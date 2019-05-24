const Jimp = require('jimp');

const constants = require('./constants');
const io = require('./io');
const calculations = require('./calculations');

module.exports = async () => {
	const fonts = {
		white: {
			[constants.scale.sizes.TINY]: await Jimp.loadFont(Jimp.FONT_SANS_8_WHITE),
			[constants.scale.sizes.SMALL]: await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
			[constants.scale.sizes.NORMAL]: await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
			[constants.scale.sizes.LARGE]: await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE),
			[constants.scale.sizes.SUPER]: await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE)
		},
		black: {
			[constants.scale.sizes.TINY]: await Jimp.loadFont(Jimp.FONT_SANS_8_BLACK),
			[constants.scale.sizes.SMALL]: await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
			[constants.scale.sizes.NORMAL]: await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
			[constants.scale.sizes.LARGE]: await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK),
			[constants.scale.sizes.SUPER]: await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK)
		}
	};

	return class PointShoot {
		constructor(entryFile, uri=undefined) {
			this.data = {
				uri: uri ? uri : entryFile.uri.split('/').slice(0, -1).join('/') + '/',
				image: undefined,
				integrity: true,
				magnification: 1,
				points: {},
				files: {
					image: '',
					entry: entryFile.uri,
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
			}, {});

			this.data.files.points = Object.keys(this.data.points);
			this.data.files.image = this.data.uri + expected.imageName;
			this.data.magnification = parseInt(this.data.points[points[0].name].data[constants.pointShoot.MAGNIFICATIONKEY].data);

			this.data.integrity = checkPointIntegrity(this.data.files.points.map(name => this.data.points[name].data));

			if (this.data.integrity && this.data.files.points.length !== expected.totalPoints)
				this.data.integrity = false;
		}

		async addScale(type=constants.scale.types.BELOW) {
			const initialImage = await Jimp.read(this.data.files.image);

			const [scale, image] = await calculations.calculateScale(initialImage, this.data.magnification, type);

			// Finds general luminosity of text area
			let textBackgroundPixels = [];
			image.scan(scale.x, scale.y, scale.width, scale.height, (x, y, index) => {
				textBackgroundPixels.push({
					x, y,
					color: {r: index, g: index + 1, b: index + 2, a: index + 3}
				})
			});

			const isBlack = calculations.sumPixelLuminosity(textBackgroundPixels) < .5;

			// Creates scale bar and scale text on image
			await image.print(
				isBlack ? fonts.white.small : fonts.black.small,
				scale.x,
				scale.y - 16,
				scale.scaleBar
			);
			await image.print(
				isBlack ? fonts.white.small : fonts.black.small,
				scale.x,
				scale.y - 15,
				scale.scaleBar
			);
			await image.print(
				isBlack ? fonts.white.small : fonts.black.small,
				scale.x,
				scale.y - 14,
				scale.scaleBar
			);
			await image.print(
				isBlack ? fonts.white.small : fonts.black.small,
				scale.x,
				scale.y - 13,
				scale.scaleBar
			);
			await image.print(
				isBlack ? fonts.white.small : fonts.black.small,
				scale.x,
				scale.y - 12,
				scale.scaleBar
			);

			await image.print(
				isBlack ? fonts.white[scale.scaleSize] : fonts.black[scale.scaleSize],
				scale.x,
				scale.y + 10,
				'' + scale.visualScale + 'µm'
			);

			this.data.image = image;
		}

		async writeImage(settings={}) {
			let outputUri = settings.uri ? settings.uri : this.data.uri;
			outputUri = outputUri.replace(/\\/gmi, '/');
			if (!outputUri.endsWith('/'))
				outputUri += '/';

			const outputName = settings.name ? settings.name : this.data.files.image.substring(0, this.data.files.image.length - (constants.pointShoot.fileFormats.IMAGERAW.length));

			return await this.data.image.writeAsync(outputName + (outputName.endsWith(constants.pointShoot.fileFormats.OUTPUTIMAGE) ? '' : constants.pointShoot.fileFormats.OUTPUTIMAGE));
		}

		async addScaleAndWrite(type=undefined, settings={}) {
			await this.addScale(type);
			await this.writeImage(settings);
			this.data.image = undefined;
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
	[psData.scale, psData.scaleLength] = estimateVisualScale(magnification, psData.width, psData.pixelSize);

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