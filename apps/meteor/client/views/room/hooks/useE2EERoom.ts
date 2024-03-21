import { e2e } from '../../../../app/e2e/client';

import { useQuery } from '@tanstack/react-query';

export const useE2EERoom = (rid: string) => {
	const { data } = useQuery(['e2eRoom', rid], () => e2e.getInstanceByRoomId(rid));

	return data;
};
