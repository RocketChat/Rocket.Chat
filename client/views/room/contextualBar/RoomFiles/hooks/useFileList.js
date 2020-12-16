import { useCallback } from 'react';

import { useDataWithLoadMore } from '../../hooks/useDataWithLoadMore';
import { useEndpoint } from '../../../../../contexts/ServerContext';

const roomTypes = {
	c: 'channels.files',
	l: 'channels.files',
	d: 'im.files',
	p: 'groups.files',
};

export const useFileList = (type, params) => {
	const method = useEndpoint('GET', roomTypes[type]);
	return useDataWithLoadMore(useCallback((args) => method(args), [method]), params);
};
