import * as UiKit from '@rocket.chat/ui-kit';

const textObjectTypes: readonly unknown[] = Object.values(UiKit.TextObjectType);

/** Whether a value an app sent where text is expected really is a text object, since payloads reach the renderer unchecked. */
export const isTextObject = (value: unknown): value is UiKit.TextObject =>
	typeof value === 'object' &&
	value !== null &&
	'type' in value &&
	textObjectTypes.includes(value.type) &&
	'text' in value &&
	typeof value.text === 'string';
