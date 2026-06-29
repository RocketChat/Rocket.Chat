import { Box, Sidepanel } from '@rocket.chat/fuselage';
import { MediaCallWidgetSlot, usePeekMediaSessionState, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SidebarRailCallPanel = () => {
	const { t } = useTranslation();

	const state = usePeekMediaSessionState();
	const { showWidget, hideWidget } = useWidgetExternalControls();
	const isAvailable = state === 'available';

	// The call panel hosts the dialer: while it is mounted and the session is idle
	// (initial open, or right after a call ends) show the dialer instead of an empty
	// panel. This is what "resets the bar" when a call finishes on the telephony screen.
	useLayoutEffect(() => {
		if (isAvailable) showWidget();

		return () => {
			if (isAvailable) hideWidget();
		};
	}, [isAvailable, showWidget, hideWidget]);

	return (
		<Box width='x280' minWidth='x280'>
			<Sidepanel role='complementary' aria-label={t('Calls')}>
				<Box p={16}>
					<MediaCallWidgetSlot />
				</Box>
			</Sidepanel>
		</Box>
	);
};

export default SidebarRailCallPanel;
