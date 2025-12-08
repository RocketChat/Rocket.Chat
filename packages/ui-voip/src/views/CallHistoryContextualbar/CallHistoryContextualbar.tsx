import { Box, Button, ButtonGroup, Icon, MessageBlock } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitMessage as UiKitMessageSurfaceRender, UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarFooter,
	ContextualbarIcon,
	ContextualbarScrollableContent,
	InfoPanel,
	InfoPanelSection,
	InfoPanelLabel,
	InfoPanelText,
} from '@rocket.chat/ui-client';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import CallHistoryExternalUser from './CallHistoryExternalUser';
import CallHistoryInternalUser from './CallHistoryInternalUser';
import { useFullStartDate } from './useFullStartDate';

type InternalCallHistoryContact = {
	_id: string;
	name?: string;
	username: string;
	voiceCallExtension?: string;
};

type ExternalCallHistoryContact = {
	number: string;
};

type CallHistoryData = {
	callId: string;
	direction: 'inbound' | 'outbound';
	duration: number;
	startedAt: Date;
	state: 'ended' | 'not-answered' | 'failed' | 'error' | 'transferred';
	messageId?: string;
};

type HistoryActions = 'voiceCall' | 'videoCall' | 'jumpToMessage' | 'directMessage' | 'userInfo';

type HistoryActionCallbacks = Record<HistoryActions, () => void>;

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

// TODO use the same function that generates the message-block payload on the server. Duration will also be displayed here.
const getBlocks = (t: TFunction) => {
	return [
		{
			type: 'info_card' as const,
			rows: [
				{
					background: 'default' as const,
					elements: [
						{ type: 'icon', icon: 'phone-off', variant: 'default' },
						{ type: 'mrkdwn', i18n: { key: 'Call_ended_bold' }, text: t('Call_ended') },
					] as const,
				},
			],
		},
	];
};

const CallHistoryContextualBar = ({ onClose, actions, contact, data }: CallHistoryContextualBarProps) => {
	const { t } = useTranslation();

	const { voiceCall, /* videoCall, jumpToMessage, */ directMessage, userInfo /* voiceCallExtension, direction */ } = actions;
	const { duration, callId, direction, startedAt } = data;

	const date = useFullStartDate(startedAt);
	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarIcon name='info-circled' />
				<ContextualbarTitle>{t('Call_info')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelSection>
						{isInternalCallHistoryContact(contact) ? (
							<CallHistoryInternalUser username={contact.username} name={contact.name} _id={contact._id} onUserClick={userInfo} />
						) : (
							<CallHistoryExternalUser number={contact.number} />
						)}
					</InfoPanelSection>
					<InfoPanelSection>
						<Box display='flex' flexDirection='row' alignItems='center' fontScale='p1m'>
							{/* TODO use `arrow-up-right` and `arrow-down-left` icons when available */}
							<Icon name={direction === 'inbound' ? 'phone-in' : 'phone-out'} size='x20' mie='x4' />
							{direction === 'inbound' ? t('Incoming_voice_call') : t('Outgoing_voice_call')}
						</Box>
					</InfoPanelSection>
					<InfoPanelSection>
						<MessageBlock fixedWidth>
							<UiKitContext.Provider value={contextValue}>
								<UiKitComponent render={UiKitMessageSurfaceRender} blocks={getBlocks(t)} />
							</UiKitContext.Provider>
						</MessageBlock>
						<Box mbs={-8}>{date}</Box>
					</InfoPanelSection>
					<InfoPanelSection>
						<InfoPanelLabel>{t('Duration')}</InfoPanelLabel>
						<InfoPanelText>{duration}</InfoPanelText>
					</InfoPanelSection>
					<InfoPanelSection>
						<InfoPanelLabel>{t('Call_ID')}</InfoPanelLabel>
						<InfoPanelText>{callId}</InfoPanelText>
					</InfoPanelSection>
					{isInternalCallHistoryContact(contact) && contact.voiceCallExtension && (
						<InfoPanelSection>
							<InfoPanelLabel>{t('Voice_Call_Extension')}</InfoPanelLabel>
							<InfoPanelText>{contact.voiceCallExtension}</InfoPanelText>
						</InfoPanelSection>
					)}
				</InfoPanel>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{isInternalCallHistoryContact(contact) && (
						<Button onClick={directMessage}>
							<Icon name='balloon' size='x20' mie='x4' />
							{t('Direct_message')}
						</Button>
					)}
					<Button success onClick={voiceCall}>
						<Icon name='phone' size='x20' mie='x4' />
						{t('Call')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default CallHistoryContextualBar;
