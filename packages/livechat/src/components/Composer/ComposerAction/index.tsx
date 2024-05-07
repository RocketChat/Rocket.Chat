import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type ComposerActionProps = {
	text: string;
	onClick: () => void;
	className?: string;
	style?: CSSProperties;
	children?: ComponentChildren;
};

export const ComposerAction = memo(({ text, onClick, className, style = {}, children }: ComposerActionProps) => (
	<button
		type='button'
		aria-label={text}
		onClick={onClick}
		className={createClassName(styles, 'composer__action', {}, [className])}
		style={style}
	>
		{children}
	</button>
));
