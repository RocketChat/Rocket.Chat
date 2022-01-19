import { createClient, WebDavClient, Stat } from 'webdav';

export type ServerCredentials = {
	token?: string;
	username?: string;
	password?: string;
};

export class WebdavClientAdapter {
	_client: WebDavClient;

	constructor(serverConfig: string, cred: ServerCredentials) {
		if (cred.token) {
			this._client = createClient(serverConfig, { token: cred.token });
		} else {
			this._client = createClient(serverConfig, {
				username: cred.username,
				password: cred.password,
			});
		}
	}

	async stat(path: string): Promise<undefined> {
		try {
			return await this._client.stat(path);
		} catch (error) {
			throw new Error(
				error.response && error.response.statusText ? error.response.statusText : 'Error checking if directory exists on webdav',
			);
		}
	}

	async createDirectory(path: string): Promise<Response> {
		try {
			return await this._client.createDirectory(path);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error creating directory on webdav');
		}
	}

	async deleteFile(path: string): Promise<Response> {
		try {
			return await this._client.deleteFile(path);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error deleting file on webdav');
		}
	}

	async getFileContents(filename: string): Promise<Buffer> {
		try {
			return (await this._client.getFileContents(filename)) as Buffer;
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error getting file contents webdav');
		}
	}

	async getDirectoryContents(path: string): Promise<Array<Stat>> {
		try {
			return await this._client.getDirectoryContents(path);
		} catch (error) {
			throw new Error(error.response && error.response.statusText ? error.response.statusText : 'Error getting directory contents webdav');
		}
	}

	async putFileContents(path: string, data: Buffer, options: Record<string, any> = {}): Promise<any> {
		try {
			return await this._client.putFileContents(path, data, options);
		} catch (error) {
			throw new Error(error.response?.statusText ?? 'Error updating file contents.');
		}
	}

	createReadStream(path: string, options?: Record<string, any>): ReadableStream {
		return this._client.createReadStream(path, options);
	}

	createWriteStream(path: string): WritableStream {
		return this._client.createWriteStream(path);
	}
}
