import { Box } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import HeaderDivider from './HeaderDivider';

export const HeaderSubContent = (props: Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<>
		<Box pi='x24' pb='x8' {...props} />
		<HeaderDivider />
	</>
);
