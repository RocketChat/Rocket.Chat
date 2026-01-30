import { RocketChatLogo } from '@rocket.chat/logo';
import type { ComponentChildren } from 'preact';
import type { JSXInternal } from 'preact/src/jsx';
import { useTranslation, withTranslation } from 'react-i18next';

import { createClassName } from '../../helpers/createClassName';
import { PopoverMenu } from '../Menu';
import styles from './styles.scss';

export const Footer = ({ children, className, ...props }: { children: ComponentChildren; className?: string }) => (
	<footer className={createClassName(styles, 'footer', {}, [className])} {...props}>
		{children}
	</footer>
);

export const FooterContent = ({ children, className, ...props }: { children: ComponentChildren; className?: string }) => (
	<div className={createClassName(styles, 'footer__content', {}, [className])} {...props}>
		{children}
	</div>
);

export const PoweredBy = withTranslation()(({ className, t, ...props }: { className?: string; t: (translationKey: string) => string }) => (
	<h3 data-qa='livechat-watermark' className={createClassName(styles, 'powered-by', {}, [className])} {...props}>
		{t('powered_by_rocket_chat').split('Rocket.Chat')[0]}
		<a className={createClassName(styles, 'powered-by__logo')} href='https://rocket.chat' target='_blank' rel='noopener noreferrer'>
			<RocketChatLogo />
		</a>
		{t('powered_by_rocket_chat').split('Rocket.Chat')[1]}
	</h3>
));

const handleMouseUp: JSXInternal.MouseEventHandler<HTMLButtonElement> = ({ target }: { target: EventTarget | null }) =>
	(target as HTMLButtonElement)?.blur();

const OptionsTrigger = ({ pop }: { pop: () => void }) => {
	const { t } = useTranslation();
	return (
		<button className={createClassName(styles, 'footer__options')} onClick={pop} onMouseUp={handleMouseUp}>
			{t('options')}
		</button>
	);
};

export const FooterOptions = ({ children }: { children: ComponentChildren }) => (
	<PopoverMenu trigger={OptionsTrigger} overlayed>
		{children}
	</PopoverMenu>
);

export const CharCounter = ({
	className,
	style = {},
	textLength,
	limitTextLength,
}: {
	className?: string;
	style: JSXInternal.CSSProperties;
	textLength: number;
	limitTextLength: number;
}) => (
	<span className={createClassName(styles, 'footer__remainder', { highlight: textLength === limitTextLength }, [className])} style={style}>
		{textLength} / {limitTextLength}
	</span>
);
