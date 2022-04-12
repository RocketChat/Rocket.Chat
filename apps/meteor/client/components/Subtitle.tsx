import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

function Subtitle(props): ReactElement {
	return <Box color='default' fontFamily='sans' fontScale='h4' marginBlockEnd='x8' withRichContent {...props} />;
}

export default Subtitle;
