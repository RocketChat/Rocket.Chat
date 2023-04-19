import type { FunctionComponent } from 'preact';
import { useMemo, useRef } from 'preact/hooks';
import { withTranslation } from 'react-i18next';

import type { ILivechatAgent, IAlert } from '../../definitions/definition';
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
import Tooltip from '../Tooltip';

type ScreenHeaderProps = {
	alerts?: IAlert[];
	agent?: ILivechatAgent;
	notificationsEnabled?: boolean;
	minimized?: boolean;
	expanded?: boolean;
	windowed?: boolean;
	onDismissAlert?: () => void;
	onEnableNotifications?: () => void;
	onDisableNotifications?: () => void;
	onMinimize?: () => void;
	onRestore?: () => void;
	onOpenWindow?: () => void;
	queueInfo?: {
		spot: number;
	};
	title?: string;
	t: (key: string) => string;
};

const ScreenHeader: FunctionComponent<ScreenHeaderProps> = ({
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
	t,
}) => {
	const largeHeader = !!(agent?.email && agent.phone);

	const headerRef = useRef();

	const headerTitle = useMemo(() => {
		if (agent?.name) {
			return agent?.name;
		}

		if (queueInfo?.spot && queueInfo.spot > 0) {
			return t('waiting_queue');
		}

		return title;
	}, [agent?.name, queueInfo?.spot, t, title]);

	return (
		<Header
			ref={headerRef}
			post={
				<HeaderPost>
					{alerts?.map((alert) => (
						<Alert {...alert} onDismiss={onDismissAlert}>
							{alert.children}
						</Alert>
					))}
				</HeaderPost>
			}
			large={largeHeader}
		>
			{agent?.avatar && (
				<HeaderPicture>
					<Avatar src={agent.avatar.src} description={agent.avatar.description} status={agent.status} large={largeHeader} statusBorder />
				</HeaderPicture>
			)}

			<HeaderContent>
				<HeaderTitle>{headerTitle}</HeaderTitle>
				{agent?.email && <HeaderSubTitle>{agent.email}</HeaderSubTitle>}
				{agent?.phone && <HeaderCustomField>{agent.phone}</HeaderCustomField>}
			</HeaderContent>
			<Tooltip.Container>
				<HeaderActions>
					<Tooltip.Trigger content={notificationsEnabled ? t('sound_is_on') : t('sound_is_off')}>
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
					</Tooltip.Trigger>
					{(expanded || !windowed) && (
						<Tooltip.Trigger content={minimized ? t('restore_chat') : t('minimize_chat')}>
							<HeaderAction aria-label={minimized ? t('restore_chat') : t('minimize_chat')} onClick={minimized ? onRestore : onMinimize}>
								{minimized ? <RestoreIcon width={20} height={20} /> : <MinimizeIcon width={20} height={20} />}
							</HeaderAction>
						</Tooltip.Trigger>
					)}
					{!expanded && !windowed && (
						<Tooltip.Trigger content={t('expand_chat')} placement='bottom-left'>
							<HeaderAction aria-label={t('expand_chat')} onClick={onOpenWindow}>
								<OpenWindowIcon width={20} height={20} />
							</HeaderAction>
						</Tooltip.Trigger>
					)}
				</HeaderActions>
			</Tooltip.Container>
		</Header>
	);
};

export default withTranslation()(ScreenHeader);
