import { useEffect } from 'preact/hooks';

import type { ScreenTheme } from './ScreenProvider';
import styles from './styles.scss';

export type CssVarProps = {
	theme: ScreenTheme;
};

const CssVar = ({ theme }: CssVarProps) => {
	useEffect(() => {
		if (window.CSS && CSS.supports('color', 'var(--color)')) {
			return;
		}
		let mounted = true;
		void (async () => {
			const { default: cssVars } = await import('css-vars-ponyfill');
			if (!mounted) {
				return;
			}
			cssVars({
				variables: {
					'--color': theme.color,
					'--font-color': theme.fontColor,
					'--icon-color': theme.iconColor,
				},
			});
		})();
		return () => {
			mounted = false;
		};
	}, [theme]);

	return (
		<style>{`
		.${styles.screen} {
			${theme.color ? `--color: ${theme.color};` : ''}
			${theme.fontColor ? `--font-color: ${theme.fontColor};` : ''}
			${theme.iconColor ? `--icon-color: ${theme.iconColor};` : ''}
			${theme.guestBubbleBackgroundColor ? `--sender-bubble-background-color: ${theme.guestBubbleBackgroundColor};` : ''}
			${theme.agentBubbleBackgroundColor ? `--receiver-bubble-background-color: ${theme.agentBubbleBackgroundColor};` : ''}
			${theme.background ? `--message-list-background: ${theme.background};` : ''}
		}
	`}</style>
	);
};

export default CssVar;
