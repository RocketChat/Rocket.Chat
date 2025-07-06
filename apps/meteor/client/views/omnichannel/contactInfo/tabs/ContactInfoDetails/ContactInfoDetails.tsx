import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
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
import ContactInfoChannels from '../ContactInfoChannels';

type ContactInfoDetailsProps = {
	channels: Serialized<ILivechatContactChannel>[];
	contactId: string;
	emails?: string[];
	phones?: string[];
	createdAt: string;
	customFieldEntries: [string, string | unknown][];
	contactManager?: string;
};

const ContactInfoDetails = ({
	contactId,
	channels,
	emails,
	phones,
	createdAt,
	customFieldEntries,
	contactManager,
}: ContactInfoDetailsProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<ContextualbarScrollableContent>
			{emails?.length ? (
				<Field>
					<Label is='span'>{t('Email')}</Label>
					{emails.map((email, index) => (
						<ContactInfoDetailsEntry key={index} icon='mail' value={email} />
					))}
				</Field>
			) : null}

			{phones?.length ? (
				<Field>
					<Label is='span'>{t('Phone')}</Label>
					{phones.map((phone, index) => (
						<ContactInfoPhoneEntry key={index} contactId={contactId} value={phone} />
					))}
				</Field>
			) : null}

			{contactManager && <ContactManagerInfo userId={contactManager} />}

			<Margins block={4}>
				{createdAt && (
					<Field>
						<Label>{t('Created_at')}</Label>
						<Info>{formatDate(createdAt)}</Info>
					</Field>
				)}
				{customFieldEntries.length > 0 && (
					<>
						<Divider mi={-24} />
						{customFieldEntries?.map(([key, value]) => <CustomField key={key} id={key} value={value as string} />)}
					</>
				)}
			</Margins>

			{channels.length ? <ContactInfoChannels channels={channels} /> : null}
		</ContextualbarScrollableContent>
	);
};

export default ContactInfoDetails;
