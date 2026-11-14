import { useCallback } from 'preact/compat';

import { usePerformAction } from '../Block';
import { cx, safeUrl } from './helpers';

type ContextActionButtonProps = { actionId: string; label?: string; glyph: string; value?: string; url?: string };

const ContextActionButton = ({ actionId, label, glyph, value, url }: ContextActionButtonProps) => {
	const [performAction, performing] = usePerformAction(actionId);

	const handleClick = useCallback(async () => {
		const href = safeUrl(url);
		if (href) {
			window.open(href, '_blank', 'noopener,noreferrer');
			return;
		}
		await performAction({ value });
	}, [performAction, url, value]);

	return (
		<button
			type='button'
			className={cx('uikit-context-action')}
			disabled={performing}
			aria-label={label}
			title={label}
			onClick={handleClick}
		>
			{glyph}
		</button>
	);
};

export default ContextActionButton;
