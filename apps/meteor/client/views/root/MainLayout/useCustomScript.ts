import { useUserId, useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';

export const useCustomScript = (): void => {
	const uid = useUserId();
	const router = useRouter();
    const routeName = router?.getRouteName?.(); 

	const previousUid = useRef<string | null | undefined>(undefined);
	const previousRoute = useRef<string | undefined>(undefined);
	useEffect(() => {
		const currentUid = uid ?? null;

		if (previousUid.current === undefined) {
			previousUid.current = currentUid;
			return;
		}

		const prevUid = previousUid.current;

		if (!prevUid && currentUid) {
			fireGlobalEvent('Custom_Script_Logged_Out'); 
		}
		previousUid.current = currentUid;
	}, [uid]);

    useEffect(() => {
		if (!uid || !router) return;
 
		if (previousRoute.current === undefined) {
			previousRoute.current = routeName;
			return;
		}
		if(['channel', 'group', 'direct'].includes(routeName ?? '') &&
			!['channel', 'group', 'direct'].includes(previousRoute.current ?? '')){
			fireGlobalEvent('Custom_Script_Logged_In');
		}
	
		previousRoute.current = routeName;
	}, [routeName, uid]);

};