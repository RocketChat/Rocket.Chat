import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { boxFull } from '../sidebarStyles';

const SidebarListItemFrame = styled(View, {
	...boxFull,
	display: 'block',
	role: 'listitem',

	variants: {
		rcx: { true: variantClass('rcx-sidebar-item__list-item') },
	} as const,

	defaultVariants: { rcx: true },
});

type SidebarListItemProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		selected?: boolean;
	};

export const SidebarListItem = asPublicFrame<SidebarListItemProps>(SidebarListItemFrame);
