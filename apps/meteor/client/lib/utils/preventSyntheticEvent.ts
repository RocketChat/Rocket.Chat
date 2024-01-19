import type { SyntheticEvent } from 'react';

export const preventSyntheticEvent = (e: SyntheticEvent): void => {
	if (e) {
		(e.nativeEvent || e).stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
	}
};
