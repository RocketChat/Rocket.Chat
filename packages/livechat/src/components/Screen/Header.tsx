import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useTranslation, withTranslation } from 'react-i18next';

import type { Agent } from '../../definitions/agents';
import MinimizeIcon from '../../icons/arrowDown.svg';
import RestoreIcon from '../../icons/arrowUp.svg';
import NotificationsEnabledIcon from '../../icons/bell.svg';
import NotificationsDisabledIcon from '../../icons/bellOff.svg';
import OpenWindowIcon from '../../icons/newWindow.svg';
import store from '../../store';
import Alert from '../Alert';
import { Avatar } from '../Avatar';
import Header from '../Header';
import Tooltip from '../Tooltip';

type screenHeaderProps = {
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
	onRestore: () => unknown;
	onOpenWindow: () => unknown;
	queueInfo: {
		spot: number;
	};
	title: string;
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
}: screenHeaderProps) => {
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
				<Header.Post>
					{alerts?.map((alert) => (
						<Alert {...alert} onDismiss={onDismissAlert}>
							{alert.children}
						</Alert>
					))}
				</Header.Post>
			}
			large={largeHeader()}
		>
			{agent?.avatar && (
				<Header.Picture>
					<Avatar src={agent.avatar.src} description={agent.avatar.description} status={agent.status} large={largeHeader()} />
				</Header.Picture>
			)}

			<Header.Content>
				<Header.Title>{headerTitle()}</Header.Title>
				{agent?.email && <Header.SubTitle>{agent.email}</Header.SubTitle>}
				{agent?.phone && <Header.CustomField>{agent.phone}</Header.CustomField>}
			</Header.Content>
			<Tooltip.Container>
				<Header.Actions>
					<Tooltip.Trigger content={notificationsEnabled ? t('sound_is_on') : t('sound_is_off')} placement='bottom-left'>
						<Header.Action
							aria-label={notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
							onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
						>
							{notificationsEnabled ? (
								<NotificationsEnabledIcon width={20} height={20} />
							) : (
								<NotificationsDisabledIcon width={20} height={20} />
							)}
						</Header.Action>
					</Tooltip.Trigger>
					{(expanded || !windowed) && (
						<Tooltip.Trigger content={minimized ? t('restore_chat') : t('minimize_chat')}>
							<Header.Action aria-label={minimized ? t('restore_chat') : t('minimize_chat')} onClick={minimized ? onRestore : onMinimize}>
								{minimized ? <RestoreIcon width={20} height={20} /> : <MinimizeIcon width={20} height={20} />}
							</Header.Action>
						</Tooltip.Trigger>
					)}
					{!expanded && !windowed && (
						<Tooltip.Trigger content={t('expand_chat')} placement='bottom-left'>
							<Header.Action aria-label={t('expand_chat')} onClick={onOpenWindow}>
								<OpenWindowIcon width={20} height={20} />
							</Header.Action>
						</Tooltip.Trigger>
					)}
				</Header.Actions>
			</Tooltip.Container>
		</Header>
	);
};

export default withTranslation()(ScreenHeader);
