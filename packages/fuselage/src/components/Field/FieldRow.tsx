import type { GetProps } from '@tamagui/web';

import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { FieldContext } from './Field';
import { FieldRowFrame } from './FieldFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldRowProps = BoxProps;

const FieldRow = (props: FieldRowProps) => {
	const frameProps = useTamaguiBoxProps({ ...props }, 'rcx-field__row');
	const component = <FieldRowFrame {...(frameProps as GetProps<typeof FieldRowFrame>)} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldRow.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldRow, { takesBoxTransforms: true });
