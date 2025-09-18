import { Divider, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';
import ContactInfoPhoneEntry from './ContactInfoPhoneEntry';
import ContactManagerInfo from './ContactManagerInfo';
import { ContextualbarScrollableContent } from '../../../../../components/Contextualbar';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import CustomField from '../../../components/CustomField';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';

type ContactInfoDetailsProps = {
	contactId: string;
	emails?: string[];
	phones?: string[];
	createdAt: string;
	customFieldEntries: [string, string | unknown][];
	contactManager?: string;
};

const ContactInfoDetails = ({ contactId, emails, phones, createdAt, customFieldEntries, contactManager }: ContactInfoDetailsProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<ContextualbarScrollableContent>
			{emails?.length ? (
				<Field>
					<Label id={`${contactId}-emails`}>{t('Email')}</Label>
					<ul aria-labelledby={`${contactId}-emails`}>
						{emails.map((email) => (
							<ContactInfoDetailsEntry key={email} is='li' icon='mail' value={email} />
						))}
					</ul>
				</Field>
			) : null}

			{phones?.length ? (
				<Field>
					<Label id={`${contactId}-phones`}>{t('Phone')}</Label>
					<ul aria-labelledby={`${contactId}-phones`}>
						{phones.map((phone) => (
							<ContactInfoPhoneEntry key={phone} is='li' contactId={contactId} value={phone} />
						))}
					</ul>
				</Field>
			) : null}

			{contactManager ? <ContactManagerInfo userId={contactManager} /> : null}

			<Margins block={4}>
				{createdAt && (
					<Field>
						<Label id={`${contactId}-created-at`}>{t('Created_at')}</Label>
						<Info aria-labelledby={`${contactId}-created-at`}>{formatDate(createdAt)}</Info>
					</Field>
				)}

				{customFieldEntries.length > 0 && (
					<>
						<Divider mi={-24} />
						{customFieldEntries?.map(([key, value]) => <CustomField key={key} id={key} value={value as string} />)}
					</>
				)}
			</Margins>
		</ContextualbarScrollableContent>
	);
};

export default ContactInfoDetails;
