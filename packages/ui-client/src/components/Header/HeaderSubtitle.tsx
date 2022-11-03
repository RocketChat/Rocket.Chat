import { Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

const HeaderSubtitle: FC<ComponentProps<typeof Box>> = (props) => <Box color='hint' fontScale='p2' withTruncatedText {...props} />;

export default HeaderSubtitle;
