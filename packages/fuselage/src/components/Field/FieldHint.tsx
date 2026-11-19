import { FieldContext } from './Field.js';
import WithErrorWrapper from '../../helpers/WithErrorWrapper.js';
import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type FieldHintProps = ElementProps<HTMLSpanElement>;

const FieldHint = (props: FieldHintProps) => {
	const component = <Box is='span' rcx-field__hint {...props} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldHint.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default FieldHint;
