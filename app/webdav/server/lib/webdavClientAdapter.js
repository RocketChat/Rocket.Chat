import { createClient } from 'webdav';

export class WebdavClientAdapter {
	constructor(serverConfig, username, password) {
		this._client = createClient(
			serverConfig,
			{
				username,
				password,
			}
		);
	}

	async stat(path) {
		try {
			return await this._client.stat(path);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error checking if directory exists on webdav');
		}
	}

	async createDirectory(path) {
		try {
			return await this._client.createDirectory(path);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error creating directory on webdav');
		}
	}

	async deleteFile(path) {
		try {
			return await this._client.deleteFile(path);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error deleting file on webdav');
		}
	}

	async getFileContents(filename) {
		try {
			return await this._client.getFileContents(filename);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error getting file contents webdav');
		}
	}

	async getDirectoryContents(path) {
		try {
			return await this._client.getDirectoryContents(path);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error getting directory contents webdav');
		}
	}

	createReadStream(path, options) {
		return this._client.createReadStream(path, options);
	}

	createWriteStream(path) {
		return this._client.createWriteStream(path);
	}
}
