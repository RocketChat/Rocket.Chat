import { Box, Icon, FramedIcon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { CallHistoryExternalContact, CallHistoryInternalContact } from '../definitions';
import CallHistoryInternalUser from './CallHistoryInternalUser';

export type CallHistoryExternalUserProps = {
	contact: CallHistoryExternalContact;
	showIcon?: boolean;
};

const getMatchedContact = (
	contact: CallHistoryExternalContact & Pick<Required<CallHistoryExternalContact>, 'uid' | 'username'>,
): CallHistoryInternalContact => {
	const { uid: _id, username, name, number: voiceCallExtension } = contact;

	return {
		_id,
		username,
		name,
		voiceCallExtension,
	};
};

const CallHistoryExternalUser = ({ contact, showIcon = true }: CallHistoryExternalUserProps) => {
	const { t } = useTranslation();
	const { name } = contact;

	if (contact.uid && contact.username) {
		return <CallHistoryInternalUser contact={getMatchedContact(contact as any)} />;
	}

	return (
		<Box display='flex' flexDirection='row' alignItems='center'>
			<Box marginInlineEnd={8}>
				<FramedIcon icon='user' size={28} />
			</Box>
			{showIcon && (
				<Box marginInlineEnd={8}>
					<Icon name='phone' size={20} />
				</Box>
			)}
			<Box>{name || t('Unknown')}</Box>
		</Box>
	);
};

export default CallHistoryExternalUser;
