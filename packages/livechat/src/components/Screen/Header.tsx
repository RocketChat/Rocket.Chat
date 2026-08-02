import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useTranslation, withTranslation } from 'react-i18next';

import type { Agent } from '../../definitions/agents';
import CloseIcon from '../../icons/close.svg';
import UserIcon from '../../icons/user.svg';
import LogoImage from '../../assets/images/logo.png'
import Alert from '../Alert';
import Header from '../Header';
import Tooltip from '../Tooltip';
import type { ScreenContextValue } from './ScreenProvider';

type ScreenHeaderProps = {
	alerts: { id: string; children: ComponentChildren;[key: string]: unknown }[];
	agent: Agent;
	notificationsEnabled: boolean;
	minimized: boolean;
	expanded: boolean;
	windowed: boolean;
	onDismissAlert?: (id?: string) => void;
	onSupportClick?: () => void;
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
	onSupportClick,
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

			<Header.Picture>
				<img src={LogoImage} />
			</Header.Picture>


			<Tooltip.Container>
				<Header.Actions>
					<Header.Action aria-label={t('cantact_with_support')} primary onClick={onSupportClick}>
						<UserIcon width={20} height={20} />
						<Header.SubTitle>{t('cantact_with_support')}</Header.SubTitle>
					</Header.Action>

					{(expanded || !windowed) && (
						<Header.Action ghost aria-label={minimized ? t('restore_chat') : t('minimize_chat')} onClick={minimized ? onRestore : onMinimize}>
							<CloseIcon width={24} height={24} />
						</Header.Action>
					)}

				</Header.Actions>
			</Tooltip.Container>
		</Header>
	);
};

export default withTranslation()(ScreenHeader);
