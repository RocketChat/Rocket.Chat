import { Box } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

function VerticalBarText(props) {
	return <Box flexShrink={1} flexGrow={1} withTruncatedText {...props} />;
}

export default memo(VerticalBarText);
