module.exports = class GeneralFile {
    constructor(uri, reimager) {
        let name = uri.split('/').pop();
        name.pop();

        this.data = {
            uri,
            extension: uri.split('.').pop(),
            name,
            reimager
        }
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