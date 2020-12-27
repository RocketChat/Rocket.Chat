import { useEffect, useState } from 'react';
import { useSafely } from '@rocket.chat/fuselage-hooks';

import { Presence } from '../lib/presence';
import { IUser } from '../../definition/IUser';

type PresenceValue = IUser['status'] | 'loading';

export const usePresence = (uid: IUser['_id'], presence?: IUser['status']): PresenceValue => {
	const [presenceValue, setPresenceValue] = useSafely(useState<PresenceValue>(presence ?? 'loading'));
	useEffect(() => {
		const handle = ({ status }: { status?: IUser['status'] } = {}): void => {
			setPresenceValue(status ?? 'loading');
		};

		Presence.listen(uid, handle);
		return (): void => {
			Presence.stop(uid, handle);
		};
	}, [setPresenceValue, uid]);

	return presenceValue;
};
