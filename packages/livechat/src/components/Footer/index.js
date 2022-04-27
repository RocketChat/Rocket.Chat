import { withTranslation } from 'react-i18next';

import { PopoverMenu } from '../Menu';
import { createClassName } from '../helpers';
import Logo from './logo.svg';
import styles from './styles.scss';


export const Footer = ({ children, className, ...props }) => (
	<footer className={createClassName(styles, 'footer', {}, [className])} {...props}>
		{children}
	</footer>
);


export const FooterContent = ({ children, className, ...props }) => (
	<div className={createClassName(styles, 'footer__content', {}, [className])} {...props}>
		{children}
	</div>
);


export const PoweredBy = withTranslation()(({ className, t, ...props }) => (
	<h3 className={createClassName(styles, 'powered-by', {}, [className])} {...props}>
		{t('powered_by_rocket_chat').split('Rocket.Chat')[0]}
		<a href='https://rocket.chat' target='_blank' rel='noopener noreferrer'>
			<Logo className={createClassName(styles, 'powered-by__logo')} width={60} height={60 * 272 / 1500} role='img' aria-label='Rocket.Chat' />
		</a>
		{t('powered_by_rocket_chat').split('Rocket.Chat')[1]}
	</h3>
));


const handleMouseUp = ({ target }) => target.blur();

const OptionsTrigger = withTranslation()(({ pop, t }) => (
	<button className={createClassName(styles, 'footer__options')} onClick={pop} onMouseUp={handleMouseUp}>
		{t('options')}
	</button>
));


export const FooterOptions = ({ children }) => (
	<PopoverMenu trigger={OptionsTrigger} overlayed>
		{children}
	</PopoverMenu>
);


export const CharCounter = ({ className, style = {}, textLength, limitTextLength }) => (
	<span
		className={createClassName(styles, 'footer__remainder', { highlight: textLength === limitTextLength }, [className])}
		style={style}
	>
		{textLength} / {limitTextLength}
	</span>
);
