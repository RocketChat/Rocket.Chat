import type { AtLeast, IUser, MediaCallContactInformation } from '@rocket.chat/core-typings';
export declare function mapUserToContactInformation({ name, username, freeSwitchExtension, }: AtLeast<IUser, 'name' | 'username'>): MediaCallContactInformation;
