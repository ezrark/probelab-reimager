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
				x = (x - (this.data.orientation.x === constants.stageOrientation.direction.OBVERSE ? -(thermo.data.stageMetadata.minX) : thermo.data.stageMetadata.minX)) / thermo.data.stageMetadata.pixelSize;
				y = (y - (this.data.orientation.y === constants.stageOrientation.direction.OBVERSE ? -(thermo.data.stageMetadata.minY) : thermo.data.stageMetadata.maxY)) / thermo.data.stageMetadata.pixelSize;

				x = x * (this.data.orientation.x === constants.stageOrientation.direction.UNKNOWN ? 1000 : 1)
				y = y * (this.data.orientation.y === constants.stageOrientation.direction.UNKNOWN ? 1000 : 1)

				x = x * (this.data.orientation.x === constants.stageOrientation.direction.REVERSE ? -1 : 1)

				if (r !== undefined) {
					r = r / thermo.data.stageMetadata.pixelSize
					return {x, y, r}
				}

				return {x, y};
			}),
			absoluteReference: this.data.reference.map(({x, y, r}) => {
				if (r !== undefined)
					return {x, y, r}
				return {x, y};
			})
		};
	}

	extraData(data) {
		this.data.data = data;
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
	}

	// Requires an update based on the pixelSizeConstant given by the user due to Pathfinder/NSS not giving the pixel size
	update(thermo) {
		this.data.pixelSize = thermo.data.stageMetadata.pixelSize;
		this.data.reference = this.data.reference.map(({x, y, r}) => {
			// Absolute position in mm
			x = (x * thermo.data.metadata.width * thermo.data.stageMetadata.pixelSize / 1000) + (parseFloat(this.data.data.xposition.data) - (thermo.data.metadata.width / 2 * thermo.data.stageMetadata.pixelSize / 1000)) * 1000;
			y = (y * thermo.data.metadata.height * thermo.data.stageMetadata.pixelSize / 1000) + (parseFloat(this.data.data.yposition.data) - (thermo.data.metadata.height / 2 * thermo.data.stageMetadata.pixelSize / 1000)) * 1000;

			if (r !== undefined) {
				r = r * thermo.data.stageMetadata.pixelSize;
				return {x, y, r};
			}

			return {x, y};
		})

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