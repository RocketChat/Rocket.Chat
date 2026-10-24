import type { GetProps } from '@tamagui/web';

import { FieldContext } from './Field';
import { FieldHintFrame } from './FieldFrames';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type FieldHintProps = ElementProps<HTMLSpanElement>;

const FieldHint = ({ className, ...props }: FieldHintProps) => {
	const component = (
		<FieldHintFrame className={['rcx-field__hint', className].filter(Boolean).join(' ')} {...(props as GetProps<typeof FieldHintFrame>)} />
	);

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldHint.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default withFuselageProvider(FieldHint);
