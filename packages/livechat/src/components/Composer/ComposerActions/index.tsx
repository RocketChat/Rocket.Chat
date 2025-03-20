import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type ComposerActionsProps = {
	className?: string;
	style?: CSSProperties;
	children?: ComponentChildren;
};

export const ComposerActions = memo(({ className, style = {}, children }: ComposerActionsProps) => (
	<div className={createClassName(styles, 'composer__actions', {}, [className])} style={style}>
		{children}
	</div>
));
