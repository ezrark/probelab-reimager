const constants = require('./newConstants.json');

function resolveName(input, refs = []) {
	let parse = undefined;
	const path = input.split('/');
	input = path.pop();

	if (input) {
		if (input.startsWith('*')) {
			parse = 'endsWith';
			input = input.slice(1);
		} else if (input.endsWith('*')) {
			parse = 'startsWith';
			input = input.slice(0, input.length - 1);
		}

		for (const [type, value] of refs)
			input = input.replace(new RegExp(`(<${type}>)`, 'g'), value);
	}

	return {parse, name: path.join('/') + input};
}

class FileSet {
	constructor() {
		this.files = new Map();
	}

	getFiles() {
		return this.files;
	}

	getType(type) {
		return this.files.get(type);
	}

	findFile(name, type = undefined, operation = undefined) {
		if (type) {
			const easy = this.files.get(type).get(name);
			if (easy)
				return easy;

			for (const [, file] of this.files.get(type))
				if (operation === undefined) {
					if (file.getName() === name)
						return file;
				} else if ((file.getName())[operation](name))
					return file;

		} else
			for (const [, files] of this.files)
				for (const [, file] of files)
					if (operation === undefined) {
						if (file.getName() === name)
							return file;
					} else if ((file.getName())[operation](name))
						return file;
	}

	resolve(type, file) {
		let resolvedType = this.files.get(type);
		if (resolvedType === undefined) {
			resolvedType = new Map();
			this.files.set(type, resolvedType);
		}

		resolvedType.set(file.getFullName(), file);
	}
}

