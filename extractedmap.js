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

	return class ExtractedMap {
		constructor(entryFile, uri=undefined) {
			const directoryName = entryFile.uri.split('/').slice(-2, -1)[0];

			this.data = {
				uri: uri ? uri : entryFile.uri.split('/').slice(0, -1).join('/') + '/',
				name: directoryName.substring(0, directoryName.length - constants.extractedMap.fileFormats.DIRECTORYCONST.length),
				image: undefined,
				magnification: 1,
				files: {
					image: '',
					entry: entryFile.uri
				}
			};

			this.data.files.image = this.data.uri + this.data.name + constants.extractedMap.fileFormats.IMAGERAW;

			this.updateFromDisk();
		}

		updateFromDisk() {
			this.data.data = io.readMASFile(this.data.files.entry);

			this.data.magnification = parseInt(this.data.data[constants.extractedMap.MAGNIFICATIONKEY].data);
		}

		async addScale(type=constants.scale.types.BELOW, settings={}) {
			settings.belowColor = settings.belowColor ? settings.belowColor : constants.scale.colors.AUTO;
			settings.scaleColor = settings.scaleColor ? settings.scaleColor : constants.scale.colors.AUTO;
			settings.scaleSize = settings.scaleSize ? settings.scaleSize : constants.scale.AUTOSIZE;
			settings.scaleBarHeight = settings.scaleBarHeight ? settings.scaleBarHeight : constants.scale.AUTOSIZE;
			settings.scaleBarTop = settings.scaleBarTop ? settings.scaleBarTop : constants.scale.SCALEBARTOP;
			settings.pixelSizeConstant = settings.pixelSizeConstant ? settings.pixelSizeConstant : constants.PIXELSIZECONSTANT;

			const initialImage = await Jimp.read(this.data.files.image);

			const [scale, image] = await calculations.calculateScale(initialImage, this.data.magnification, type, settings);

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
			let outputUri = settings.uri ? settings.uri : (this.data.files.image.substring(0, this.data.files.image.length - (constants.extractedMap.fileFormats.IMAGERAW.length)) + constants.extractedMap.fileFormats.OUTPUTIMAGE);
			return await this.data.image.writeAsync(outputUri);
		}

		async addScaleAndWrite(type=undefined, settings={}) {
			await this.addScale(type, settings);
			await this.writeImage(settings);
			this.data.image = undefined;
		}
	}
};