import type { LabelRef } from '@rocket.chat/core-typings';
import { SYSTEM_LABEL_KEYS } from '@rocket.chat/core-typings';

// Select inputs carry plain strings, so a label reference travels through forms as `system:<key>` or `user:<id>`.

export const encodeLabelRef = (ref: LabelRef): string => (ref.type === 'system' ? `system:${ref.key}` : `user:${ref._id}`);

export const decodeLabelRef = (value: string): LabelRef | undefined => {
	const separator = value.indexOf(':');
	const type = value.slice(0, separator);
	const id = value.slice(separator + 1);

	if (type === 'system') {
		const key = SYSTEM_LABEL_KEYS.find((systemKey) => systemKey === id);
		return key ? { type: 'system', key } : undefined;
	}

	if (type === 'user' && id) {
		return { type: 'user', _id: id };
	}

	return undefined;
};
