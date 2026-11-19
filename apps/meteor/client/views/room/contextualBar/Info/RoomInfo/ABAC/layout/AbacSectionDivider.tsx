import { Box, Divider } from '@rocket.chat/fuselage';

/**
 * The rule that sets the room's access control section apart from the room's details above it.
 */
const AbacSectionDivider = () => (
	<Box marginBlock='x32'>
		<Divider />
	</Box>
);

export default AbacSectionDivider;
