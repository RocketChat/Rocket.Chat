import type { ButtonGroupProps } from '..';
import { ButtonGroup } from '..';

export type ModalFooterControllersProps = ButtonGroupProps;

const ModalFooterControllers = (props: ModalFooterControllersProps) => <ButtonGroup align='end' {...props} />;

export default ModalFooterControllers;
