import type { MessageTypesValues } from '@rocket.chat/core-typings';

/** `mute_unmute` is a single setting option covering two different message types */
export const expandSystemMessageOptions = (types: MessageTypesValues[]): Set<MessageTypesValues> =>
	new Set(types.flatMap<MessageTypesValues>((type) => (type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type])));
