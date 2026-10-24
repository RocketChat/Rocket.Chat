import { styled, Text, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { fontScale } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalTaglineProps = ElementProps<HTMLDivElement> & {
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

const ModalTagline = ({ subtle, className, ...props }: ModalTaglineProps) => (
	<ModalTaglineFrame
		subtle={subtle}
		className={['rcx-modal__tagline', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof ModalTaglineFrame>)}
	/>
);

export default withFuselageProvider(ModalTagline);
