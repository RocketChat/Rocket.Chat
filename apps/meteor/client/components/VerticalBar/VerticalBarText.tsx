import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo } from 'react';

const VerticalBarText = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box flexShrink={1} flexGrow={1} withTruncatedText {...props} />
);

export default memo(VerticalBarText);
