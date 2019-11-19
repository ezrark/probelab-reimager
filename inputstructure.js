const constants = require('./newConstants.json');

module.exports = class InputStructure {
	constructor(structure) {
		this.types = new Map();
		this.baseTypes = [];
		this.needTypes = [];
		this.useTypes = [];

		for (const {type, file, req} of structure) {
			this.types.set(type, require(__dirname + file));

			for (const {ext, needs, uses} of req) {
				let parse = constants.inputStruct.parseTypes.WHOLEEXT;
				if (ext.startsWith('*'))
					parse = constants.inputStruct.parseTypes.STARTS;
				else if (ext.endsWith('*'))
					parse = constants.inputStruct.parseTypes.ENDS;

				if (needs && needs.length > 0) {
					if (uses && uses.length > 0)
						this.useTypes.push({parse, type, needs, uses, resolvesIn: Infinity});
					else
						this.needTypes.push({parse, type, needs});
				} else if (uses && uses.length > 0)
					this.useTypes.push({parse, type, uses, resolvesIn: Infinity});
				else
					this.baseTypes.push({parse, type});
			}
		}

		this.needTypes.sort(({needs: needs1}, {needs: needs2}) => needs1.length - needs2.length);

		let resolved = new Map(this.baseTypes.concat(this.needTypes).map(e => [e.type, 0]));
		let useTypes = new Map(this.useTypes.map(e => [e.type, e.uses]));
		const resolve = type => {
			if (resolved.has(type))
				return resolved.get(type);
			else
			if (!useTypes.has(type))
				throw `Unknown type ${type} required by ${type1}`;
			useTypes.get(type).map(resolve);
		};

		this.useTypes.sort(({type: type1, uses: uses1}, {type: type2, uses: uses2}) => {
			let resolve1 = 0;
			let resolve2 = 0;

			if (!resolved.has(type1)) {
				resolve1 = uses1.reduce(resolve);
				resolved.set(type1, resolve1);
			} else
				resolve1 = resolved.get(type1);

			if (!resolved.has(type2)) {
				resolve2 = uses2.reduce(resolve);
				resolved.set(type2, resolve2);
			} else
				resolve2 = resolved.get(type2);

			return resolve1 - resolve2;
		});
	}

	process(files, subDirs) {

	}
};