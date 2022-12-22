import { Box } from '@rocket.chat/fuselage';
import Colors from '@rocket.chat/fuselage-tokens/colors';
import type { ReactElement, ComponentProps } from 'react';
import React, { useState } from 'react';

import PageContext from './PageContext';

type PageProps = Omit<ComponentProps<typeof Box>, 'backgroundColor'> & {
	background?: 'light' | 'tint';
};

const surfaceMap = {
	light: Colors.white,
	tint: Colors.n100,
	neutral: Colors.n400,
}; // TODO: Remove this export after the migration is complete

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
				aria-labelledby='PageHeader-title'
				{...props}
				backgroundColor={`var(--rcx-color-surface-${background}, ${surfaceMap[background]})`}
			/>
		</PageContext.Provider>
	);
};

export default Page;
