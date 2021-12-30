import { IUser } from '../../../definition/IUser';
import { E2EEFlags } from './E2EEFlags';

type GetFlagsParams = {
	readonly uid: IUser['_id'] | null | undefined;
	readonly embeddedLayout: boolean;
	readonly currentRoutePath: string | null | undefined;
	readonly enabled: boolean;
};

export const getE2EEFlags = ({ uid, embeddedLayout, currentRoutePath, enabled }: GetFlagsParams): E2EEFlags => {
	const supported = Boolean(window.crypto);
	const activable = Boolean(uid) && (!embeddedLayout || !currentRoutePath?.startsWith('/admin'));

	return {
		supported,
		activable,
		enabled,
	};
};
