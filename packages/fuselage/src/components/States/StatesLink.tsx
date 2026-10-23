import { styled, Text, type GetProps } from '@tamagui/web';
import type { AnchorHTMLAttributes } from 'react';

import { textIconColors } from '../../Theme';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { fontFamily, fontScale, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type StatesLinkProps = ElementProps<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>;

const StatesLinkFrame = styled(Text, {
	render: 'a',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	marginBlock: spacing('x16'),
	outlineStyle: 'none',
	color: String(textIconColors['font-info']),
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	...(fontScale('p2') as object),
});

const StatesLink = ({ ...props }: StatesLinkProps) => {
	const linkProps = useTamaguiBoxProps({ withRichContent: 'inlineWithoutBreaks', ...props }, 'rcx-states__link');

	return <StatesLinkFrame {...(linkProps as GetProps<typeof StatesLinkFrame>)} />;
};

export default withFuselageProvider(StatesLink);
