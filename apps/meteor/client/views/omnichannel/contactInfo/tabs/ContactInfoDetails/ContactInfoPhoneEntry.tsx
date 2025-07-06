import ContactInfoCallButton from './ContactInfoCallButton';
import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';
import ContactInfoOutboundMessageButton from './ContactInfoOutboundMessageButton';
import { useIsCallReady } from '../../../../../contexts/CallContext';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';

type ContactInfoPhoneEntryProps = {
	contactId?: string;
	value: string;
};

const ContactInfoPhoneEntry = ({ contactId, value }: ContactInfoPhoneEntryProps) => {
	const isCallReady = useIsCallReady();

	return (
		<ContactInfoDetailsEntry
			icon='phone'
			value={parseOutboundPhoneNumber(value)}
			actions={[
				isCallReady ? <ContactInfoCallButton phoneNumber={value} /> : null,
				<ContactInfoOutboundMessageButton key={`${value}-outbound-message`} defaultValues={{ contactId, recipient: value }} />,
			]}
		/>
	);
};

export default ContactInfoPhoneEntry;
