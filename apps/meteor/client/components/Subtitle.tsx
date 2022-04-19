import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

// @deprecated
function Subtitle(props: { children: ReactElement }): ReactElement {
	return <Box color='default' fontFamily='sans' fontScale='h4' marginBlockEnd='x8' withRichContent {...props} />;
}

export default Subtitle;
