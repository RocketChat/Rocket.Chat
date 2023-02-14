import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React from 'react';

const UserCardInfo = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box mbe='x8' is='span' fontScale='p2' color='hint' withTruncatedText {...props} />
);

export default UserCardInfo;
