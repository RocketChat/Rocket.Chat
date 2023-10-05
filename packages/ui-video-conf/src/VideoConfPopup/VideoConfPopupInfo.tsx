import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

type VideoConfPopupInfoProps = {
	avatar?: ReactElement;
	icon?: ReactNode;
	children: ReactNode;
};

const VideoConfPopupInfo = ({ avatar, icon, children }: VideoConfPopupInfoProps): ReactElement => (
	<Box display='flex' alignItems='center'>
		{avatar}
		{(icon || children) && (
			<Box display='flex' flexGrow={1} flexShrink={1} flexBasis='0%' alignItems='center' mis={8} withTruncatedText>
				{icon}
				<Box mis={8} fontScale='h4' withTruncatedText>
					{children}
				</Box>
			</Box>
		)}
	</Box>
);

export default VideoConfPopupInfo;
