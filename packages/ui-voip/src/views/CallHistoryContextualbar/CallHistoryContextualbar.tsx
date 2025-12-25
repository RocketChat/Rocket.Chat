import { Box, Button, ButtonGroup, Icon, MessageBlock } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitMessage as UiKitMessageSurfaceRender, UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import {
	ContextualbarDialog,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarFooter,
	ContextualbarIcon,
	ContextualbarScrollableContent,
	InfoPanel,
	InfoPanelSection,
	InfoPanelLabel,
	InfoPanelText,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { HistoryActionCallbacks } from './CallHistoryActions';
import CallHistoryActions from './CallHistoryActions';
import { useFullStartDate } from './useFullStartDate';
import { CallHistoryExternalUser, CallHistoryInternalUser } from '../../components';
import { getHistoryMessagePayload } from '../../ui-kit/getHistoryMessagePayload';

export type InternalCallHistoryContact = {
	_id: string;
	name?: string;
	username: string;
	voiceCallExtension?: string;
};

export type ExternalCallHistoryContact = {
	number: string;
};

export type CallHistoryData = {
	callId: string;
	direction: 'inbound' | 'outbound';
	duration: number;
	startedAt: Date;
	state: 'ended' | 'not-answered' | 'failed' | 'error' | 'transferred';
	messageId?: string;
};

type CallHistoryContextualBarProps = {
	onClose: () => void;
	actions: HistoryActionCallbacks;
	contact: InternalCallHistoryContact | ExternalCallHistoryContact;
	data: CallHistoryData;
};

const isInternalCallHistoryContact = (
	contact: InternalCallHistoryContact | ExternalCallHistoryContact,
): contact is InternalCallHistoryContact => {
	return '_id' in contact;
};

const contextValue = {
	action: () => undefined,
	rid: '',
	values: {},
};

const CallHistoryContextualBar = ({ onClose, actions, contact, data }: CallHistoryContextualBarProps) => {
	const { t } = useTranslation();

	const { voiceCall, directMessage } = actions;
	const { duration, callId, direction, startedAt } = data;

	const date = useFullStartDate(startedAt);
	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='info-circled' />
				<ContextualbarTitle>{t('Call_info')}</ContextualbarTitle>
				<CallHistoryActions onClose={onClose} actions={actions} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelSection>
						{isInternalCallHistoryContact(contact) ? (
							<CallHistoryInternalUser username={contact.username} name={contact.name} _id={contact._id} />
						) : (
							<CallHistoryExternalUser number={contact.number} />
						)}
					</InfoPanelSection>
					<InfoPanelSection>
						<Box display='flex' flexDirection='row' alignItems='center' fontScale='p1b'>
							<Icon name={direction === 'inbound' ? 'arrow-down-left' : 'arrow-up-right'} size={24} mie={8} />
							{direction === 'inbound' ? t('Incoming_voice_call') : t('Outgoing_voice_call')}
						</Box>
					</InfoPanelSection>
					<InfoPanelSection>
						<MessageBlock fixedWidth>
							<UiKitContext.Provider value={contextValue}>
								<UiKitComponent render={UiKitMessageSurfaceRender} blocks={getHistoryMessagePayload(data.state, duration).blocks} />
							</UiKitContext.Provider>
						</MessageBlock>
						<Box mbs={-8}>{date}</Box>
					</InfoPanelSection>
					<InfoPanelSection>
						<InfoPanelLabel>{t('Call_ID')}</InfoPanelLabel>
						<InfoPanelText>{callId}</InfoPanelText>
					</InfoPanelSection>
					{isInternalCallHistoryContact(contact) && contact.voiceCallExtension && (
						<InfoPanelSection>
							<InfoPanelLabel>{t('Voice_call_extension')}</InfoPanelLabel>
							<InfoPanelText>{contact.voiceCallExtension}</InfoPanelText>
						</InfoPanelSection>
					)}
				</InfoPanel>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{isInternalCallHistoryContact(contact) && directMessage && (
						<Button onClick={directMessage}>
							<Icon name='balloon' size='x20' mie='x4' />
							{t('Direct_message')}
						</Button>
					)}
					{voiceCall && (
						<Button success onClick={voiceCall}>
							<Icon name='phone' size='x20' mie='x4' />
							{t('Call')}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default CallHistoryContextualBar;
