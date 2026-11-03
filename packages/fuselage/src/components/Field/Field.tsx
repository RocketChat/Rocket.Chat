import { createContext } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export const FieldContext = createContext(false);

export type FieldProps = ElementProps<HTMLDivElement>;

/**
 * A `Field` is a wrapper representing an entry in a form.
 */
function Field(props: FieldProps) {
	return (
		<FieldContext.Provider value={true}>
			<Box rcx-field {...props} />
		</FieldContext.Provider>
	);
}

export default Field;
