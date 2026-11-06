import type { IContact } from '@rocket.chat/core-typings';

export const isContactFavoriteEditable = ({ source, syncProvider }: Pick<IContact, 'source' | 'syncProvider'>): boolean =>
	source === 'local' || syncProvider === 'graph';
