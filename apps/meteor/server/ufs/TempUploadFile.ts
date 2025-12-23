import fs from 'fs';
import { Readable } from 'stream';

import { UploadFS } from './ufs';

type TempUploadFileDeps = {
	UploadFS: typeof UploadFS;
};

const noop = () => void 0;

const registry = new FinalizationRegistry((id: NonNullable<unknown>) => {
	console.log('TEMP UPLOAD FILE FINALIZED, CLEANING UP', { id });
});

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

		registry.register(this, { kind: this.constructor.name, id: this.path.substring(0) });
		registry.register(this.writableStream, { kind: this.writableStream.constructor.name, id: this.path.substring(0) });
		registry.register(this.pipeline, { kind: 'Pipeline', id: this.path.substring(0) });

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
		registry.register(stream, { kind: stream.constructor.name, id: this.path.substring(0) });
		const pipe = stream.pipe.bind(stream);
		const wrap = this.wrapPipe.bind(this);
		const { pipeline } = this;

		stream.pipe = function <T extends NodeJS.WritableStream>(destination: T, options?: any) {
			console.log('PIPE CALLED', {
				pipeline,
				origin: { $: { $: this }, didRead: (this as Readable).readableDidRead },
				destination: { $: { $: destination } },
			});
			if (destination instanceof Readable) {
				wrap(destination);
			} else {
				registry.register(destination, { kind: destination.constructor.name, id: pipeline.at(0)?.path?.substring(0) });
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
