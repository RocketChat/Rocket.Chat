import { FieldContext } from './Field.js';
import WithErrorWrapper from '../../helpers/WithErrorWrapper.js';
import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type FieldDescriptionProps = ElementProps<HTMLSpanElement>;

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
