import type { ElementType, LabelHTMLAttributes } from 'react';
import { createContext, useContext } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export const LabelContext = createContext(false);

export type LabelProps = ElementProps<HTMLElement, LabelHTMLAttributes<HTMLElement>> & {
	/** Renders another element, such as a `legend` or a `span`. */
	is?: ElementType;
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
