import type { AnchorHTMLAttributes } from 'react';

import { FieldContext } from './Field.js';
import WithErrorWrapper from '../../helpers/WithErrorWrapper.js';
import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

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
