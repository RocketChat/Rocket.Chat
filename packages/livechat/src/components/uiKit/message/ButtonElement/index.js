import { BlockContext } from '@rocket.chat/ui-kit';
import { memo, useCallback } from 'preact/compat';

import { createClassName } from '../../../helpers';
import { usePerformAction } from '../Block';
import styles from './styles.scss';

const handleMouseUp = ({ target }) => target.blur();

const ButtonElement = ({ text, actionId, url, value, style, context, confirm, parser }) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleClick = useCallback(
		async (event) => {
			event.preventDefault();

			if (confirm) {
				// TODO
			}

			if (url) {
				const newTab = window.open();
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
				accessory: context === BlockContext.SECTION,
				action: context === BlockContext.ACTION,
			})}
			disabled={performingAction}
			type='button'
			onClick={handleClick}
			onMouseUp={handleMouseUp}
		/>
	);
};

export default memo(ButtonElement);
