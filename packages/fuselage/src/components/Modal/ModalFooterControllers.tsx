import type { ButtonGroupProps } from '..';
import { ButtonGroup } from '..';

export type ModalFooterControllersProps = ButtonGroupProps;

/** Groups the footer's buttons at its end. */
const ModalFooterControllers = (props: ModalFooterControllersProps) => <ButtonGroup align='end' {...props} />;

export default ModalFooterControllers;
