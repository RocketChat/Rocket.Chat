import { Box, Sidepanel } from '@rocket.chat/fuselage';
import { MediaCallWidgetSlot, useMediaCallView, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const SidebarRailCallPanel = () => {
	const { t } = useTranslation();

	const {
		sessionState: { state },
	} = useMediaCallView();
	const { openDialer, closeDialer } = useWidgetExternalControls();

	const stateRef = useRef(state);
	stateRef.current = state;

	// The call panel hosts the dialer: while it is mounted and the session is idle
	// (initial open, or right after a call ends) show the dialer instead of an empty
	// panel. `openDialer` is idempotent (only acts on the "closed" state), so React
	// StrictMode double-invoking this layout effect on mount is harmless.
	useLayoutEffect(() => {
		if (state === 'closed') {
			openDialer();
		}
	}, [state, openDialer]);

	// Leaving the telephony screen with only the idle dialer open must drop it, so it
	// does not pop out as a floating widget. The `state === 'new'` guard scopes this to
	// the idle dialer (never an ongoing call) and skips StrictMode's fake unmount, where
	// the just-issued open has not re-rendered yet.
	useLayoutEffect(
		() => () => {
			if (stateRef.current === 'new') {
				closeDialer();
			}
		},
		[closeDialer],
	);

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
