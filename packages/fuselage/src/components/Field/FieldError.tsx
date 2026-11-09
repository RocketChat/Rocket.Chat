import { FieldContext } from './Field.js';
import WithErrorWrapper from '../../helpers/WithErrorWrapper.js';
import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type FieldErrorProps = ElementProps<HTMLSpanElement>;

const FieldError = (props: FieldErrorProps) => {
	const component = <Box is='span' rcx-field__error {...props} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldError.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default FieldError;
