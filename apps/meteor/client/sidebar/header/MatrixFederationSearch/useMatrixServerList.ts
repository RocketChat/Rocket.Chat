import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

// const fetchServerList = () => ({
// 	servers: Array.from({ length: 5 }).map((_, index) => ({ name: `Server ${index}`, default: true, local: false })),
// });

export const useMatrixServerList = () => {
	const fetchServerList = useEndpoint('GET', '/v1/federation/listServersByUser');
	return useQuery(['federation/listServersByUsers'], async () => fetchServerList());
};
