import type { GetProps } from '@tamagui/web';

import { FieldContext } from './Field';
import { FieldRowFrame } from './FieldFrames';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldRowProps = ElementProps<HTMLSpanElement> & {
	/** Packs the row's content at the end of the line. */
	justify?: 'end';
};

const FieldRow = ({ justify, className, ...props }: FieldRowProps) => {
	const component = (
		<FieldRowFrame
			justify={justify}
			className={['rcx-field__row', justify === 'end' && 'rcx-field__row--justify-end', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof FieldRowFrame>)}
		/>
	);

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldRow.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldRow);
