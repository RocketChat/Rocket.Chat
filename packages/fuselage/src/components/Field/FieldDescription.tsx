import type { GetProps } from '@tamagui/web';

import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { FieldContext } from './Field';
import { FieldDescriptionFrame } from './FieldFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldDescriptionProps = BoxProps;

const FieldDescription = (props: FieldDescriptionProps) => {
	const frameProps = useTamaguiBoxProps({ ...props }, 'rcx-field__description');
	const component = <FieldDescriptionFrame {...(frameProps as GetProps<typeof FieldDescriptionFrame>)} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldDescription.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldDescription, { takesBoxTransforms: true });
