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
				name: entryFile.name.substring(0, entryFile.name.length - constants.pointShoot.fileFormats.ENTRY.length),
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

		async addScale(type=constants.scale.types.BELOW, settings={}) {
			settings.belowColor = settings.belowColor ? settings.belowColor : constants.scale.colors.AUTO;
			settings.scaleColor = settings.scaleColor ? settings.scaleColor : constants.scale.colors.AUTO;
			settings.scaleSize = settings.scaleSize ? settings.scaleSize : constants.scale.AUTOSIZE;
			settings.scaleBarHeight = settings.scaleBarHeight ? settings.scaleBarHeight : constants.scale.AUTOSIZE;
			settings.scaleBarTop = settings.scaleBarTop ? settings.scaleBarTop : constants.scale.SCALEBARTOP;

			const initialImage = await Jimp.read(this.data.files.image);

			const [scale, image] = await calculations.calculateScale(initialImage, this.data.magnification, type, settings.belowColor, settings.scaleSize, settings.scaleBarHeight, settings.scaleBarTop);

			let isBlack = settings.scaleColor === constants.scale.colors.WHITE;

			// Finds general luminosity of text area
			if (settings.scaleColor === constants.scale.colors.AUTO)
				isBlack = calculations.sumPixelLuminosity(image, scale.x, scale.y, scale.width, scale.textFontHeight) < .5;

			// Creates scale bar and scale text on image
			for (let i = 0; i < scale.barPixelHeight; i++)
				await image.print(
					isBlack ? fonts.white[scale.barFont] : fonts.black[scale.barFont],
					scale.barX,
					scale.barY - i,
					scale.scaleBar
				);

			await image.print(
				isBlack ? fonts.white[scale.scaleSize.font] : fonts.black[scale.scaleSize.font],
				scale.textX,
				scale.textY,
				scale.visualScale
			);

			this.data.image = image;
		}

		async writeImage(settings={}) {
			let outputUri = settings.uri ? settings.uri : (this.data.files.image.substring(0, this.data.files.image.length - (constants.pointShoot.fileFormats.IMAGERAW.length)));
			outputUri += (outputUri.endsWith(constants.pointShoot.fileFormats.OUTPUTIMAGE) ? '' : constants.pointShoot.fileFormats.OUTPUTIMAGE);

			return await this.data.image.writeAsync(outputUri);
		}

		async addScaleAndWrite(type=undefined, settings={}) {
			await this.addScale(type, settings);
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