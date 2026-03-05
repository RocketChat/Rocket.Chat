import type { CSSProperties } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type CharCounterProps = {
	className?: string;
	style?: CSSProperties;
	textLength: number;
	limitTextLength: number;
};

const CharCounter = ({ className, style = {}, textLength, limitTextLength }: CharCounterProps) => (
	<span className={createClassName(styles, 'footer__remainder', { highlight: textLength === limitTextLength }, [className])} style={style}>
		{textLength} / {limitTextLength}
	</span>
);

export default CharCounter;
