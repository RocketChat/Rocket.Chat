import type { GetProps } from '@tamagui/web';

import { FieldContext } from './Field';
import { FieldErrorFrame } from './FieldFrames';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldErrorProps = ElementProps<HTMLSpanElement>;

const FieldError = ({ className, ...props }: FieldErrorProps) => {
	const component = (
		<FieldErrorFrame
			className={['rcx-field__error', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof FieldErrorFrame>)}
		/>
	);

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
