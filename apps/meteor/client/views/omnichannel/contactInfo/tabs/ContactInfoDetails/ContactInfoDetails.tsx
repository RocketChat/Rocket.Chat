import type { ILivechatContact } from '@rocket.chat/core-typings';
import { Divider, Margins } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import ContactInfoDetailsEntry from './ContactInfoDetailsEntry';
import ContactInfoPhoneEntry from './ContactInfoPhoneEntry';
import ContactManagerInfo from './ContactManagerInfo';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import CustomField from '../../../components/CustomField';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';

type ContactInfoDetailsProps = {
	contact: Pick<ILivechatContact, '_id' | 'unknown'>;
	emails?: string[];
	phones?: string[];
	createdAt: string;
	customFieldEntries: [string, string | unknown][];
	contactManager?: string;
};

const ContactInfoDetails = ({ contact, emails, phones, createdAt, customFieldEntries, contactManager }: ContactInfoDetailsProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<ContextualbarScrollableContent>
			{emails?.length ? (
				<Field>
					<Label id={`${contact._id}-emails`}>{t('Email')}</Label>
					<ul aria-labelledby={`${contact._id}-emails`}>
						{emails.map((email) => (
							<ContactInfoDetailsEntry key={email} is='li' icon='mail' value={email} />
						))}
					</ul>
				</Field>
			) : null}

			{phones?.length ? (
				<Field>
					<Label id={`${contact._id}-phones`}>{t('Phone')}</Label>
					<ul aria-labelledby={`${contact._id}-phones`}>
						{phones.map((phone) => (
							<ContactInfoPhoneEntry key={phone} is='li' contact={contact} value={phone} />
						))}
					</ul>
				</Field>
			) : null}

			{contactManager ? <ContactManagerInfo userId={contactManager} /> : null}

			<Margins block={4}>
				{createdAt && (
					<Field>
						<Label id={`${contact._id}-created-at`}>{t('Created_at')}</Label>
						<Info aria-labelledby={`${contact._id}-created-at`}>{formatDate(createdAt)}</Info>
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
