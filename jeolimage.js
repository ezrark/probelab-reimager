const sharp = require('sharp');

const constants = require('./constants.json');
const io = require('./io.js');
const Thermo = require('./thermo.js');

module.exports = class extends Thermo {
	constructor(entryFile, Canvas) {
		super(entryFile,
			entryFile.name.substring(0, entryFile.name.length - constants.jeol.fileFormats.ENTRY.length),
			Canvas
		);

		this.data.outputFormat = constants.jeol.fileFormats.OUTPUTIMAGE
	}

	staticInit() {
		const entryFile = io.readJeolEntry(this.data.files.entry);
		try {
			this.data.files.base = this.data.uri + this.data.name + constants.jeol.fileFormats.IMAGE;

			io.checkJeolExists(this.data.files.base);

			this.data.files.layers = [{
				element: 'base',
				file: this.data.files.base
			}, {
				element: 'solid',
				file: ''
			}];

			this.data.points = {};
			this.data.files.points = [];
			this.data.data.map = {};
			this.data.magnification = entryFile['cm_mag'];
		} catch (err) {
			throw 'Not an operable JEOL file';
		}
	}
};
