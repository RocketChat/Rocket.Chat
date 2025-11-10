import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

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
