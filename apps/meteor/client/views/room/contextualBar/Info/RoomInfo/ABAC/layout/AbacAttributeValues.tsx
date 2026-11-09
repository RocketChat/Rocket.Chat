import { Box } from '@rocket.chat/fuselage';
import { Children } from 'react';
import type { ReactNode } from 'react';

export type AbacAttributeValuesProps = {
	'aria-labelledby': string;
	'children': ReactNode;
};

/**
 * An attribute's values, side by side in a list under the attribute's name.
 */
const AbacAttributeValues = ({ children, ...props }: AbacAttributeValuesProps) => (
	<Box is='ul' display='flex' marginBlockStart='x8' alignItems='center' {...props}>
		{Children.map(children, (child) => (
			<Box is='li' marginInlineEnd='x4'>
				{child}
			</Box>
		))}
	</Box>
);

export default AbacAttributeValues;
