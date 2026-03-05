import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useTranslation, withTranslation } from 'react-i18next';

import type { ScreenContextValue } from './ScreenProvider';
import type { Agent } from '../../definitions/agents';
import MinimizeIcon from '../../icons/arrowDown.svg';
import RestoreIcon from '../../icons/arrowUp.svg';
import NotificationsEnabledIcon from '../../icons/bell.svg';
import NotificationsDisabledIcon from '../../icons/bellOff.svg';
import OpenWindowIcon from '../../icons/newWindow.svg';
import Alert from '../Alert';
import { Avatar } from '../Avatar';
import {
	Header,
	HeaderAction,
	HeaderActions,
	HeaderContent,
	HeaderCustomField,
	HeaderPicture,
	HeaderPost,
	HeaderSubTitle,
	HeaderTitle,
} from '../Header';
import { TooltipContainer, TooltipTrigger } from '../Tooltip';

type ScreenHeaderProps = {
	alerts: { id: string; children: ComponentChildren; [key: string]: unknown }[];
	agent: Agent;
	notificationsEnabled: boolean;
	minimized: boolean;
	expanded: boolean;
	windowed: boolean;
	onDismissAlert?: (id?: string) => void;
	onEnableNotifications: () => unknown;
	onDisableNotifications: () => unknown;
	onMinimize: () => unknown;
	onRestore: ScreenContextValue['onRestore'];
	onOpenWindow: () => unknown;
	queueInfo: {
		spot: number;
	};
	title: string;
	hideExpandChat: boolean;
};

const ScreenHeader = ({
	alerts,
	agent,
	notificationsEnabled,
	minimized,
	expanded,
	windowed,
	onDismissAlert,
	onEnableNotifications,
	onDisableNotifications,
	onMinimize,
	onRestore,
	onOpenWindow,
	queueInfo,
	title,
	hideExpandChat,
}: ScreenHeaderProps) => {
	const { t } = useTranslation();
	const headerRef = useRef<HTMLElement>(null);

	const largeHeader = () => {
		return !!(agent?.email && agent.phone);
	};

	const headerTitle = () => {
		if (agent?.name) {
			return agent.name;
		}

		if (queueInfo?.spot && queueInfo.spot > 0) {
			return t('waiting_queue');
		}

		return title;
	};

	return (
		<Header
			ref={headerRef}
			post={
				<HeaderPost>
					{alerts?.map((alert) => (
						<Alert key={alert.id} {...alert} onDismiss={onDismissAlert}>
							{alert.children}
						</Alert>
					))}
				</HeaderPost>
			}
			large={largeHeader()}
		>
			{agent?.avatar && (
				<HeaderPicture>
					<Avatar src={agent.avatar.src} description={agent.avatar.description} status={agent.status} large={largeHeader()} />
				</HeaderPicture>
			)}

			<HeaderContent>
				<HeaderTitle>{headerTitle()}</HeaderTitle>
				{agent?.email && <HeaderSubTitle>{agent.email}</HeaderSubTitle>}
				{agent?.phone && <HeaderCustomField>{agent.phone}</HeaderCustomField>}
			</HeaderContent>
			<TooltipContainer>
				<HeaderActions>
					<TooltipTrigger content={notificationsEnabled ? t('sound_is_on') : t('sound_is_off')} placement='bottom-left'>
						<HeaderAction
							aria-label={notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
							onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
						>
							{notificationsEnabled ? (
								<NotificationsEnabledIcon width={20} height={20} />
							) : (
								<NotificationsDisabledIcon width={20} height={20} />
							)}
						</HeaderAction>
					</TooltipTrigger>
					{(expanded || !windowed) && (
						<TooltipTrigger content={minimized ? t('restore_chat') : t('minimize_chat')}>
							<HeaderAction aria-label={minimized ? t('restore_chat') : t('minimize_chat')} onClick={minimized ? onRestore : onMinimize}>
								{minimized ? <RestoreIcon width={20} height={20} /> : <MinimizeIcon width={20} height={20} />}
							</HeaderAction>
						</TooltipTrigger>
					)}
					{!hideExpandChat && !expanded && !windowed && (
						<TooltipTrigger content={t('expand_chat')} placement='bottom-left'>
							<HeaderAction aria-label={t('expand_chat')} onClick={onOpenWindow}>
								<OpenWindowIcon width={20} height={20} />
							</HeaderAction>
						</TooltipTrigger>
					)}
				</HeaderActions>
			</TooltipContainer>
		</Header>
	);
};

export default withTranslation()(ScreenHeader);
