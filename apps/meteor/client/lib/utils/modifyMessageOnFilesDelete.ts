import { isFileAttachment } from '@rocket.chat/core-typings';
import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';

/**
 * Clone a message and clear or replace its file attachments.
 *
 * - Performs a deep clone via `structuredClone` to avoid mutating the source.
 * - Removes the single-file `file` field and empties the `files` array.
 * - If `replaceFileAttachmentsWith` is given, swaps out any file-type
 *   attachments; otherwise filters them out entirely.
 *
 * @param message  The original `IMessage` to copy.
 * @param replaceFileAttachmentsWith
 *   Optional attachment to substitute for each file attachment.
 * @returns A new message object with `file`, `files`, and `attachments` updated.
 */

export const modifyMessageOnFilesDelete = <T extends IMessage = IMessage>(message: T, replaceFileAttachmentsWith?: MessageAttachment) => {
	const updated = structuredClone(message);
	delete updated.file;
	let { attachments } = message;

	if (replaceFileAttachmentsWith) {
		attachments = attachments?.map((att) => (isFileAttachment(att) ? replaceFileAttachmentsWith : att));
	} else {
		attachments = attachments?.filter((att) => !isFileAttachment(att));
	}

	Object.assign(updated, {
		files: [],
		...(attachments && { attachments }),
	});

	return updated;
};
