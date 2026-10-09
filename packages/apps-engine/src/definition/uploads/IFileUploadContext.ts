import type { IUploadDetails } from './IUploadDetails';

/**
 * The upload as the engine tracks it before the contents are read.
 *
 * Internal to the framework: an App receives {@link IFileUploadContext}.
 */
export interface IFileUploadInternalContext {
	/** What is known about the file. */
	file: IUploadDetails;
	/** Where the contents sit in the configured store. */
	path: string;
}

/** The upload an `IPreFileUpload` handler inspects. */
export interface IFileUploadContext {
	/** What is known about the file. */
	file: IUploadDetails;
	/** The file's full contents, already read by Rocket.Chat. */
	content: Buffer;
}
