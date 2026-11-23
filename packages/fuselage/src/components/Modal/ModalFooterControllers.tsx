import type { ButtonGroupProps } from '../index.js';
import { ButtonGroup } from '../index.js';

export type ModalFooterControllersProps = ButtonGroupProps;

const ModalFooterControllers = (props: ModalFooterControllersProps) => <ButtonGroup align='end' {...props} />;

export default ModalFooterControllers;
