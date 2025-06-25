import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
import { Divider, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ContactInfoDetailsGroup from './ContactInfoDetailsGroup';
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
	emails?: string[];
	phones?: string[];
	createdAt: string;
	customFieldEntries: [string, string | unknown][];
	contactManager?: string;
};

const ContactInfoDetails = ({ channels, emails, phones, createdAt, customFieldEntries, contactManager }: ContactInfoDetailsProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<ContextualbarScrollableContent>
			{emails?.length ? <ContactInfoDetailsGroup type='email' label={t('Email')} values={emails} /> : null}
			{phones?.length ? <ContactInfoDetailsGroup type='phone' label={t('Phone_number')} values={phones} /> : null}
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
