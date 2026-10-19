import type { GetProps } from '@tamagui/web';

import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { FieldContext } from './Field';
import { FieldErrorFrame } from './FieldFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldErrorProps = BoxProps;

const FieldError = (props: FieldErrorProps) => {
	const frameProps = useTamaguiBoxProps({ ...props }, 'rcx-field__error');
	const component = <FieldErrorFrame {...(frameProps as GetProps<typeof FieldErrorFrame>)} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldError.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldError);
