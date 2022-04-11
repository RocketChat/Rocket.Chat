import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ComponentProps } from 'react';

const UserCardInfo = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box mbe='x8' is='span' fontScale='p2' color='hint' withTruncatedText {...props} />
);

export default UserCardInfo;
