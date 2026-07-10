import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const UserCardInfo = (props: ComponentProps<typeof Box>) => (
	<Box mb={8} is='span' fontScale='p2' color='hint' withTruncatedText {...props} />
);

export default UserCardInfo;
