import type { ILivechatContact } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';
import ContactInfoOutboundMessageButton from './ContactInfoOutboundMessageButton';
import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';

type ContactInfoPhoneEntryProps = Omit<ComponentProps<typeof ContactInfoDetailsEntry>, 'icon' | 'actions'> & {
	contact?: Pick<ILivechatContact, '_id' | 'unknown'>;
};

const ContactInfoPhoneEntry = ({ contact, value, ...props }: ContactInfoPhoneEntryProps) => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(value);

	return (
		<ContactInfoDetailsEntry
			{...props}
			icon='phone'
			value={parseOutboundPhoneNumber(value)}
			actions={[
				<IconButton key={`${value}-copy`} onClick={() => copy()} tiny icon='copy' title={t('Copy')} />,
				null,
				<ContactInfoOutboundMessageButton
					key={`${value}-outbound-message`}
					title={contact?.unknown ? t('error-unknown-contact') : undefined}
					disabled={contact?.unknown}
					defaultValues={{ contactId: contact?._id, recipient: value }}
				/>,
			]}
		/>
	);
};

export default ContactInfoPhoneEntry;