module.exports = class InputStructure {
	constructor(structure) {
		this.types = [];
		this.baseTypes = new Map();
		this.needTypes = new Map();
		this.useTypes = new Map();
		this.useFakeTypes = new Map();
		this.startExt = new Map();
		this.endExt = new Map();
		this.equalExt = new Map();

		let useTypes = [];

		for (const {type, file, req} of structure) {
			const module = require(__dirname + file);
			let typeStruct = {
				type,
				module,
				needs: 1,
				uses: []
			};

			for (const {ext: baseExt, needs, uses} of req) {
				if (baseExt === undefined) {
					this.useFakeTypes.set(type, {
						module,
						needs,
						uses: uses.map(str => {
							const [type, filename] = str.split(':');
							return {
								type,
								filename
							};
						})
					});
				} else {
					const ext = baseExt.replace(/\*/, '').toLowerCase();

					if (baseExt.startsWith('*')) {
						const exts = this.endExt.get(ext[ext.length - 1]);
						if (exts) {
							const types = exts.get(ext);
							if (types)
								types.push(type);
							else
								exts.set(ext, [type]);
						} else
							this.endExt.set(ext[ext.length - 1], new Map([[ext, [type]]]));
					} else if (baseExt.endsWith('*')) {
						const exts = this.startExt.get(ext[0]);
						if (exts) {
							const types = exts.get(ext);
							if (types)
								types.push(type);
							else
								exts.set(ext, [type]);
						} else
							this.startExt.set(ext[0], new Map([[ext, [type]]]));
					} else {
						const types = this.startExt.get(ext);
						if (types)
							types.push(type);
						else
							this.equalExt.set(ext, type);
					}

					const structure = {
						needs,
						uses: uses ? uses.map(str => {
							const [type, filename] = str.split(':');
							return {
								type,
								filename
							};
						}) : undefined
					};

					if (uses && uses.length > 0)
						this.useTypes.set(type, structure);
					else if (needs && needs.length > 0)
						this.needTypes.set(type, structure);
					else
						this.baseTypes.set(type, structure);

					if (needs)
						typeStruct.needs = needs.length + 1;

					if (structure.uses) {
						typeStruct.uses = structure.uses.map(({type}) => type);

						useTypes.push(typeStruct);
					} else
						this.types.push(typeStruct);
				}
			}
		}

		this.types.sort(({needs: needs1}, {needs: needs2}) => needs1 - needs2);
		const resolved = new Map(this.types.map(({type, needs}) => [type, needs]));
		const unresolvedUses = new Map(useTypes.map(({type, needs, uses}) => [type, {needs, uses: uses ? uses : []}]));

		const resolve = (lastType, type) => {
			if (resolved.has(type))
				return resolved.get(type);
			else if (!unresolvedUses.has(type))
				throw `Unknown type ${type.type} required by ${lastType}`;
			const unresolved = unresolvedUses.get(type);
			return unresolved.needs.map(resolve.bind(this, type)) + unresolved.uses.map(resolve.bind(this, type));
		};

		this.types.concat(useTypes.sort(({type: type1, needs: needs1, uses: uses1}, {type: type2, needs: needs2, uses: uses2}) => {
			let resolve1 = 0;
			let resolve2 = 0;

			if (!resolved.has(type1)) {
				resolve1 = uses1.map(({type}) => type).reduce(resolve.bind(this, type1));
				resolved.set(type1, resolve1 + needs1);
			} else
				resolve1 = resolved.get(type1);

			if (!resolved.has(type2)) {
				resolve2 = uses2.map(({type}) => type).reduce(resolve.bind(this, type2));
				resolved.set(type2, resolve2 + needs2);
			} else
				resolve2 = resolved.get(type2);

			return (needs1 + resolve1) - (resolve2 + needs2);
		}));

		console.log();
	}

	equals(ext) {
		const types = this.equalExt.get(ext);
		return types ? types : [];
	}

	startsWith(ext) {
		const exts = this.startExt.get(ext[0]);
		let types = [];
		if (exts)
			types = exts.get(ext);
		return types;
	}

	endsWith(ext) {
		const exts = this.endExt.get(ext[ext.length - 1]);
		let types = [];
		if (exts)
			types = exts.get(ext);
		return types;
	}

	process(reimager, files, subDirs = new Map()) {
		let resolved = new FileSet();
		const types = files.reduce((files, file) => {
			const ext = file.name.split('.').pop().toLowerCase();
			for (type of this.equals(ext).concat(this.startExt(ext)).concat(this.endExt(ext))) {
				const e = files.get(type);
				if (e)
					e.push(file);
				else
					files.set(type, [file]);
			}

			return files;
		}, new Map());

		const getRequiredFile = (name, type, str, prependName = true) => {
			if (str) {
				const {name: resolvedStr, parse} = resolveName(str, [['name', name.split('.')[0]]]);
				const location = resolvedStr.split('/').filter(e => e);
				if (location.length === 1)
					return resolved.findFile(`${prependName ? `${name.split('.')[0]}.` : ''}${location[0]}`, prependName ? undefined : type, parse);
				else {
					let file = subDirs.get(location.pop());
					while (location.length > 1)
						file = file.getSubDirectory(location);

					return file.getFile(file.name, type);
				}
			} else
				return resolved.findFile(name, type);
		};

		for (const {type} of this.baseTypes) {
			const typeConstructor = this.types.get(type);
			const files = types.get(type);

			if (files)
				for (const {uri, stats} of files)
					try {
						resolved.resolve(type, new typeConstructor({uri, stats}, reimager));
					} catch (err) {
					}
		}

		for (const {type, needs} of this.needTypes) {
			const typeConstructor = this.types.get(type);
			const files = types.get(type);

			if (files)
				for (const {uri, stats} of files)
					try {
						resolved.resolve(type, new typeConstructor({uri, stats}, reimager,
							needs.map(str => getRequiredFile(name, type, str))
						));
					} catch (err) {
					}
		}

		for (const {type, needs, uses} of this.needTypes) {
			const typeConstructor = this.types.get(type);
			const files = types.get(type);

			if (files)
				for (const {uri, stats} of files)
					try {
						resolved.resolve(type, new typeConstructor({uri, stats}, reimager,
							needs.map(str => getRequiredFile(name, type, str)),
							uses.map(({type, filename: str}) => getRequiredFile(name, type, str, false))
						));
					} catch (err) {
					}
		}

		for (const {type, uses, module} of this.useFakeTypes)
			try {
				if (uses.length === 1) {
					const potential = resolved.getType(uses[0].type);
					if (potential === undefined)
						continue;
					if (uses[0].filename) {
						for (const [name, data] of potential)
							if (name === uses[0].filename)
								resolved.resolve(type, new module(data.getDirectoryUri(), reimager, [data]));
					} else
						for (const [, data] of potential)
							resolved.resolve(type, new module(data.getDirectoryUri(), reimager, [data]));
				} else
					for (const [, data] of resolved.getType(uses[0].type)) {
						const {parse, name} = resolveName(uses[1].filename, [[uses[0].type, data.getName()]]);

						let wantedFiles = [];

						for (const [, files] of resolved.getFiles())
							for (const [, otherData] of files)
								if (parse === undefined) {
									if (otherData.getName() === name)
										wantedFiles.push(otherData);
								} else if (otherData.getName()[parse](name))
									wantedFiles.push(otherData);

						resolved.resolve(type, new module(data.getDirectoryUri(), reimager, [data, wantedFiles]));
					}
			} catch (err) {
			}

		return resolved;
	}
};