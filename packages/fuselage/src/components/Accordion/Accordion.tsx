import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { strokeColors } from '../../Theme';
import { borderWidth, fontFamily } from '../../styleTokens';
import { StylingBox } from '../Box';
import type { StylingProps } from '../Box/stylingProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** What `rcx-box rcx-box--full` used to give every Accordion element. */
export const accordionBoxStyle = {
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

const AccordionFrame = styled(View, {
	...accordionBoxStyle,
	borderWidth: 0,
	borderBottomWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: String(strokeColors['stroke-extra-light']),
});

export type AccordionProps = {
	children: ReactNode;
} & Partial<StylingProps>;

/**
 * An `Accordion` allows users to toggle the display of sections of content.
 */
const Accordion = ({ children, ...props }: AccordionProps) => (
	<StylingBox {...props}>
		<AccordionFrame className='rcx-box--animated rcx-accordion'>{children}</AccordionFrame>
	</StylingBox>
);

export default withFuselageProvider(Accordion);
