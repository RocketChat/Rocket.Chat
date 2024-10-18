import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useIsCallReady } from '../../../../../contexts/CallContext';
import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';
import ContactInfoCallButton from './ContactInfoCallButton';

type ContactInfoDetailsEntryProps = {
	type: 'phone' | 'email';
	label: string;
	value: string;
};

const ContactInfoDetailsEntry = ({ type, value }: ContactInfoDetailsEntryProps) => {
	const t = useTranslation();
	const { copy } = useClipboardWithToast(value);

	const isCallReady = useIsCallReady();

	return (
		<Box display='flex' alignItems='center'>
			<Icon size='x18' name={type === 'phone' ? 'phone' : 'mail'} />
			<Box withTruncatedText display='flex' flexGrow={1} alignItems='center' justifyContent='space-between'>
				<Box withTruncatedText data-qa-id={type === 'phone' ? 'contactInfo-phone' : 'contactInfo-email'} mi={4} fontScale='p2'>
					{type === 'phone' ? parseOutboundPhoneNumber(value) : value}
				</Box>
				<Box display='flex' alignItems='center'>
					{isCallReady && type === 'phone' && <ContactInfoCallButton phoneNumber={value} />}
					<IconButton onClick={() => copy()} tiny title={t('Copy')} icon='copy' />
				</Box>
			</Box>
		</Box>
	);
};

export default ContactInfoDetailsEntry;
