import type { MessageAttachment } from './MessageAttachment';
import type { MessageAttachmentDefault } from './MessageAttachmentDefault';

export interface ITranslatedMessageAttachment extends MessageAttachmentDefault {
	translations: { [language: string]: string };
}

export const isTranslatedAttachment = (attachment: MessageAttachment): attachment is ITranslatedMessageAttachment =>
	'translations' in attachment;

export const isTranslatedMessageAttachment = (attachments: MessageAttachment[]): attachments is ITranslatedMessageAttachment[] =>
	attachments?.some(isTranslatedAttachment);
