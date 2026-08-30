import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallBarProps = {
	/**
	 * The call's own controls — mic, camera, screen, hang up. The whole reason the bar exists: a provider
	 * rendered in an iframe keeps its controls inside its own page and gets no bar at all.
	 */
	centre?: ReactNode;
};

/**
 * The in-call control bar, pinned along the bottom of a conference — the same position third-party providers put
 * their own toolbar in, so an embedded provider and the native conference read the same.
 *
 * Only the call's own controls live here. Everything about the window rather than the call — the panel toggles,
 * who is in it, what is unread — belongs to the top bar, which is where an iframe provider's toggles have always
 * been: putting them in both bars showed the same two buttons twice, once above the call and once below it.
 */
const CallBar = ({ centre }: CallBarProps) => (
	<Box is='footer' display='flex' alignItems='center' justifyContent='center' flexShrink={0} width='100%' minHeight={68} paddingInline={12}>
		{centre}
	</Box>
);

export default CallBar;
