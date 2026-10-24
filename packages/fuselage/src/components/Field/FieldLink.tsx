import type { GetProps } from '@tamagui/web';
import type { AnchorHTMLAttributes } from 'react';

import { FieldContext } from './Field';
import { FieldLinkFrame } from './FieldFrames';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldLinkProps = ElementProps<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>;

const FieldLink = ({ className, ...props }: FieldLinkProps) => {
	const component = (
		<FieldLinkFrame className={['rcx-field__link', className].filter(Boolean).join(' ')} {...(props as GetProps<typeof FieldLinkFrame>)} />
	);

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldLink.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldLink);
