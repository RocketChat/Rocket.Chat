import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useLayoutContextualBarExpanded } from '@rocket.chat/ui-contexts';

export const useThreadExpansion = (): [canExpanded: boolean, expanded: boolean, toggle: () => void] => {
	const canExpand = useLayoutContextualBarExpanded();
	const [expanded, setExpanded] = useLocalStorage('expand-threads', false);

	if (!canExpand) {
		return [false, false, (): void => undefined];
	}

	return [
		true,
		expanded,
		(): void => {
			setExpanded(!expanded);
		},
	];
};
