import type { GetProps } from '@tamagui/web';

import { FieldContext } from './Field';
import { FieldRowFrame } from './FieldFrames';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldRowProps = ElementProps<HTMLSpanElement> & {
	/** Packs the row's content at the end of the line. */
	justify?: 'end';
};

const FieldRow = ({ justify, ...props }: FieldRowProps) => {
	const frameProps = useTamaguiBoxProps({ 'rcx-field__row--justify-end': justify === 'end', ...props }, 'rcx-field__row');
	const component = <FieldRowFrame justify={justify} {...(frameProps as GetProps<typeof FieldRowFrame>)} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldRow.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldRow, { takesBoxTransforms: true });
