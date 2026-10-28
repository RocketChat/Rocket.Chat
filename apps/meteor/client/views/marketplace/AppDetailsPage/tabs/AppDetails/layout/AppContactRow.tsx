import { Box } from '@rocket.chat/fuselage';
import { Children } from 'react';
import type { ReactNode } from 'react';

type AppContactRowProps = {
	children: ReactNode;
};

/**
 * The app's contact links side by side, each a label over its link, wrapping one under the other when they don't fit.
 */
const AppContactRow = ({ children }: AppContactRowProps) => {
	const items = Children.toArray(children);

	return (
		<Box display='flex' flexDirection='row' justifyContent='space-around' flexWrap='wrap' marginBlockEnd='x24'>
			{items.map((item, index) => (
				<Box key={index} display='flex' flexDirection='column' flexGrow={1} marginInlineEnd={index < items.length - 1 ? 'x12' : undefined}>
					{item}
				</Box>
			))}
		</Box>
	);
};

export default AppContactRow;
