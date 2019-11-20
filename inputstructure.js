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
				let parse = undefined;
				if (ext.startsWith('*'))
					parse = 'endsWith';
				else if (ext.endsWith('*'))
					parse = 'startsWith';

				if (needs && needs.length > 0) {
					if (uses && uses.length > 0)
						this.useTypes.push({
							parse, ext: ext.replace(/\*/, ''), type, needs, uses: uses.map(str => {
								const [type, filename] = str.split(':');
								return {
									type,
									filename
								};
							}), resolvesIn: Infinity
						});
					else
						this.needTypes.push({parse, ext: ext.replace(/\*/, ''), type, needs});
				} else if (uses && uses.length > 0)
					this.useTypes.push({
						parse, ext: ext.replace(/\*/, ''), type, uses: uses.map(str => {
							const [type, filename] = str.split(':');
							return {
								type,
								filename
							};
						}), resolvesIn: Infinity
					});
				else
					this.baseTypes.push({parse, ext: ext.replace(/\*/, ''), type});
			}
		}

		this.needTypes.sort(({needs: needs1}, {needs: needs2}) => needs1.length - needs2.length);

		let resolved = new Map(this.baseTypes.concat(this.needTypes).map(e => [e.type, 1]));
		let useTypes = new Map(this.useTypes.map(e => [e.type, e.uses.map(({type}) => type)]));
		const resolve = (lastType, type) => {
			if (resolved.has(type))
				return resolved.get(type);
			else if (!useTypes.has(type))
				throw `Unknown type ${type} required by ${lastType}`;
			useTypes.get(type).map(resolve);
		};

		this.useTypes.sort(({type: type1, uses: uses1}, {type: type2, uses: uses2}) => {
			let resolve1 = 0;
			let resolve2 = 0;

			if (!resolved.has(type1)) {
				resolve1 = uses1.reduce(resolve.bind(type1));
				resolved.set(type1, resolve1);
			} else
				resolve1 = resolved.get(type1);

			if (!resolved.has(type2)) {
				resolve2 = uses2.reduce(resolve.bind(type2));
				resolved.set(type2, resolve2);
			} else
				resolve2 = resolved.get(type2);

			return resolve1 - resolve2;
		});
	}

	process(reimager, files, subDirs = new Map()) {
		let resolved = new Map();

		for (const {parse, ext, type} of this.baseTypes) {
			const typeConstructor = this.types.get(type);
			files.filter(({name}) => (parse === undefined) ? (name === ext) : (name[parse](ext)))
				.map(file => {
					const typeFile = typeConstructor(file, reimager);
					resolved.set(typeFile.getName(), typeFile);
				});
		}

		for (const {parse, ext, type, needs} of this.needTypes) {
			const typeConstructor = this.types.get(type);
			files.filter(({name}) => (parse === undefined) ? (name === ext) : (name[parse](ext)))
				.map(file => {
					const typeFile = typeConstructor(file, reimager, needs.map(str => {
						const location = str.split('/').filter(e => e);
						let file = subDirs.get(location.pop());
						while (location.length > 1)
							file = file.getSubDirectory(location);
						return file.getFile(location.pop());
					}));
					resolved.set(typeFile.getName(), typeFile);
				});
		}

		for (const {parse, ext, type, needs = [], uses} of this.useTypes) {
			const typeConstructor = this.types.get(type);
			files.filter(({name}) => (parse === undefined) ? (name === ext) : (name[parse](ext)))
				.map(file => {
					const typeFile = typeConstructor(file, reimager, needs.map(str => {
						const location = str.split('/').filter(e => e);
						let file = subDirs.get(location.pop());
						while (location.length > 1)
							file = file.getSubDirectory(location);
						return file.getFile(location.pop());
					}), uses.map(({type, filename: str}) => {
						const location = str.split('/').filter(e => e);
						if (location.length === 0) {
							resolved.get();
						} else {
							let file = subDirs.get(location.pop());
							while (location.length > 1)
								file = file.getSubDirectory(location);

							return file.getFile(location.pop());
						}
					}));
					resolved.set(typeFile.getName(), typeFile);
				});
		}
	}
};