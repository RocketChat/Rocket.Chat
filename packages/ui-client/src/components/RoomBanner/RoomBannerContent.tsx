import { Box } from '@rocket.chat/fuselage';
import { HTMLAttributes } from 'react';

export const RoomBannerContent = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => (
	<Box color='hint' fontScale='p2' pb='x4' flexGrow={1} withTruncatedText {...props} />
);
