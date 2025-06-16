import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import { useState } from 'react';

import PageContext from './PageContext';

type PageProps = Omit<ComponentProps<typeof Box>, 'backgroundColor'> & {
	background?: 'light' | 'tint' | 'neutral' | 'room';
};

const Page = ({ background = 'light', ...props }: PageProps): ReactElement => {
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
				bg={background}
				color='default'
				{...props}
			/>
		</PageContext.Provider>
	);
};

export default Page;
