const Jimp = require('jimp');
const Canvas = require('canvas');

const constants = require('./constants');
const calculations = require('./calculations');

Canvas.registerFont('fonts/OpenSans-Regular.ttf', { family: 'Open Sans' });
Canvas.registerFont('fonts/Comic Sans MS.ttf', { family: 'Comic Sans MS' });

module.exports = async () => {
	const scratchCanvas = Canvas.createCanvas(300, 300);
	const scratchCtx = scratchCanvas.getContext('2d');

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
		},
		[constants.point.colors.ORANGE]: {
			[constants.scale.sizes.TINY]: await Jimp.loadFont(Jimp.FONT_SANS_8_BLACK),
			[constants.scale.sizes.SMALL]: await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
			[constants.scale.sizes.NORMAL]: await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
			[constants.scale.sizes.LARGE]: await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK),
			[constants.scale.sizes.SUPER]: await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK)
		},
		[constants.point.colors.RED]: {
			[constants.scale.sizes.TINY]: await Jimp.loadFont(Jimp.FONT_SANS_8_BLACK),
			[constants.scale.sizes.SMALL]: await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
			[constants.scale.sizes.NORMAL]: await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
			[constants.scale.sizes.LARGE]: await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK),
			[constants.scale.sizes.SUPER]: await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK)
		}
	};

	return [fonts, class {
		constructor(entryFile, name, uri=undefined) {
			this.data = {
				uri: uri ? uri : entryFile.uri.split('/').slice(0, -1).join('/') + '/',
				name,
				scale: {},
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

		updateFromDisk() {}

		async addScale(type=constants.scale.types.BELOWCENTER, settings={}) {
			settings.belowColor = settings.belowColor ? settings.belowColor : constants.colors.AUTO;
			settings.scaleColor = settings.scaleColor ? settings.scaleColor : constants.colors.AUTO;
			settings.scaleSize = settings.scaleOffsets ? settings.scaleOffsets : constants.scale.AUTOSIZE;
			settings.scaleBarHeight = settings.scaleBarHeight ? settings.scaleBarHeight : constants.scale.AUTOSIZE;
			settings.scaleBarTop = settings.scaleBarTop ? settings.scaleBarTop : constants.scale.SCALEBARTOP;
			settings.pixelSizeConstant = settings.pixelSizeConstant ? settings.pixelSizeConstant : constants.PIXELSIZECONSTANT;
			settings.backgroundOpacity  = settings.backgroundOpacity ? settings.backgroundOpacity : constants.scale.background.AUTOOPACITY;
			settings.font = settings.font ? settings.font : constants.fonts.OPENSANS;

			// Calculate scale and image
			const [scale, rawImage] = await calculations.calculateScale(this.data.files.image, scratchCtx, this.data.magnification, type, settings);
			this.data.scale = scale;

			// Background
			settings.backgroundOpacity = (settings.backgroundOpacity < 0 ? 0 : (settings.backgroundOpacity > 100 ? 100 : settings.backgroundOpacity))/100;

			return new Promise(async (resolve, reject) => {
				const scale = this.data.scale;

				const canvas = Canvas.createCanvas(scale.realWidth, scale.realHeight);
				const ctx = canvas.getContext('2d');

				const img = new Canvas.Image();
				img.onload = async () => {

					ctx.drawImage(img, 0, 0);
					ctx.font = `${scale.textFontHeight}px "${settings.font}"`;

					if (scale.realHeight > scale.imageHeight) {
						let imageIsBlack = settings.belowColor === constants.scale.colors.BLACK;

						// Check the luminosity and use white or black background to make it look nice
						if (settings.belowColor === constants.colors.AUTO)
							imageIsBlack = calculations.sumPixelLuminosity(rawImage, 0, 0, rawImage.bitmap.width, rawImage.bitmap.height) < .5;

						ctx.fillStyle = imageIsBlack ? constants.colors.black.RGBA : constants.colors.white.RGBA;
						ctx.fillRect(0, scale.imageHeight, scale.realWidth, scale.realHeight - scale.imageHeight);
					} else {
						ctx.fillStyle = `rgba(${constants.colors.white.R}, ${constants.colors.white.G}, ${constants.colors.white.B}, ${settings.backgroundOpacity})`;
						ctx.fillRect(scale.x - scale.scaleOffsets.xOffset, scale.y - scale.scaleOffsets.xOffset, scale.width + (scale.scaleOffsets.xOffset * 2), scale.realHeight - scale.y + (scale.scaleOffsets.xOffset*2));
					}

					const imageIsBlack = calculations.sumPixelLuminosity(rawImage, scale.x, scale.y, scale.width, scale.height) < .5;

					ctx.fillStyle = settings.scaleColor ? settings.scaleColor.RGBA : (imageIsBlack ? constants.colors.black.RGBA : constants.colors.white.RGBA);
					ctx.fillText(scale.visualScale, scale.textX, scale.textY + scale.textFontHeight);
					ctx.fillRect(scale.x, scale.y, scale.scaleLength, scale.barPixelHeight);

					new Jimp({
						data: canvas.toBuffer('raw'),
						width: scale.realWidth,
						height: scale.realHeight
					}, (err, image) => {
						this.data.image = image;
						resolve();
					});
				};
				img.onerror = reject;
				img.src = await rawImage.getBase64Async(Jimp.MIME_PNG);
			});

			// Luminosity
			let isBlack = settings.scaleColor === constants.scale.colors.WHITE;
			let gotLuminosity = false;

			// Background
			settings.backgroundOpacity = settings.backgroundOpacity < 0 ? 0 : (settings.backgroundOpacity > 100 ? 100 : settings.backgroundOpacity);

			// Create the background and find the luminosity if needed
			// Since it uses the image.scan method, it seems to run faster with less if statements inside it, thus there are 4 versions that can be run
			if (settings.backgroundOpacity !== 0 && type !== constants.scale.types.BELOWLEFT && type !== constants.scale.types.BELOWCENTER && type !== constants.scale.types.BELOWRIGHT) {
				const alpha = 1 - (settings.backgroundOpacity/100);
				let luminosity = 0;
				gotLuminosity = true;

				let textArea = {
					x: scale.x - scale.scaleOffsets.xOffset,
					y: scale.y - scale.scaleOffsets.xOffset,
					width: scale.width + (scale.scaleOffsets.xOffset * 2),
					height: scale.height + (scale.scaleOffsets.xOffset * 2)
				};

				if (settings.scaleColor === constants.scale.colors.AUTO)
					if (settings.belowColor === constants.scale.colors.BLACK)
						image.scan(textArea.x, textArea.y, textArea.width, textArea.height, (x, y, index) => {
							image.bitmap.data[index] = Math.round(((alpha * (image.bitmap.data[index] / 255))) * 255);
							image.bitmap.data[index + 1] = Math.round(((alpha * (image.bitmap.data[index + 1] / 255))) * 255);
							image.bitmap.data[index + 2] = Math.round(((alpha * (image.bitmap.data[index + 2] / 255))) * 255);
							luminosity += calculations.findPixelLuminosity(image.bitmap.data[index], image.bitmap.data[index + 1], image.bitmap.data[index + 2]);
						});
					else
						image.scan(textArea.x, textArea.y, textArea.width, textArea.height, (x, y, index) => {
							image.bitmap.data[index] = Math.round((((1 - alpha)) + (alpha * (image.bitmap.data[index] / 255))) * 255);
							image.bitmap.data[index + 1] = Math.round(((1 - alpha) + (alpha * (image.bitmap.data[index + 1] / 255))) * 255);
							image.bitmap.data[index + 2] = Math.round(((1 - alpha) + (alpha * (image.bitmap.data[index + 2] / 255))) * 255);
							luminosity += calculations.findPixelLuminosity(image.bitmap.data[index], image.bitmap.data[index + 1], image.bitmap.data[index + 2]);
						});
				else
					if (settings.belowColor === constants.scale.colors.BLACK)
						image.scan(textArea.x, textArea.y, textArea.width, textArea.height, (x, y, index) => {
							image.bitmap.data[index] = Math.round(((alpha * (image.bitmap.data[index] / 255))) * 255);
							image.bitmap.data[index + 1] = Math.round(((alpha * (image.bitmap.data[index + 1] / 255))) * 255);
							image.bitmap.data[index + 2] = Math.round(((alpha * (image.bitmap.data[index + 2] / 255))) * 255);
						});
					else
						image.scan(textArea.x, textArea.y, textArea.width, textArea.height, (x, y, index) => {
							image.bitmap.data[index] = Math.round((((1 - alpha)) + (alpha * (image.bitmap.data[index] / 255))) * 255);
							image.bitmap.data[index + 1] = Math.round(((1 - alpha) + (alpha * (image.bitmap.data[index + 1] / 255))) * 255);
							image.bitmap.data[index + 2] = Math.round(((1 - alpha) + (alpha * (image.bitmap.data[index + 2] / 255))) * 255);
						});
				isBlack = ((luminosity / (textArea.width * textArea.height)) / 255) < constants.luminosity.TARGET;
			}

			// Finds general luminosity of text area if we didn't already
			if (!gotLuminosity && settings.scaleColor === constants.scale.colors.AUTO)
				isBlack = calculations.sumPixelLuminosity(image, scale.x, scale.y, scale.width, scale.height) < constants.luminosity.TARGET;

			// Creates scale bar and scale text on image
			for (let i = 0; i < scale.barPixelHeight; i++)
				await image.print(
					isBlack ? fonts.white[scale.barFont] : fonts.black[scale.barFont],
					scale.barX,
					scale.barY - i,
					scale.scaleBar
				);

			await image.print(
				isBlack ? fonts.white[scale.scaleOffsets.font] : fonts.black[scale.scaleOffsets.font],
				scale.textX,
				scale.textY,
				scale.visualScale
			);

			this.data.image = image;
		}

		addPoint(x1, y1, x2, y2, name='', type=constants.point.types.THERMOINSTANT, size=constants.point.AUTOSIZE, color=constants.point.colors.RED, fontSize=constants.point.AUTOSIZE) {
			return new Promise(async (resolve, reject) => {
				const scale = this.data.scale;

				const canvas = Canvas.createCanvas(scale.realWidth, scale.realHeight);
				const ctx = canvas.getContext('2d');

				const img = new Canvas.Image();
				img.onload = async () => {
					const [autoSize, autoFontSize] = calculations.estimatePointScale(scale.imageWidth);
					size = size === constants.point.AUTOSIZE ? autoSize : size;
					fontSize = fontSize === constants.point.AUTOSIZE ? autoFontSize[constants.point.fonts.MEDIUM] : autoFontSize[fontSize];

					const x = Math.floor((x1 / x2) * scale.imageWidth);
					const y = Math.floor((y1 / y2) * scale.imageHeight);

					const point = await calculations.calculatePointPosition(x, y, scale.imageWidth, size, fontSize);

					ctx.drawImage(img, 0, 0);
					ctx.font = `${point.fontSize}px "Comic Sans MS"`;
					ctx.fillText(name, point.fontX, point.fontY);
					new Jimp({
						data: canvas.toBuffer('raw'),
						width: scale.realWidth,
						height: scale.realHeight
					}, (err, image) => {
						this.data.image = image;

						resolve();
					});
				};
				img.onerror = console.warn;
				img.src = await this.data.image.getBase64Async(Jimp.MIME_PNG);
			});
			/*
			if (point.size < 8)
				type = constants.point.types.CIRCLE;

			switch (type) {
				default:
				case constants.point.types.CIRCLE:
					image.scan(point.leftX, point.topY, point.size+1, point.size+1, (pixelX, pixelY, index) => {
						if (Math.sqrt(Math.pow(x - pixelX, 2) + Math.pow(y - pixelY, 2)) <= point.halfSize) {
							image.bitmap.data[index] = color[0];
							image.bitmap.data[index + 1] = color[1];
							image.bitmap.data[index + 2] = color[2];
						}
					});
					break;
				case constants.point.types.THERMOINSTANT:  // TODO: Fix this garbage, please
					// Top Horizontal
					image.scan(point.leftX + point.eighthSize, point.topY + point.eighthSize, point.size - point.quarterSize, point.eighthSize, (pixelX, pixelY, index) => {
						image.bitmap.data[index] = color[0];
						image.bitmap.data[index + 1] = color[1];
						image.bitmap.data[index + 2] = color[2];
					});
					// Left Vertical
					image.scan(point.leftX + point.eighthSize, point.topY + point.eighthSize, point.eighthSize, point.size - point.quarterSize, (pixelX, pixelY, index) => {
						image.bitmap.data[index] = color[0];
						image.bitmap.data[index + 1] = color[1];
						image.bitmap.data[index + 2] = color[2];
					});
					// Bottom Horizontal
					image.scan(point.leftX + point.eighthSize, point.bottomY - point.quarterSize + 1, point.size - point.quarterSize, point.eighthSize, (pixelX, pixelY, index) => {
						image.bitmap.data[index] = color[0];
						image.bitmap.data[index + 1] = color[1];
						image.bitmap.data[index + 2] = color[2];
					});
					// Right Vertical
					image.scan(point.rightX - point.quarterSize + 1, point.topY + point.eighthSize, point.eighthSize, point.size - point.quarterSize, (pixelX, pixelY, index) => {
						image.bitmap.data[index] = color[0];
						image.bitmap.data[index + 1] = color[1];
						image.bitmap.data[index + 2] = color[2];
					});
				case constants.point.types.CROSS:
					image.scan(point.leftX - point.quarterSize, y - point.sixteenthSize, point.size + point.halfSize, (point.sixteenthSize*2)+1, (pixelX, pixelY, index) => {
						image.bitmap.data[index] = color[0];
						image.bitmap.data[index + 1] = color[1];
						image.bitmap.data[index + 2] = color[2];
					});
					image.scan(x - point.sixteenthSize, point.topY - point.quarterSize, (point.sixteenthSize*2)+1, point.size + point.halfSize, (pixelX, pixelY, index) => {
						image.bitmap.data[index] = color[0];
						image.bitmap.data[index + 1] = color[1];
						image.bitmap.data[index + 2] = color[2];
					});
					break;
			}

			let font;
			switch(color) {
				default:
				case constants.point.colors.RED:
					font = fonts[constants.point.colors.RED][fontSize];
					break;
				case constants.point.colors.ORANGE:
					font = fonts[constants.point.colors.ORANGE][fontSize];
					break;
				case constants.point.colors.WHITE:
					font = fonts.white[fontSize];
					break;
				case constants.point.colors.BLACK:
					font = fonts.black[fontSize];
					break;
			}

			await image.print(
				font,
				point.fontX,
				point.fontY,
				name
			);
*/
		}

		async writeImage(settings={}) {
			let outputUri = settings.uri ? settings.uri : (this.data.files.image.substring(0, this.data.files.image.length - (constants.pointShoot.fileFormats.IMAGERAW.length)) + constants.pointShoot.fileFormats.OUTPUTIMAGE);
			return await this.data.image.writeAsync(outputUri);
		}

		async addScaleAndWrite(type=undefined, settings={}) {
			await this.addScale(type, settings);

			if (settings.addPoints && this.data.points)
				for (const point of Object.values(this.data.points))
					await this.addPoint(point.values[0], point.values[1], point.values[2], point.values[3], point.name);

			await this.writeImage(settings);
			this.data.image = undefined;
		}
	}];
};