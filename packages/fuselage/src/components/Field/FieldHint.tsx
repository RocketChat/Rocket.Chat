import type { GetProps } from '@tamagui/web';

import { FieldContext } from './Field';
import { FieldHintFrame } from './FieldFrames';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldHintProps = ElementProps<HTMLSpanElement>;

const FieldHint = (props: FieldHintProps) => {
	const frameProps = useTamaguiBoxProps({ ...props }, 'rcx-field__hint');
	const component = <FieldHintFrame {...(frameProps as GetProps<typeof FieldHintFrame>)} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldHint.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldHint, { takesBoxTransforms: true });
