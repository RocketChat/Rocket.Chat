import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { Box, type BoxProps } from '../Box';
import { FieldContext } from './Field';

export type FieldLinkProps = BoxProps;

const FieldLink = (props: FieldLinkProps) => {
	const component = <Box is='a' rcx-field__link {...props} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldLink.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default FieldLink;
