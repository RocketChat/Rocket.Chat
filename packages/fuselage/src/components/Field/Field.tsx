import { createContext } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export const FieldContext = createContext(false);

export type FieldProps = ElementProps<HTMLDivElement>;

/**
 * Holds one entry of a form: its label, the input, and the description, hint, error and link that support it.
 */
function Field(props: FieldProps) {
	return (
		<FieldContext.Provider value={true}>
			<Box rcx-field {...props} />
		</FieldContext.Provider>
	);
}

export default Field;
