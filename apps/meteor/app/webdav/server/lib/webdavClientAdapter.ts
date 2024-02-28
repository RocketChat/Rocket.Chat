import stream from 'stream';
import type { Readable, Writable } from 'stream';

import type { WebDAVClient, FileStat, ResponseDataDetailed, WebDAVClientOptions } from 'webdav';
import { createClient } from 'webdav';

export class WebdavClientAdapter {
	_client: WebDAVClient;

	constructor(serverConfig: string, cred: WebDAVClientOptions) {
		if (cred.token) {
			this._client = createClient(serverConfig, { token: cred.token });
		} else {
			this._client = createClient(serverConfig, {
				username: cred.username,
				password: cred.password,
			});
		}
	}

	async stat(path: string): Promise<FileStat | ResponseDataDetailed<FileStat>> {
		try {
			return await this._client.stat(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error checking if directory exists on webdav');
		}
	}

	async createDirectory(path: string): Promise<void> {
		try {
			return await this._client.createDirectory(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error creating directory on webdav');
		}
	}

	async deleteFile(path: string): Promise<void> {
		try {
			return await this._client.deleteFile(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error deleting file on webdav');
		}
	}

	async getFileContents(filename: string): Promise<Buffer> {
		try {
			return (await this._client.getFileContents(filename)) as Buffer;
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error getting file contents webdav');
		}
	}

	async getDirectoryContents(path: string): Promise<FileStat[] | ResponseDataDetailed<FileStat[]>> {
		try {
			return await this._client.getDirectoryContents(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error getting directory contents webdav');
		}
	}

	async putFileContents(path: string, data: Buffer, options: Record<string, any> = {}): Promise<any> {
		try {
			return await this._client.putFileContents(path, data, options);
		} catch (error: any) {
			throw new Error(error.response?.statusText ?? 'Error updating file contents.');
		}
	}

	createReadStream(path: string, options?: Record<string, any>): Readable {
		return this._client.createReadStream(path, options);
	}

	createWriteStream(path: string, fileSize: number): Writable {
		const ws = new stream.PassThrough();

		this._client
			.customRequest(path, {
				method: 'PUT',
				headers: {
					...(fileSize ? { 'Content-Length': String(fileSize) } : {}),
				},
				data: ws,
				maxRedirects: 0,
			})
			.catch((err) => {
				ws.emit('error', err);
			});

		return ws;
	}
}
