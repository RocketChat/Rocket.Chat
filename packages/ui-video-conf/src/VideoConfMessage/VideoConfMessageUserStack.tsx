import { Box } from '@rocket.chat/fuselage';
import { Children, ReactElement } from 'react';

const VideoConfMessageUserStack = ({ children }: { children: ReactElement | ReactElement[] }): ReactElement => (
	<Box mi='x4'>
		<Box display='flex' alignItems='center' mi='neg-x2'>
			{Children.map(Children.toArray(children), (child, index) => (
				<Box mi='x2' key={index}>
					{child}
				</Box>
			))}
		</Box>
	</Box>
);

export default VideoConfMessageUserStack;
