import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type ModalMessageProps = {
	children: ComponentChildren;
};

const ModalMessage = ({ children }: ModalMessageProps) => <div className={createClassName(styles, 'modal__message')}>{children}</div>;

export default ModalMessage;
