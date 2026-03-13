import { Box, Scrollable } from '@rocket.chat/fuselage';

import Surface from './Surface/Surface';

const Display = () => (
	<Scrollable vertical>
		<Box height='100%' width='100%' borderInlineStart='var(--default-border)'>
			<Surface />
		</Box>
	</Scrollable>
);

export default Display;
