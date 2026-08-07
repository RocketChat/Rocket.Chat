import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CallBarProps = {
	children: ReactNode;
};

/**
 * The in-call control bar, pinned along the bottom of a conference — the same position third-party providers put
 * their own toolbar in, so an embedded provider and the future native conference read the same.
 *
 * Its actions sit at the inline end, away from wherever the provider puts its own. When the native conference
 * brings mic, camera and hang-up of its own, they will want the centre of the bar — and that is the point at
 * which what the centre needs will be known, rather than guessed at now.
 */
const CallBar = ({ children }: CallBarProps) => (
	<Box
		is='footer'
		display='flex'
		alignItems='center'
		justifyContent='flex-end'
		flexShrink={0}
		width='100%'
		minHeight={56}
		paddingInline={12}
		backgroundColor='surface-light'
		borderBlockStartWidth='default'
		borderBlockStartStyle='solid'
		borderBlockStartColor='stroke-extra-light'
	>
		<ButtonGroup>{children}</ButtonGroup>
	</Box>
);

export default CallBar;
