import type { GetProps } from '@tamagui/web';

import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { FieldContext } from './Field';
import { FieldLinkFrame } from './FieldFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldLinkProps = BoxProps;

const FieldLink = (props: FieldLinkProps) => {
	const frameProps = useTamaguiBoxProps({ ...props }, 'rcx-field__link');
	const component = <FieldLinkFrame {...(frameProps as GetProps<typeof FieldLinkFrame>)} />;

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
