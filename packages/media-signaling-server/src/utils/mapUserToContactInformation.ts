import type { AtLeast, IUser, MediaCallContactInformation } from '@rocket.chat/core-typings';

export function mapUserToContactInformation({
	name,
	username,
	freeSwitchExtension,
}: AtLeast<IUser, 'name' | 'username'>): MediaCallContactInformation {
	return {
		...(name && { name }),
		...(username && { username }),
		...(freeSwitchExtension && { number: freeSwitchExtension }),
	};
}
