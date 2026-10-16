/**
 * A file attached to a message.
 *
 * It names the file rather than carrying it: read the contents with
 * `IUploadRead.getBufferById`.
 */
export interface IMessageFile {
	/** The upload's identifier. */
	_id: string;
	/** The file name shown to users. */
	name: string;
	/** The file's MIME type. */
	type: string;
	/** The first half of the MIME type, which decides how the client renders the file. */
	typeGroup?: string;
}
