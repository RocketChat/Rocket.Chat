import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, memo, ComponentProps } from 'react';

const VerticalBarText = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box flexShrink={1} flexGrow={1} withTruncatedText {...props} />
);

export default memo(VerticalBarText);
