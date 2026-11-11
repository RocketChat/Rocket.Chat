import type { SyntheticEvent } from 'react';

export const prevent = (event: SyntheticEvent) => {
	event.preventDefault();
	event.stopPropagation();
	event.nativeEvent.stopImmediatePropagation();
};
