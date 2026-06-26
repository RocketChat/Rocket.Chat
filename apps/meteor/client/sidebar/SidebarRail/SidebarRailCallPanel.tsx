import { Box, Sidepanel } from '@rocket.chat/fuselage';
import { MediaCallWidgetSlot, useMediaCallView, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const SidebarRailCallPanel = () => {
	const { t } = useTranslation();

	const {
		sessionState: { state },
	} = useMediaCallView();
	const { toggleWidget } = useWidgetExternalControls();

	const stateRef = useRef(state);
	stateRef.current = state;

	// The call panel hosts the dialer: while it is mounted and the session is idle
	// (initial open, or right after a call ends) show the dialer instead of an empty
	// panel. This is what "resets the bar" when a call finishes on the telephony screen.
	useLayoutEffect(() => {
		if (state === 'closed') {
			toggleWidget();
		}
	}, [state, toggleWidget]);

	// Leaving the telephony screen with only the idle dialer open must drop it, so it
	// does not pop out as a floating widget. Running the teardown in the layout phase
	// keeps it in sync with the slot unmount and avoids a one-frame flicker.
	useLayoutEffect(
		() => () => {
			if (stateRef.current === 'new') {
				toggleWidget();
			}
		},
		[toggleWidget],
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
