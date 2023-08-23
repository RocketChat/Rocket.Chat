import { useContext } from 'react';

import { ResizeContext } from '../components/ResizeObserver';

export const useIsResizing = () => {
	return useContext(ResizeContext);
};
