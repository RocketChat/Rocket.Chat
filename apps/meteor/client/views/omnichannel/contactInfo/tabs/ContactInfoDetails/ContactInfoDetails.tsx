import { Divider, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarScrollableContent } from '../../../../../components/Contextualbar';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';
import CustomField from '../../../components/CustomField';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';
import ContactManagerInfo from './ContactManagerInfo';

type ContactInfoDetailsProps = {
	email: string;
	phoneNumber: string;
	ts: string;
	customFieldEntries: [string, string][];
	contactManager?: {
		username: string;
	};
};

const ContactInfoDetails = ({ email, phoneNumber, ts, customFieldEntries, contactManager }: ContactInfoDetailsProps) => {
	const t = useTranslation();
	const formatDate = useFormatDate();

	return (
		<ContextualbarScrollableContent>
			{email && <ContactInfoDetailsEntry type='email' label={t('Email')} value={email} />}
			{phoneNumber && <ContactInfoDetailsEntry type='phone' label={t('Phone')} value={parseOutboundPhoneNumber(phoneNumber)} />}
			{contactManager && <ContactManagerInfo username={contactManager.username} />}
			<Margins block={4}>
				{ts && (
					<Field>
						<Label>{t('Created_at')}</Label>
						<Info>{formatDate(ts)}</Info>
					</Field>
				)}
				{customFieldEntries.length > 0 && <Divider mi={-24} />}
				{customFieldEntries?.map(([key, value]) => (
					<CustomField key={key} id={key} value={value} />
				))}
			</Margins>
		</ContextualbarScrollableContent>
	);
};

export default ContactInfoDetails;
