import { useEffect } from 'preact/hooks';
import i18next from 'i18next';
import ChatIcon from '../../icons/chat.svg';
import CloseIcon from '../../icons/close.svg';
import { Button } from '../Button';
import { Footer, FooterContent, PoweredBy } from '../Footer';
import { PopoverContainer } from '../Popover';
import { Sound } from '../Sound';
import { createClassName } from '../helpers';
import ScreenHeader from './Header';
import styles from './styles.scss';

export const ScreenContent = ({ children, nopadding, triggered = false }) => (
	<main className={createClassName(styles, 'screen__main', { nopadding, triggered })}>
		{children}
	</main>
);


export const ScreenFooter = ({ children, options, limit }) => (
	<Footer>
		{children && (
			<FooterContent>
				{children}
			</FooterContent>
		)}
		<FooterContent>
			{options}
			{limit}
			<PoweredBy />
		</FooterContent>
	</Footer>
);

const ChatButton = ({
	text,
	minimized,
	badge,
	onClick,
	triggered = false,
	agent,
	label,
}) => (
	<Button
		icon={minimized || triggered ? <ChatIcon /> : <CloseIcon />}
		badge={badge}
		onClick={onClick}
		className={createClassName(styles, 'screen__chat-button')}
		img={triggered && agent && agent.avatar.src}
		label={label}
	>
		{text}
	</Button>
);

const CssVar = ({ theme }) => {
	useEffect(() => {
		if (window.CSS && CSS.supports('color', 'var(--color)')) {
			return;
		}
		let mounted = true;
		(async () => {
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

	return <style>{`
		.${ styles.screen } {
			${ theme.color ? `--color: ${ theme.color };` : '' }
			${ theme.fontColor ? `--font-color: ${ theme.fontColor };` : '' }
			${ theme.iconColor ? `--icon-color: ${ theme.iconColor };` : '' }
		}
	`}</style>;
};

export const Screen = ({
	theme = {},
	agent,
	title,
	notificationsEnabled,
	minimized = false,
	expanded = false,
	windowed = false,
	children,
	className,
	alerts,
	modal,
	unread,
	sound,
	onDismissAlert,
	onEnableNotifications,
	onDisableNotifications,
	onMinimize,
	onRestore,
	onOpenWindow,
	onSoundStop,
	queueInfo,
	dismissNotification,
	triggered = false,
	handleKeyDown,
	handleAppRef,
}) => (
	<div className={createClassName(styles, 'screen', { minimized, expanded, windowed, triggered })} ref={handleAppRef} onKeyDown={handleKeyDown}>	
		<CssVar theme={theme} />
		{triggered && <Button onClick={onMinimize} className={createClassName(styles, 'screen__chat-close-button')} icon={<CloseIcon />} label={i18next.t('close_the_chat')}>Close</Button>}
		<div className={createClassName(styles, 'screen__inner', { fitTextSize: triggered }, [className])} role='dialog' aria-modal='true' aria-labelledby='header__title-id'>
			<PopoverContainer>
				{!triggered && <ScreenHeader
					alerts={alerts}
					agent={agent}
					title={title}
					notificationsEnabled={notificationsEnabled}
					minimized={minimized}
					expanded={expanded}
					windowed={windowed}
					onDismissAlert={onDismissAlert}
					onEnableNotifications={onEnableNotifications}
					onDisableNotifications={onDisableNotifications}
					onMinimize={onMinimize}
					onRestore={onRestore}
					onOpenWindow={onOpenWindow}
					queueInfo={queueInfo}
				/>}

				{modal}
				{children}
			</PopoverContainer>
		</div>

		<ChatButton
			agent={agent}
			triggered={triggered}
			text={title}
			badge={unread}
			minimized={minimized}
			onClick={minimized ? onRestore : onMinimize}
		/>

		{sound && <Sound src={sound.src} play={sound.play} onStop={onSoundStop} dismissNotification={dismissNotification} />}
	</div>
);


Screen.Content = ScreenContent;
Screen.Footer = ScreenFooter;


export default Screen;
