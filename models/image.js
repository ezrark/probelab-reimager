const GeneralFile = require('./file.js');

module.exports = class GeneralImage extends GeneralFile {
	constructor(imageUri, reimager, metaFile=undefined, {x, y, z}) {
		super(imageUri, reimager);

		if (metaFile !== undefined)
			this.data.metadata = metaFile;
		else
			this.data.metadata = {

			};

		this.data.position = {x, y, z};

		this.data.backup = {
			position: {x, y, z}
		}
	}

	resetPosition() {
		const {x, y, z} = this.data.backup.position;
		this.data.position = {x, y, z};
	}

	usePosition(x=this.data.position.x, y=this.data.position.y, z=this.data.position.z) {
		this.data.position = {x, y, z};
	}

	getPosition() {
		return this.data.position
	}

	getMetadata() {
		return this.data.metadata;
	}

	serialize() {
		let fileSerial = super.serialize();

		fileSerial.position = this.getPosition();
		fileSerial.metadata = this.getMetadata().serialize();

		return fileSerial;
	}
};