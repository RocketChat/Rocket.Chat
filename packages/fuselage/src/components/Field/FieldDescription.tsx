import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { FieldContext } from './Field';

export type FieldDescriptionProps = ElementProps<HTMLSpanElement>;

/**
 * Clarifies the label with context or instructions about the expected input.
 */
const FieldDescription = (props: FieldDescriptionProps) => {
	const component = <Box is='span' rcx-field__description {...props} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldDescription.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default FieldDescription;
