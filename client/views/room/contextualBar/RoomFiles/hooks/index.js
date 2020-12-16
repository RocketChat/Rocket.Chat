import { useCallback } from 'react';

import { useEndpoint } from '../../../../../contexts/ServerContext';
import { useDataWithLoadMore } from '../../hooks/useDataWithLoadMore';

export const useFileList = (type, params) => {
	const method = useEndpoint('GET', type === 'c' ? 'channels.files' : 'groups.files');
	return useDataWithLoadMore(useCallback((args) => method(args), [method]), params);
};
