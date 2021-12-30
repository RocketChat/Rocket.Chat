import { useLayout } from '../../../contexts/LayoutContext';
import { useCurrentRoute, useRoutePath } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useUserId } from '../../../contexts/UserContext';
import { E2EEFlags } from '../../../lib/e2ee/E2EEFlags';
import { getE2EEFlags } from '../../../lib/e2ee/getE2EEFlags';

export const useFlags = (): E2EEFlags => {
	const uid = useUserId();
	const { isEmbedded: embeddedLayout } = useLayout();
	const [currentRouteName = '', currentParameters = {}] = useCurrentRoute();
	const currentRoutePath = useRoutePath(currentRouteName, currentParameters);
	const enabled = Boolean(useSetting('E2E_Enable'));

	return getE2EEFlags({
		uid,
		embeddedLayout,
		currentRoutePath,
		enabled,
	});
};
