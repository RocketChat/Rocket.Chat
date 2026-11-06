import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { FieldContext } from './Field';

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
