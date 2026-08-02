import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

type ComposerActionProps = {
	text: string;
	onClick: () => void;
	className?: string;
	style?: CSSProperties;
	children?: ComponentChildren;
	disabled?: boolean;
	ghost?:boolean
};

export const ComposerAction = ({ text, onClick, className, style = {}, children, disabled,ghost }: ComposerActionProps) => {

	return (
		<button
			type='button'
			aria-label={text}
			onClick={onClick}
			className={createClassName(styles, 'composer__action', {disabled,ghost}, [className])}
			style={style}
			disabled={disabled}
		>
			{children}
		</button>
	)
};
