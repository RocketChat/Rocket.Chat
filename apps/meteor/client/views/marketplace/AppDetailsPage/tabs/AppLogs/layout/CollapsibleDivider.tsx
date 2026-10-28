import { Box, Divider } from '@rocket.chat/fuselage';

/**
 * The rule that closes an entry of a collapsible panel.
 */
const CollapsibleDivider = () => (
	<Box is='dt'>
		<Divider flush />
	</Box>
);

export default CollapsibleDivider;
