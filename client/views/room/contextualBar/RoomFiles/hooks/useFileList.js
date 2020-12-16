import { useCallback } from 'react';

import { useDataWithLoadMore } from '../../hooks/useDataWithLoadMore';
import { useEndpoint } from '../../../../../contexts/ServerContext';

export const useFileList = (type, params) => {
	const method = useEndpoint('GET', type === 'c' ? 'channels.files' : 'groups.files');
	return useDataWithLoadMore(useCallback((args) => method(args), [method]), params);
};
