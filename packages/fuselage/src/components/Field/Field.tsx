import type { GetProps } from '@tamagui/web';
import { createContext } from 'react';

import { FieldFrame } from './FieldFrames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const FieldContext = createContext(false);

export type FieldProps = ElementProps<HTMLDivElement>;

/**
 * A `Field` is a wrapper representing an entry in a form.
 */
function Field({ className, ...props }: FieldProps) {
	return (
		<FieldContext.Provider value={true}>
			<FieldFrame className={['rcx-field', className].filter(Boolean).join(' ')} {...(props as GetProps<typeof FieldFrame>)} />
		</FieldContext.Provider>
	);
}

export default withFuselageProvider(Field);
