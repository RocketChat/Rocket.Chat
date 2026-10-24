import { styled } from '@tamagui/web';

import { asPublicFrame } from '../../helpers/asPublicFrame';
import type { ButtonGroupProps } from '../ButtonGroup';
import { ButtonGroupFrame } from '../ButtonGroup/ButtonGroup';

export type ModalFooterControllersProps = ButtonGroupProps;

const ModalFooterControllers = styled(ButtonGroupFrame, {
	// Tamagui applies a parent's variants as a child's defaults but doesn't type them there
	defaultVariants: { align: 'end' } as never,
});

export default asPublicFrame<ModalFooterControllersProps>(ModalFooterControllers);
