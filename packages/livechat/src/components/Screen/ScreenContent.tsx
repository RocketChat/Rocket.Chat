import { type ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type ScreenContentProps = {
	children?: ComponentChildren;
	nopadding?: boolean;
	triggered?: boolean;
	full?: boolean;
};

const ScreenContent = ({ children, nopadding, triggered = false, full = false }: ScreenContentProps) => (
	<main className={createClassName(styles, 'screen__main', { nopadding, triggered, full })}>{children}</main>
);

export default ScreenContent;
