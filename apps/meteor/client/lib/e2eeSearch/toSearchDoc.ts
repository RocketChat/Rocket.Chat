import { isFileAttachment, isQuoteAttachment, isRemovedFileAttachment } from '@rocket.chat/core-typings';
import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import type { E2EESearchDoc, E2EESearchDocKind } from '@rocket.chat/desktop-api';

/** The longest `body` that the desktop index accepts (`MAX_BODY_LENGTH` in the desktop `validate.ts`). */
export const MAX_SEARCH_DOC_BODY_LENGTH = 64 * 1024;

/** A URL query string or fragment longer than this is tracking or state, not words: it is removed from the body. */
const MAX_URL_TAIL_LENGTH = 32;

const URL_PATTERN = /\bhttps?:\/\/[^\s<>()[\]]+/gi;

const removeLongUrlTails = (text: string): string =>
	text.replace(URL_PATTERN, (url) => {
		const tailStart = url.search(/[?#]/);
		if (tailStart === -1 || url.length - tailStart <= MAX_URL_TAIL_LENGTH) {
			return url;
		}
		return url.slice(0, tailStart);
	});

/** Cuts a body to at most `maxLength` characters, without keeping half of a character. */
export const cutSearchDocBody = (text: string, maxLength = MAX_SEARCH_DOC_BODY_LENGTH): string => {
	if (text.length <= maxLength) {
		return text;
	}
	const capped = text.slice(0, maxLength);
	const last = capped.charCodeAt(capped.length - 1);
	// Do not keep half of a surrogate pair.
	return last >= 0xd800 && last <= 0xdbff ? capped.slice(0, -1) : capped;
};

const toEpochMs = (value: unknown): number | undefined => {
	if (value === undefined || value === null) {
		return undefined;
	}
	const ms = new Date(value as string | number | Date).getTime();
	return Number.isFinite(ms) ? ms : undefined;
};

const attachmentTexts = (attachment: MessageAttachment): string[] => {
	// The client adds a quote attachment at decrypt time with the text of another message.
	// That text is indexed under its own message, so the quoting message does not repeat it.
	if (isQuoteAttachment(attachment) || isRemovedFileAttachment(attachment)) {
		return [];
	}
	const { title, description, text } = attachment as { title?: unknown; description?: unknown; text?: unknown };
	const imageAlt = (attachment as { image_alt?: unknown }).image_alt;
	// The title of a file attachment is the file name: it goes to the end of the body, with the other file names.
	const texts = isFileAttachment(attachment) ? [description, text, imageAlt] : [title, description, text, imageAlt];
	return texts.filter((value): value is string => typeof value === 'string');
};

const fileTitle = (attachment: MessageAttachment): string | undefined =>
	isFileAttachment(attachment) && typeof attachment.title === 'string' ? attachment.title : undefined;

/**
 * True when the E2EE decrypt could not read the message (the room key is missing or wrong). The decrypt still sets
 * `e2e` to `done`, so this flag is the only sign that `msg` is a placeholder and the file names are the stored ones.
 */
export const isDecryptFailed = (message: IMessage): boolean => (message as IMessage & { decryptFailed?: true }).decryptFailed === true;

/**
 * Turns a decrypted end-to-end encrypted message into the document that the local search index stores.
 * It returns `undefined` for a message that has nothing to index. It does not change the message.
 */
export const toSearchDoc = (message: IMessage): E2EESearchDoc | undefined => {
	if (message.t !== 'e2e' || message.e2e !== 'done' || isDecryptFailed(message)) {
		return undefined;
	}

	const uid = message.u?._id;
	const ts = toEpochMs(message.ts);
	if (!message._id || !message.rid || !uid || ts === undefined) {
		return undefined;
	}

	const attachments = message.attachments ?? [];
	const fileNames = [message.file, ...(message.files ?? [])].map((file) => file?.name);
	const hasFile = fileNames.some(Boolean) || attachments.some((attachment) => isFileAttachment(attachment));

	const parts: string[] = [];
	const add = (value: string | undefined) => {
		const part = value?.trim();
		if (part && !parts.includes(part)) {
			parts.push(part);
		}
	};

	// A hit shows the start of the body, or some words around the match: the text that people wrote comes first, and
	// the file names come last, so a long file name does not push a caption out of the hit.
	add(message.msg);
	const textParts = parts.length;
	attachments.flatMap(attachmentTexts).forEach(add);
	attachments.map(fileTitle).forEach(add);
	fileNames.forEach(add);
	const hasAttachmentText = parts.length > textParts;

	const body = cutSearchDocBody(removeLongUrlTails(parts.join('\n')));
	if (!body.trim()) {
		return undefined;
	}

	let kind: E2EESearchDocKind = 'text';
	if (hasFile) {
		kind = 'file';
	} else if (hasAttachmentText) {
		kind = 'attachment';
	}

	return {
		id: message._id,
		rid: message.rid,
		...(message.tmid && { tmid: message.tmid }),
		uid,
		username: message.u.username ?? '',
		ts,
		updatedAt: toEpochMs(message._updatedAt) ?? ts,
		kind,
		body,
	};
};
