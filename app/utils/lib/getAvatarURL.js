import { getURL } from './getURL';

export const getAvatarURL = (identifier) => getURL(`/avatar/${ identifier }`);
