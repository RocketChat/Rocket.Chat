import { Box, Button, ButtonGroup, Icon, Margins } from '@rocket.chat/fuselage';
import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	// ContextualbarContent,
	ContextualbarFooter,
	ContextualbarIcon,
	ContextualbarSection,
	ContextualbarInnerContent,
	ContextualbarScrollableContent,
	ContextualbarButton,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type InternalCallHistoryContact = {
	_id: string;
	name?: string;
	username: string;
};

type ExternalCallHistoryContact = {
	number: string;
};

type CallHistoryContact = undefined;

type CallHistoryData = {
	callId: string;
	direction: 'inbound' | 'outbound';
	duration: number;
	startedAt: Date;
	state: 'ended' | 'not-answered' | 'failed' | 'error' | 'transferred';
	messageId?: string;
	contact: InternalCallHistoryContact | ExternalCallHistoryContact;
};

type HistoryActions = 'voiceCall' | 'videoCall' | 'jumpToMessage' | 'directMessage' | 'userInfo';

type HistoryActionCallbacks = Record<HistoryActions, () => void>;

type CallHistoryContextualBarProps = {
	onClose: () => void;
	actions: HistoryActionCallbacks;
	contact: InternalCallHistoryContact | ExternalCallHistoryContact;
};

const isInternalCallHistoryContact = (
	contact: InternalCallHistoryContact | ExternalCallHistoryContact,
): contact is InternalCallHistoryContact => {
	return '_id' in contact;
};

const CallHistoryContextualBar = ({ onClose, actions, contact }: CallHistoryContextualBarProps) => {
	const { t } = useTranslation();

	const { voiceCall, videoCall, jumpToMessage, directMessage, userInfo } = actions;

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarIcon name='info-circled' />
				<ContextualbarTitle>{t('Call_info')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				{/* <CallHistoryContactInfo />
                <CallHistoryDirection />
                <CallHistoryMessageBlock /> */}
				<Box mb={-16}>
					<Margins block={16}>
						<Box>
							test
						</Box>
                        <Box>
							test
						</Box>
                        <Box>
							test
						</Box>
					</Margins>
				</Box>
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
