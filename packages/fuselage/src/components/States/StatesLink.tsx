import { styled, Text, type GetProps } from '@tamagui/web';
import type { AnchorHTMLAttributes } from 'react';

import { textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
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

// `rcx-box--with-inline-elements` styles the rich content nested in the link, which Tamagui can't reach
const StatesLink = ({ className, ...props }: StatesLinkProps) => (
	<StatesLinkFrame
		{...(props as GetProps<typeof StatesLinkFrame>)}
		className={cx('rcx-states__link', 'rcx-box--with-inline-elements', className)}
	/>
);

export default withFuselageProvider(StatesLink);
