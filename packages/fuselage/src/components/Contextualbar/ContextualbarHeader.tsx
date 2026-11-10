import { css } from '@rocket.chat/css-in-js';
import { memo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarHeaderProps = ElementProps<HTMLDivElement>;

const ContextualbarHeader = ({ children, ...props }: ContextualbarHeaderProps) => (
	<Box
		display='flex'
		alignItems='center'
		height='x44'
		paddingInline={16}
		borderBlockEndWidth='default'
		borderBlockColor='extra-light'
		flexShrink={0}
		{...props}
	>
		<Box
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			flexGrow={1}
			height='100%'
			overflow='hidden'
			marginInline={-4}
			paddingInline={4}
			className={css`
				gap: 8px;
			`}
		>
			{children}
		</Box>
	</Box>
);

export default memo(ContextualbarHeader);
