import { styled, Text, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { fontScale } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalTitleProps = ElementProps<HTMLHeadingElement>;

const ModalTitleFrame = styled(Text, {
	render: 'h2',
	display: 'block',
	flexGrow: 1,
	flexShrink: 1,
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	color: String(textIconColors['font-default']),
	...modalBoxFont,
	...(fontScale('h2') as object),
});

const ModalTitle = ({ className, ...props }: ModalTitleProps) => (
	<ModalTitleFrame className={['rcx-modal__title', className].filter(Boolean).join(' ')} {...(props as GetProps<typeof ModalTitleFrame>)} />
);

export default withFuselageProvider(ModalTitle);
