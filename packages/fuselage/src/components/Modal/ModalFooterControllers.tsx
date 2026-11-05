import type { ButtonGroupProps } from '..';
import { ButtonGroup } from '..';

export type ModalFooterControllersProps = ButtonGroupProps;

const ModalFooterControllers = ({ children }: ModalFooterControllersProps) => <ButtonGroup align='end'>{children}</ButtonGroup>;

export default ModalFooterControllers;
