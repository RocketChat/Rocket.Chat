import { isFileAttachment, isQuoteAttachment, isRemovedFileAttachment } from '@rocket.chat/core-typings';
import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type { E2EESearchDoc, E2EESearchDocKind } from '@rocket.chat/desktop-api';

export const MAX_SEARCH_DOC_BODY_LENGTH = E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits;

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

/** Keep complete Unicode characters within the shared body limit. */
export const cutSearchDocBody = (text: string, maxLength = MAX_SEARCH_DOC_BODY_LENGTH): string => {
	if (!Number.isInteger(maxLength) || maxLength < 0 || maxLength > MAX_SEARCH_DOC_BODY_LENGTH) {
		throw new RangeError('Invalid search document body limit');
	}
	if (text.length <= maxLength) {
		return text;
	}
	const capped = text.slice(0, maxLength);
	const last = capped.charCodeAt(capped.length - 1);
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
	if (isQuoteAttachment(attachment) || isRemovedFileAttachment(attachment)) {
		return [];
	}
	const { title, description, text } = attachment as { title?: unknown; description?: unknown; text?: unknown };
	const imageAlt = (attachment as { image_alt?: unknown }).image_alt;
	const texts = isFileAttachment(attachment) ? [description, text, imageAlt] : [title, description, text, imageAlt];
	return texts.filter((value): value is string => typeof value === 'string');
};

const fileTitle = (attachment: MessageAttachment): string | undefined =>
	isFileAttachment(attachment) && typeof attachment.title === 'string' ? attachment.title : undefined;

export const isDecryptFailed = (message: IMessage): boolean => (message as IMessage & { decryptFailed?: true }).decryptFailed === true;

export const isDeletionPlaceholder = (message: IMessage): boolean => message.t === 'rm';

/** Build a document without quoted text, removed files, or failed decryptions. Do not change the message. */
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
