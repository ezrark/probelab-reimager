module.exports = class GeneralFile {
    constructor(uri, reimager) {
        const name = uri.split('/').pop().split('.');

        this.data = {
            uri,
            dirUri: uri.slice(0, uri.lastIndexOf('/')),
            extension: name.pop(),
            name: name.join('.'),
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
        return `${this.data.name}.${this.data.extension}`;
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