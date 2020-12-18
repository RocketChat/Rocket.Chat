import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

export const usePreventProgation = (fn: (e: React.MouseEvent) => void): (e: React.MouseEvent) => void => {
	const preventClickPropagation = useMutableCallback((e): void => {
		e.stopPropagation();
		fn && fn(e);
	});
	return preventClickPropagation;
};
