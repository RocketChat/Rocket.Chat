import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { useState } from 'react';

import PageContext from './PageContext';

export type PageProps = Omit<BoxProps, 'backgroundColor'> & {
	background?: 'light' | 'tint' | 'neutral' | 'room';
};

const Page = ({ background = 'light', ...props }: PageProps) => {
	const [border, setBorder] = useState(false);
	return (
		<PageContext.Provider value={[border, setBorder]}>
			<Box
				is='section'
				display='flex'
				flexDirection='column'
				flexGrow={1}
				flexShrink={1}
				height='full'
				overflow='hidden'
				backgroundColor={background}
				color='default'
				{...props}
			/>
		</PageContext.Provider>
	);
};

export default Page;
