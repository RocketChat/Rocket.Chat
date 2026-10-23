import type { GetProps } from '@tamagui/web';
import { createContext } from 'react';

import { FieldFrame } from './FieldFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const FieldContext = createContext(false);

export type FieldProps = ElementProps<HTMLDivElement>;

/**
 * A `Field` is a wrapper representing an entry in a form.
 */
function Field(props: FieldProps) {
	const frameProps = useTamaguiBoxProps({ ...props }, 'rcx-field');

	return (
		<FieldContext.Provider value={true}>
			<FieldFrame {...(frameProps as GetProps<typeof FieldFrame>)} />
		</FieldContext.Provider>
	);
}

export default withFuselageProvider(Field, { takesBoxTransforms: true });
