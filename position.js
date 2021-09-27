const constants = require('./constants.json');
const {v4} = require('./generateuuid.js');

class Position {
	constructor(name = '', analysis = 0, type = constants.position.types.SPOT, rawReference = [], stage = {}, source = {}, uuid = v4()) {
		this.data = {
			uuid,
			source,
			type,
			name,
			analysis,
			rawReference,
			originalReference: [],
			reference: [],
			orientation: {
				x: stage.orientation.x,
				y: stage.orientation.y
			}
		};
	}

	getUuid() {
		return this.data.uuid;
	}

	getType() {
		return this.data.type;
	}

	getName() {
		return this.data.name;
	}

	getAnalysisNumber() {
		return this.data.analysis;
	}

	calculateForImage(thermo) {
		const analysisNumber = this.getAnalysisNumber();

		// Return a static point structure for the given image using what we know
		return {
			uuid: this.getUuid(),
			name: `${this.getName()}${analysisNumber !== 0 ? ` - ${analysisNumber}` : ''}`,
			label: this.getName(),
			analysis: analysisNumber,
			type: this.getType(),
			data: this.data.data,
			relativeReference: this.data.reference.map(({x, y, r}) => {
				x = (thermo.data.stageMetadata.x.max - x) / thermo.data.stageMetadata.x.pixelSize;
				y = (y - thermo.data.stageMetadata.y.min) / thermo.data.stageMetadata.y.pixelSize;

				// Handles Obverse + Unknown
				if (this.data.orientation.x !== constants.stageOrientation.direction.REVERSE)
					x = thermo.data.metadata.width - x;

				// Handles Obverse
				if (this.data.orientation.y === constants.stageOrientation.direction.OBVERSE)
					y = thermo.data.metadata.height - y;

				if (r !== undefined) {
					r = r / thermo.data.stageMetadata.x.pixelSize;
					return {x, y, r};
				}

				return {x, y};
			}),
			absoluteReference: this.data.reference.map(({x, y, r}) => {
				if (r !== undefined)
					return {x, y, r};
				return {x, y};
			}),
			getUuid: this.getUuid.bind(this),
			getType: this.getType.bind(this),
			getName: this.getName.bind(this),
			getAnalysisNumber: this.getAnalysisNumber.bind(this),
			calculateForImage: this.calculateForImage.bind(this),
			extraData: this.extraData.bind(this),
			update: this.update.bind(this)
		};
	}

	extraData(data) {
		this.data.data = {
			beam: {
				diameter: parseFloat(data.beamdiam.data),
				acceleratingVoltage: parseFloat(data.beamkv.data),
//				x: parseFloat(data.beamx.data),
//				y: parseFloat(data.beamy.data)
			},
//			crystal: {
//				area: parseFloat(data.crystarea.data),
//				material: data.crystmatl.data,
//				thickness: parseFloat(data.crystthick.data)
//			},
			date: data.date.data,
//			detector: {
//				name: data.detname.data,
//				signalType: data.signaltype.data
//			},
			magnification: parseFloat(data.magcam.data),
			probeCurrent: parseFloat(data.probecur.data),
//			time: {
//				live: parseFloat(data.livetime.data),
//				dead: parseFloat(data.deadtime.data),
//				real: parseFloat(data.realtime.data)
//			}
		};
		return this;
	}

	update() {
		return this;
	}
}

class Thermo extends Position {
	constructor(name = '', analysis = 0, type = constants.position.types.SPOT, rawReference = [], stage = {}, source = {}, uuid = v4()) {
		super(name, analysis, type, rawReference, stage, source, uuid);

		switch(type) {
			case constants.position.types.SPOT:
				this.data.reference = [
					{
						x: this.data.rawReference[0] / this.data.rawReference[2],
						y: this.data.rawReference[1] / this.data.rawReference[3]
					}
				];
				break;
			case constants.position.types.CIRCLE:
				const [x, y] = [this.data.rawReference[0] / this.data.rawReference[2], this.data.rawReference[1] / this.data.rawReference[3]];
				const [x2, y2] = [this.data.rawReference[4] / this.data.rawReference[6], this.data.rawReference[5] / this.data.rawReference[7]];

				this.data.reference = [
					{
						x, y,
						r: Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2))
					}
				];
				break;
			case constants.position.types.POLYGON:
				for (let i = 0; i < this.data.rawReference.length; i += 4)
					this.data.reference.push({
						x: this.data.rawReference[i] / this.data.rawReference[2],
						y: this.data.rawReference[i + 1] / this.data.rawReference[3]
					});
				break;
		}

		this.data.originalReference = JSON.parse(JSON.stringify(this.data.reference));
	}

	// Requires an update based on the pixelSizeConstant given by the user due to Pathfinder/NSS not giving the pixel size
	update(thermo) {
		this.data.pixelSize = thermo.data.stageMetadata.x.pixelSize;
		this.data.reference = this.data.originalReference.map(({x, y, r}) => {
			// Absolute position in um
			x = (x * thermo.data.metadata.width * thermo.data.stageMetadata.x.pixelSize) + thermo.data.stageMetadata.x.min;
			y = (y * thermo.data.metadata.height * thermo.data.stageMetadata.y.pixelSize) + thermo.data.stageMetadata.y.min;

			if (r !== undefined) {
				r = r * thermo.data.stageMetadata.x.pixelSize;
				return {x, y, r};
			}

			return {x, y};
		});

		return this;
	}
}

class Jeol extends Position {
	constructor(name = '', analysis = 0, type = constants.position.types.SPOT, rawReference = [], stage = {}, source = {}, uuid = v4()) {
		super(name, analysis, type, rawReference, stage, source, uuid);
	}
}

class PFE extends Position {
	constructor(name = '', analysis = 0, type = constants.position.types.SPOT, rawReference = [], stage = {}, source = {}, uuid = v4()) {
		super(name, analysis, type, rawReference, stage, source, uuid);

		switch(type) {
			case constants.position.types.SPOT:
				this.data.reference = [
					{
						x: this.data.rawReference[0],
						y: this.data.rawReference[1]
					}
				];
				break;
			case constants.position.types.CIRCLE:
				this.data.reference = [
					{
						x: this.data.rawReference[0],
						y: this.data.rawReference[1],
						r: this.data.rawReference[2]
					}
				];
				break;
			case constants.position.types.POLYGON:
				for (let i = 0; i < this.data.rawReference.length; i += 2)
					this.data.reference.push({
						x: this.data.rawReference[i],
						y: this.data.rawReference[i + 1]
					});
				break;
		}

		this.data.originalReference = JSON.parse(JSON.stringify(this.data.reference));
	}
}

class Generic extends Position {
	constructor(name = '', analysis = 0, type = constants.position.types.SPOT, rawReference = [], stage = {}, source = {}, uuid = v4()) {
		super(name, analysis, type, rawReference, stage, source, uuid);
	}
}

module.exports = {
	Thermo,
	Jeol,
	PFE,
	Generic
};