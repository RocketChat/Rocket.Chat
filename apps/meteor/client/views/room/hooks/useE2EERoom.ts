import { useQuery } from '@tanstack/react-query';

import { e2e } from '../../../../app/e2e/client';

export const useE2EERoom = (rid: string) => {
	const { data } = useQuery(['e2eRoom', rid], () => e2e.getInstanceByRoomId(rid));

	return data;
};
