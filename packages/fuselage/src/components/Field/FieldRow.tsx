import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { FieldContext } from './Field';

export type FieldRowProps = ElementProps<HTMLSpanElement> & {
	/** Packs the row's content at the end of the line. */
	justify?: 'end';
};

const FieldRow = ({ justify, ...props }: FieldRowProps) => {
	const component = <Box is='span' rcx-field__row rcx-field__row--justify-end={justify === 'end'} {...props} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldRow.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default FieldRow;
