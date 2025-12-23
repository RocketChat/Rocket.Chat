import fs from 'fs';
import Stream, { Readable, Writable } from 'stream';

import { UploadFS } from './ufs';

type TempUploadFileDeps = {
	UploadFS: typeof UploadFS;
};

const noop = () => void 0;

export class TempUploadFile {
	private readonly path: string;

	private readonly writableStream: fs.WriteStream;

	private readableStream: fs.ReadStream | undefined;

	private pipeline: (NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream)[] = [];

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

	public hasFinishedWriting(): boolean {
		return this.writableStream.writableFinished;
	}

	public getReadableStream(): Readable {
		const stream = this.getLastFromPipeline();

		if (stream && !(stream instanceof Readable)) {
			throw new Error("The last element in the pipeline is not a Readable stream, pipeline can't be extended");
		}

		return stream || this.getNewReadableStream();
	}

	public getLastFromPipeline(): NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream | undefined {
		if (this.pipeline.length === 0) {
			return undefined;
		}

		return this.pipeline.at(-1);
	}

	public getNewReadableStream(): fs.ReadStream {
		if (!this.hasFinishedWriting()) {
			throw new Error('Cannot create readable stream before writing is finished');
		}

		this.readableStream = fs.createReadStream(this.path);

		this.pipeline = [this.readableStream];

		this.wrapPipe(this.readableStream);

		return this.readableStream;
	}

	public safeUnlink(): void {
		void fs.promises.unlink(this.path).catch(noop);
	}

	private wrapPipe<T extends NodeJS.ReadableStream>(stream: T): T {
		const pipe = stream.pipe.bind(stream);
		const wrap = this.wrapPipe.bind(this);
		const { pipeline } = this;

		stream.pipe = function <T extends NodeJS.WritableStream>(destination: T, options?: any) {
			console.log('PIPE CALLED', { pipeline, origin: { $: { $: this } }, destination: { $: { $: destination } } });
			if (destination instanceof Readable) {
				wrap(destination);
			}

			pipeline.push(destination);

			return pipe(destination, options);
		};

		return stream;
	}

	private destroy(): void {
		// Do we need custom cleanup logic here?
	}
}
