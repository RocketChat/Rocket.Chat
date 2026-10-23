import { styled, Text, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { fontScale } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalTaglineProps = BoxProps & {
	/** Mutes the tagline, so it reads as a category above the title. */
	subtle?: boolean;
};

const ModalTaglineFrame = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	color: String(textIconColors['font-default']),
	...modalBoxFont,
	...(fontScale('c2') as object),

	variants: {
		subtle: {
			true: { color: String(textIconColors['font-annotation']) },
		},
	} as const,
});

const ModalTagline = ({ subtle, children, ...props }: ModalTaglineProps) => {
	const frameProps = useTamaguiBoxProps(props, 'rcx-modal__tagline');

	return (
		<ModalTaglineFrame subtle={subtle} {...(frameProps as GetProps<typeof ModalTaglineFrame>)}>
			{children}
		</ModalTaglineFrame>
	);
};

export default withFuselageProvider(ModalTagline, { takesBoxTransforms: true });
