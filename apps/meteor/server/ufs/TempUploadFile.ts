import fs from 'fs';

import { UploadFS } from './ufs';

type TempUploadFileDeps = {
	UploadFS: typeof UploadFS;
};

const noop = () => void 0;

export class TempUploadFile {
	private readonly path: string;

	private readonly writableStream: fs.WriteStream;

	private readableStream: fs.ReadStream | undefined;

	public static create(): TempUploadFile {
		return new TempUploadFile({ UploadFS }, Math.random().toString(36));
	}

	constructor(
		{ UploadFS }: TempUploadFileDeps,
		private readonly fileId: string,
	) {
		this.path = UploadFS.getTempFilePath(this.fileId);
		this.writableStream = fs.createWriteStream(this.path);

		this.writableStream.once('error', this.safeUnlink.bind(this));
	}

	public getWritableStream(): fs.WriteStream {
		return this.writableStream;
	}

	public getBytesWritten(): number {
		return this.writableStream.bytesWritten;
	}

	public isWritingFinished(): boolean {
		return this.writableStream.writableFinished;
	}

	public getReadableStream(): fs.ReadStream {
		return this.readableStream ?? this.getNewReadableStream();
	}

	public getNewReadableStream(): fs.ReadStream {
		if (!this.isWritingFinished()) {
			throw new Error('Cannot create readable stream before writing is finished');
		}

		this.readableStream = fs.createReadStream(this.path);
		return this.readableStream;
	}

	public safeUnlink(): void {
		void fs.promises.unlink(this.path).catch(noop);
	}
}
