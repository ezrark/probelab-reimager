module.exports = class GeneralFile {
    constructor({uri, stats}, reimager) {
        const name = uri.split('/').pop().split('.');

        this.data = {
            uri,
            dirUri: uri.slice(0, uri.lastIndexOf('/')),
            extension: name.length > 1 ? name.pop() : '',
            name: name.join('.'),
            stats,
            reimager
        }
    }

    getDirectoryUri() {
        return this.data.dirUri;
    }

    getUri() {
        return this.data.uri;
    }

    getExtension() {
        return this.data.extension;
    }

    getName() {
        return this.data.name;
    }

    getFullName() {
        if (this.data.extension === '')
            return this.data.name;
        return `${this.data.name}.${this.data.extension}`;
    }

    getModifiedTime() {
        return this.data.stats.mtimeMs;
    }

    getStats() {
        return this.data.stats;
    }

    getData() {

    }

    serialize() {
        return {
            uri: this.getUri(),
            extension: this.getExtension(),
            name: this.getName()
        }
    }
};