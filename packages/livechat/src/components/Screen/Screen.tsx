import { useContext } from 'preact/hooks';

import { createClassName } from '../../helpers/createClassName';
import CloseIcon from '../../icons/close.svg';
import { Button } from '../Button';
import { PopoverContainer } from '../Popover';
import { Sound } from '../Sound';
import { ChatButton } from './ChatButton';
import CssVar from './CssVar';
import ScreenHeader from './Header';
import { ScreenContext } from './ScreenProvider';
import styles from './styles.scss';

export type ScreenProps = {
	title: string;
	color?: string;
	agent?: any;
	children?: any;
	className?: string;
	unread?: number;
	triggered?: boolean;
	queueInfo?: any;
	onSoundStop?: () => void;
	ref?: any; // FIXME: remove this
};

const Screen = ({ title, color, agent, children, className, unread, triggered = false, queueInfo, onSoundStop }: ScreenProps) => {
	const {
		theme,
		livechatLogo,
		notificationsEnabled,
		minimized = false,
		expanded = false,
		windowed = false,
		alerts,
		modal,
		sound,
		onDismissAlert,
		onEnableNotifications,
		onDisableNotifications,
		onMinimize,
		onRestore,
		onOpenWindow,
		dismissNotification,
	} = useContext(ScreenContext);

	return (
		<div
			className={createClassName(styles, 'screen', {
				minimized,
				expanded,
				windowed,
				triggered,
				'position-left': theme.position === 'left',
			})}
		>
			<CssVar theme={{ ...theme, color: color || theme.color }} />
			{triggered && (
				<Button onClick={onMinimize} className={createClassName(styles, 'screen__chat-close-button')} icon={<CloseIcon />}>
					Close
				</Button>
			)}
			<div className={createClassName(styles, 'screen__inner', { fitTextSize: triggered }, [className])}>
				<PopoverContainer>
					{!triggered && (
						<ScreenHeader
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
							hideExpandChat={theme.hideExpandChat}
						/>
					)}

					{modal}
					{children}
				</PopoverContainer>
			</div>

			<ChatButton
				triggered={triggered}
				text={title}
				badge={unread}
				minimized={minimized}
				logoUrl={livechatLogo?.url}
				className={createClassName(styles, 'screen__chat-button')}
				onClick={minimized ? onRestore : onMinimize}
			/>

			{sound && <Sound src={sound.src} play={sound.play} onStop={onSoundStop} dismissNotification={dismissNotification} />}
		</div>
	);
};

export default Screen;
