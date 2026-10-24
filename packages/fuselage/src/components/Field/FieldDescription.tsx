import type { GetProps } from '@tamagui/web';

import { FieldContext } from './Field';
import { FieldDescriptionFrame } from './FieldFrames';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldDescriptionProps = ElementProps<HTMLSpanElement>;

const FieldDescription = ({ className, ...props }: FieldDescriptionProps) => {
	const component = (
		<FieldDescriptionFrame
			className={['rcx-field__description', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof FieldDescriptionFrame>)}
		/>
	);

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldDescription.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldDescription);
