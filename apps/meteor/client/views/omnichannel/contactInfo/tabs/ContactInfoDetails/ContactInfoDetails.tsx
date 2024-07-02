import { Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarScrollableContent } from '../../../../../components/Contextualbar';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';
import ContactManagerInfo from '../../../../../omnichannel/ContactManagerInfo';
// import AgentInfoDetails from '../../components/AgentInfoDetails';
import CustomField from '../../../components/CustomField';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
// import { VoipInfoCallButton } from '../../directory/calls/contextualBar/VoipInfoCallButton';
import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';

const ContactInfoDetails = ({ email, phoneNumber, ts, customFieldEntries, contactManager }) => {
	const t = useTranslation();
	const formatDate = useFormatDate();

	return (
		<ContextualbarScrollableContent>
			{email && <ContactInfoDetailsEntry type='email' label={t('Email')} value={email} />}
			{phoneNumber && <ContactInfoDetailsEntry type='phone' label={t('Phone')} value={parseOutboundPhoneNumber(phoneNumber)} />}

			<Margins block={4}>
				{ts && (
					<Field>
						<Label>{t('Created_at')}</Label>
						<Info>{formatDate(ts)}</Info>
					</Field>
				)}

				{customFieldEntries?.map(([key, value]) => {
					return <CustomField key={key} id={key} value={value} />;
				})}

				{contactManager && (
					<Field>
						<Label>{t('Contact_Manager')}</Label>
						<ContactManagerInfo username={contactManager.username} />
					</Field>
				)}
			</Margins>
		</ContextualbarScrollableContent>
	);
};

export default ContactInfoDetails;
