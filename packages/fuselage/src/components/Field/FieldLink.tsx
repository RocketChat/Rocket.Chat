import type { AnchorHTMLAttributes } from 'react';

import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { FieldContext } from './Field';

export type FieldLinkProps = ElementProps<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>;

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
