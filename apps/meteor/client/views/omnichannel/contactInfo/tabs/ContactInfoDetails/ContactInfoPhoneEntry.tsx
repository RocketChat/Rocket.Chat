import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import ContactInfoCallButton from './ContactInfoCallButton';
import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';
import ContactInfoOutboundMessageButton from './ContactInfoOutboundMessageButton';
import { useIsCallReady } from '../../../../../contexts/CallContext';
import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';

type ContactInfoPhoneEntryProps = Omit<ComponentProps<typeof ContactInfoDetailsEntry>, 'icon' | 'actions'> & {
	contactId?: string;
};

const ContactInfoPhoneEntry = ({ contactId, value, ...props }: ContactInfoPhoneEntryProps) => {
	const { t } = useTranslation();
	const isCallReady = useIsCallReady();
	const { copy } = useClipboardWithToast(value);

	return (
		<ContactInfoDetailsEntry
			{...props}
			icon='phone'
			value={parseOutboundPhoneNumber(value)}
			actions={[
				<IconButton key={`${value}-copy`} onClick={() => copy()} tiny icon='copy' title={t('Copy')} />,
				isCallReady ? <ContactInfoCallButton phoneNumber={value} /> : null,
				<ContactInfoOutboundMessageButton key={`${value}-outbound-message`} defaultValues={{ contactId, recipient: value }} />,
			]}
		/>
	);
};

export default ContactInfoPhoneEntry;
