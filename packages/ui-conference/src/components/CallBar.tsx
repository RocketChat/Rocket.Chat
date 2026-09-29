import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallBarProps = {
	/** The call's own controls — mic, camera, screen, hang up. */
	centre?: ReactNode;
};

/**
 * The in-call control bar along the bottom of the conference, where third-party providers put their own toolbar.
 * Only the call's own controls live here; what is about the window — panel toggles, who is in, what is unread —
 * belongs to the top bar.
 */
const CallBar = ({ centre }: CallBarProps) => (
	<Box is='footer' display='flex' alignItems='center' justifyContent='center' flexShrink={0} width='100%' minHeight={68} paddingInline={12}>
		{centre}
	</Box>
);

export default CallBar;
