import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

const Page = (props: ComponentProps<typeof Box>) => {
	return (
		<Box
			is='section'
			display='flex'
			flexDirection='row'
			height='100vh'
			width='100vw'
			overflow='hidden'
			color='default'
			backgroundColor='Background'
			{...props}
		/>
	);
};

export default Page;
