import { Component } from 'preact';
import { withTranslation } from 'react-i18next';

import MinimizeIcon from '../../icons/arrowDown.svg';
import RestoreIcon from '../../icons/arrowUp.svg';
import NotificationsEnabledIcon from '../../icons/bell.svg';
import NotificationsDisabledIcon from '../../icons/bellOff.svg';
import OpenWindowIcon from '../../icons/newWindow.svg';
import Alert from '../Alert';
import { Avatar } from '../Avatar';
import Header from '../Header';
import Tooltip from '../Tooltip';

class ScreenHeader extends Component {
	largeHeader = () => {
		const { agent } = this.props;
		return !!(agent && agent.email && agent.phone);
	}

	headerTitle = (t) => {
		const { agent, queueInfo, title } = this.props;
		if (agent && agent.name) {
			return agent.name;
		}

		if (queueInfo && queueInfo.spot && queueInfo.spot > 0) {
			return t('waiting_queue');
		}

		return title;
	}

	render = ({
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
		t,
	}) => (
		<Header
			ref={this.handleRef}
			post={
				<Header.Post>
					{alerts && alerts.map((alert) => <Alert {...alert} onDismiss={onDismissAlert}>{alert.children}</Alert>)}
				</Header.Post>
			}
			large={this.largeHeader()}
		>
			{agent && agent.avatar && (
				<Header.Picture>
					<Avatar
						src={agent.avatar.src}
						description={agent.avatar.description}
						status={agent.status}
						large={this.largeHeader()}
						statusBorder
					/>
				</Header.Picture>
			)}

			<Header.Content>
				<Header.Title>{this.headerTitle(t)}</Header.Title>
				{agent && agent.email && (
					<Header.SubTitle>{agent.email}</Header.SubTitle>
				)}
				{agent && agent.phone && (
					<Header.CustomField>{agent.phone}</Header.CustomField>
				)}
			</Header.Content>
			<Tooltip.Container>
				<Header.Actions>
					<Tooltip.Trigger content={notificationsEnabled ? t('sound_is_on') : t('sound_is_off')}>
						<Header.Action
							aria-label={notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
							onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
						>
							{notificationsEnabled
								? <NotificationsEnabledIcon width={20} height={20} />
								: <NotificationsDisabledIcon width={20} height={20} />
							}
						</Header.Action>
					</Tooltip.Trigger>
					{(expanded || !windowed) && (
						<Tooltip.Trigger content={minimized ? t('restore_chat') : t('minimize_chat')}>
							<Header.Action
								aria-label={minimized ? t('restore_chat') : t('minimize_chat')}
								onClick={minimized ? onRestore : onMinimize}
							>
								{minimized
									? <RestoreIcon width={20} height={20} />
									: <MinimizeIcon width={20} height={20} />
								}
							</Header.Action>
						</Tooltip.Trigger>
					)}
					{(!expanded && !windowed) && (
						<Tooltip.Trigger content={t('expand_chat')} placement='bottom-left'>
							<Header.Action aria-label={t('expand_chat')} onClick={onOpenWindow}>
								<OpenWindowIcon width={20} height={20} />
							</Header.Action>
						</Tooltip.Trigger>
					)}
				</Header.Actions>
			</Tooltip.Container>
		</Header>
	)
}

export default withTranslation()(ScreenHeader);
