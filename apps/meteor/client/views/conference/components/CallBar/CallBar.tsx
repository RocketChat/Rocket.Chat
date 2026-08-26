import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallBarProps = {
	/**
	 * The call's own controls — mic, camera, hang up. Given the centre because they are what the bar is for;
	 * the panel toggles below are secondary to them. Absent for a provider rendered in an iframe, which keeps
	 * its controls inside its own page.
	 */
	centre?: ReactNode;
	children: ReactNode;
};

/**
 * The in-call control bar, pinned along the bottom of a conference — the same position third-party providers put
 * their own toolbar in, so an embedded provider and the future native conference read the same.
 *
 * The panel toggles sit at the inline end, away from wherever an embedded provider puts its own. The native
 * conference brings mic, camera and hang-up with it, and those take the centre — one bar for the call, rather
 * than the call's strip stacked above this one.
 */
const CallBar = ({ centre, children }: CallBarProps) => (
	<Box
		is='footer'
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		flexShrink={0}
		width='100%'
		minHeight={68}
		paddingInline={12}
	>
		{/* Equal flexible ends keep the controls centred on the bar rather than on the space left over, so they
		    don't shift as the panel toggles gain or lose a badge. */}
		<Box flexGrow={1} flexBasis={0} />
		{centre}
		<Box flexGrow={1} flexBasis={0} display='flex' justifyContent='flex-end'>
			<ButtonGroup style={{ gap: 8 }}>{children}</ButtonGroup>
		</Box>
	</Box>
);

export default CallBar;
