declare module 'webdav' {
	type Stat = {
		filename: string;
		basename: string;
		lastmod: string | null;
		size: number;
		type: string;
		mime: string;
		etag: string | null;
		props: Record<string, any>;
	};

	type WebDavClient = {
		copyFile(remotePath: string, targetRemotePath: string, options?: Record<string, any>): Promise<any>;
		createDirectory(dirPath: string, options?: Record<string, any>): Promise<Response>;
		createReadStream(remoteFileName: string, options?: Record<string, any>): ReadableStream;
		createWriteStream(remoteFileName: string, options?: Record<string, any>, callback?: Function): WritableStream;
		customRequest(remotePath: string, requestOptions: Record<string, any>, options?: Record<string, any>): Promise<any>;
		deleteFile(remotePath: string, options?: Record<string, any>): Promise<Response>;
		exists(remotePath: string, options?: Record<string, any>): Promise<boolean>;
		getDirectoryContents(remotePath: string, options?: Record<string, any>): Promise<Array<Stat>>;
		getFileContents(remoteFileName: string, options?: Record<string, any>): Promise<Buffer | string>;
		getFileDownloadLink(remoteFileName: string, options?: Record<string, any>): string;
		getFileUploadLink(remoteFileName: string, options?: Record<string, any>): string;
		getQuota(options?: Record<string, any>): Promise<null | object>;
		moveFile(remotePath: string, targetRemotePath: string, options?: Record<string, any>): Promise<any>;
		putFileContents(remoteFileName: string, data: string | Buffer, options?: Record<string, any>): Promise<any>;
		stat(remotePath: string, options?: Record<string, any>): Promise<any>;
	};

	export function createClient(remoteURL: string, opts?: Record<string, any>): WebDavClient;
}
