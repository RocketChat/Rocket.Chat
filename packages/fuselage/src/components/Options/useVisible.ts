import { useStableCallback, useDebouncedState } from '@rocket.chat/fuselage-hooks';

import { AnimatedVisibility } from '../AnimatedVisibility';

export type VisibilityHandler = [visible: typeof AnimatedVisibility.HIDDEN, hide: () => void, show: () => void];

export const useVisible = (initialVisibility: typeof AnimatedVisibility.HIDDEN = AnimatedVisibility.HIDDEN): VisibilityHandler => {
	const [visible, setVisible] = useDebouncedState(initialVisibility, 10);
	const hide = useStableCallback(() => setVisible(AnimatedVisibility.HIDDEN));
	const show = useStableCallback(() => setVisible(AnimatedVisibility.VISIBLE));

	return [visible, hide, show];
};
