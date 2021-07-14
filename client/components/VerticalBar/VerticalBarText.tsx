import { Box } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const VerticalBarText: FC<{ children?: string; dangerouslySetInnerHTML?: { __html: string } }> = (
	props,
) => <Box flexShrink={1} flexGrow={1} withTruncatedText {...props} />;

export default memo(VerticalBarText);
