import * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { memo, useCallback } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import { usePerformAction } from '../Block';
import styles from './styles.scss';

const handleMouseUp = ({ currentTarget }: TargetedEvent<HTMLElement, MouseEvent>) => currentTarget.blur();

type ButtonElementProps = uikit.ButtonElement & {
	context: uikit.BlockContext;
	parser: uikit.SurfaceRenderer<ComponentChild>;
};

const ButtonElement = ({ text, actionId, url, value, style, context, confirm, parser }: ButtonElementProps) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleClick = useCallback(
		async (event: TargetedEvent<HTMLElement, MouseEvent>) => {
			event.preventDefault();

			if (confirm) {
				// TODO
			}

			if (url) {
				const newTab = window.open();
				if (!newTab) {
					throw new Error('Failed to open new tab');
				}
				newTab.opener = null;
				newTab.location = url;
				return;
			}

			await performAction({ value });
		},
		[confirm, performAction, url, value],
	);

	return (
		<button
			children={parser.text(text)}
			className={createClassName(styles, 'uikit-button', {
				style,
				accessory: context === uikit.BlockContext.SECTION,
				action: context === uikit.BlockContext.ACTION,
			})}
			disabled={performingAction}
			type='button'
			onClick={handleClick}
			onMouseUp={handleMouseUp}
		/>
	);
};

export default memo(ButtonElement);
