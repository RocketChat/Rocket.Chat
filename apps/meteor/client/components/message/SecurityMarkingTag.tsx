import type { SecurityLabelDisplayMarking } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

type SecurityMarkingTagProps = {
	marking: SecurityLabelDisplayMarking;
};

const SecurityMarkingTag = ({ marking }: SecurityMarkingTagProps) => (
	<Box
		is='span'
		fontScale='micro'
		marginInline='x4'
		paddingInline='x4'
		borderRadius='small'
		style={{ backgroundColor: marking.bgcolor, color: marking.fgcolor, textTransform: 'uppercase', whiteSpace: 'nowrap' }}
		title={marking.text}
	>
		{marking.text}
	</Box>
);

export default SecurityMarkingTag;
