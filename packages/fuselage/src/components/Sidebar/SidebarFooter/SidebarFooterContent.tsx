import { styled, Text } from '@tamagui/web';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import type { ElementProps } from '../../../types/ElementProps';
import { boxFull, typography } from '../sidebarStyles';

const SidebarFooterContentFrame = styled(Text, {
	...boxFull,
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	...typography('micro'),

	variants: {
		rcx: { true: variantClass('rcx-sidebar-footer__content') },
	} as const,

	defaultVariants: { rcx: true },
});

export const SidebarFooterContent = asPublicFrame<ElementProps<HTMLDivElement>>(SidebarFooterContentFrame);
