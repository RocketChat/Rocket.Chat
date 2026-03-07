import stream from 'stream';
import type { Readable, Writable } from 'stream';

// Type imports are completely safe, they disappear when compiled.
import type { WebDAVClient, FileStat, ResponseDataDetailed, WebDAVClientOptions } from 'webdav';

export class WebdavClientAdapter {
	private _clientPromise: Promise<WebDAVClient> | null = null;

	private serverConfig: string;

	private cred: WebDAVClientOptions;

	constructor(serverConfig: string, cred: WebDAVClientOptions) {
		this.serverConfig = serverConfig;
		this.cred = cred;
	}

	// Lazy loader for the ESM webdav client
	private async getClient(): Promise<WebDAVClient> {
		if (!this._clientPromise) {
			this._clientPromise = import('webdav').then(({ createClient }) => {
				if (this.cred.token) {
					return createClient(this.serverConfig, { token: this.cred.token });
				}
				return createClient(this.serverConfig, {
					username: this.cred.username,
					password: this.cred.password,
				});
			});
		}
		return this._clientPromise;
	}

	async stat(path: string): Promise<FileStat | ResponseDataDetailed<FileStat>> {
		try {
			const client = await this.getClient();
			return await client.stat(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error checking if directory exists on webdav');
		}
	}

	async createDirectory(path: string): Promise<void> {
		try {
			const client = await this.getClient();
			return await client.createDirectory(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error creating directory on webdav');
		}
	}

	async deleteFile(path: string): Promise<void> {
		try {
			const client = await this.getClient();
			return await client.deleteFile(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error deleting file on webdav');
		}
	}

	async getFileContents(filename: string): Promise<Buffer> {
		try {
			const client = await this.getClient();
			return (await client.getFileContents(filename)) as Buffer;
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error getting file contents webdav');
		}
	}

	async getDirectoryContents(path: string): Promise<FileStat[] | ResponseDataDetailed<FileStat[]>> {
		try {
			const client = await this.getClient();
			return await client.getDirectoryContents(path);
		} catch (error: any) {
			throw new Error(error.response?.statusText ? error.response.statusText : 'Error getting directory contents webdav');
		}
	}

	async putFileContents(path: string, data: Buffer, options: Record<string, any> = {}): Promise<any> {
		try {
			const client = await this.getClient();
			return await client.putFileContents(path, data, options);
		} catch (error: any) {
			throw new Error(error.response?.statusText ?? 'Error updating file contents.');
		}
	}

	createReadStream(path: string, options?: Record<string, any>): Readable {
		const pt = new stream.PassThrough();

		this.getClient()
			.then((client) => {
				const rs = client.createReadStream(path, options);
				rs.pipe(pt);
				rs.on('error', (err) => pt.emit('error', err));
			})
			.catch((err) => pt.emit('error', err));

		return pt;
	}

	createWriteStream(path: string, fileSize: number): Writable {
		const ws = new stream.PassThrough();

		this.getClient()
			.then((client) => {
				client
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
			})
			.catch((err) => ws.emit('error', err));

		return ws;
	}
}
