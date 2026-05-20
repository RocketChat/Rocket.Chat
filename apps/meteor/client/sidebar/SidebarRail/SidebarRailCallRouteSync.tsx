import { useMediaCallView, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useEffect } from 'react';

type SidebarRailCallRouteSyncProps = {
	currentRoutePath?: string;
};

const SidebarRailCallRouteSync = ({ currentRoutePath }: SidebarRailCallRouteSyncProps) => {
	const { sessionState } = useMediaCallView();
	const { toggleWidget } = useWidgetExternalControls();

	useEffect(() => {
		const onRoute = currentRoutePath?.includes('/call-history') ?? false;

		// On /call-history: keep the dialer open. If the session is idle (closed)
		// — initial load, an ended call, etc — bounce it back to `new`.
		if (onRoute && sessionState.state === 'closed') {
			toggleWidget();
			return;
		}

		// Off /call-history: an idle dialer has no host, so close it.
		if (!onRoute && sessionState.state === 'new') {
			toggleWidget();
		}
	}, [currentRoutePath, sessionState.state, toggleWidget]);

	return null;
};

export default SidebarRailCallRouteSync;
