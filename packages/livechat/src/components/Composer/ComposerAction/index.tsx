import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

type ComposerActionProps = {
	text: string;
	onClick: () => void;
	className?: string;
	style?: CSSProperties;
	children?: ComponentChildren;
	disabled?: boolean;
};

export const ComposerAction = memo(({ text, onClick, className, style = {}, children, disabled }: ComposerActionProps) => (
	<button
		type='button'
		aria-label={text}
		onClick={onClick}
		className={createClassName(styles, 'composer__action', {}, [className])}
		style={style}
		disabled={disabled}
	>
		{children}
	</button>
));
