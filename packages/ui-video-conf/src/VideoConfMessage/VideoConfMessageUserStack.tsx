import { Box } from '@rocket.chat/fuselage';
import { Children, ReactElement } from 'react';

import VideoConfMessageRow from './VideoConfMessageRow';

const VideoConfMessageUserStack = ({ children }: { children: ReactElement | ReactElement[] }): ReactElement => (
	<Box mi='x4'>
		<Box display='flex' alignItems='center' mi='neg-x2'>
			{Children.map(Children.toArray(children), (child) => (
				<Box mi='x2'> {child}</Box>
			))}
		</Box>
	</Box>
);

export default VideoConfMessageUserStack;
