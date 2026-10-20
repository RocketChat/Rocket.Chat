import type { RefAttributes } from 'react';
import { createContext, useContext } from 'react';

import { Box, type BoxProps } from '../Box';

const LabelContext = createContext(false);

export type LabelProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLElement> & {
		disabled?: boolean;
		required?: boolean;
	};

/**
 * A caption for an input component.
 */
function Label({ disabled, is, required, children, ...props }: LabelProps) {
	const isInsideLabel = useContext(LabelContext);
	const component = is || (isInsideLabel && 'span') || 'label';

	return (
		<LabelContext.Provider value={true}>
			<Box is={component} rcx-label rcx-label--disabled={disabled} {...props}>
				{children}
				{required && (
					<Box is='span' rcx-label__required marginInlineStart='x4' aria-hidden='true'>
						*
					</Box>
				)}
			</Box>
		</LabelContext.Provider>
	);
}

export default Label;
