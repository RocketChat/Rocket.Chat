import { styled } from '@tamagui/web';

import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import type { ButtonGroupProps } from '../ButtonGroup';
import { ButtonGroupFrame } from '../ButtonGroup/ButtonGroup';

export type NavBarGroupProps = ButtonGroupProps;

const NavBarGroup = styled(ButtonGroupFrame, {
	variants: {
		rcx: { true: variantClass('rcx-button-group rcx-navbar-group') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<NavBarGroupProps>(NavBarGroup);
