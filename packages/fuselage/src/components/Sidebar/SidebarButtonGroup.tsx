import { styled } from '@tamagui/web';

import { asPublicFrame } from '../../helpers/asPublicFrame';
import type { ButtonGroupProps } from '../ButtonGroup';
import { ButtonGroupFrame } from '../ButtonGroup/ButtonGroup';

const SidebarButtonGroupFrame = styled(ButtonGroupFrame, {
	// Tamagui applies a parent's variants as a child's defaults but doesn't type them there
	defaultVariants: { align: 'end', small: true } as never,
});

export const SidebarButtonGroup = asPublicFrame<ButtonGroupProps>(SidebarButtonGroupFrame);
