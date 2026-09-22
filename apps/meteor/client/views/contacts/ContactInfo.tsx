import type { IContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Chip } from '@rocket.chat/fuselage';
import { BaseAvatar } from '@rocket.chat/ui-avatar';
import {
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarScrollableContent,
	ContextualbarTitle,
	InfoPanel,
	InfoPanelField,
	InfoPanelLabel,
	InfoPanelSection,
	InfoPanelText,
	InfoPanelTitle,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import ContactMenu from './ContactMenu';
import { getAvatarURL } from '../../../app/utils/client/getAvatarURL';

export type ContactInfoProps = {
	contact: Serialized<IContact>;
	onClose: () => void;
};

const PHONE_LABELS: Record<string, string> = {
	mobile: 'Mobile_phone',
	business: 'Business_phone',
	home: 'Home_phone',
};

const ContactInfo = ({ contact, onClose }: ContactInfoProps) => {
	const { t } = useTranslation();
	const { _id, source, displayName, emails, phones, categories, companyName, officeLocation } = contact;

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='address-book' />
				<ContextualbarTitle>{t('Contact_info')}</ContextualbarTitle>
				<ContactMenu contact={contact} onDeleted={onClose} />
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelSection>
						<InfoPanelTitle title={displayName} icon={<BaseAvatar size='x32' url={getAvatarURL({ contactId: _id }) ?? ''} />} />
					</InfoPanelSection>
					<InfoPanelSection>
						{/* One field per address, unlabelled: Graph v1.0 does not say which one is work or personal. */}
						{emails.map(({ address }) => (
							<InfoPanelField key={address}>
								<InfoPanelLabel>{t('Email')}</InfoPanelLabel>
								<InfoPanelText>{address}</InfoPanelText>
							</InfoPanelField>
						))}

						{phones.map(({ raw, label }) => (
							<InfoPanelField key={raw}>
								<InfoPanelLabel>{t(label && PHONE_LABELS[label] ? PHONE_LABELS[label] : 'Phone')}</InfoPanelLabel>
								<InfoPanelText>{raw}</InfoPanelText>
							</InfoPanelField>
						))}

						{!!categories?.length && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Category')}</InfoPanelLabel>
								<Box display='flex' flexWrap='wrap' style={{ gap: 4 }}>
									{categories.map((category) => (
										<Chip key={category}>{category}</Chip>
									))}
								</Box>
							</InfoPanelField>
						)}

						{companyName && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Company')}</InfoPanelLabel>
								<InfoPanelText>{companyName}</InfoPanelText>
							</InfoPanelField>
						)}

						{officeLocation && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Office_location')}</InfoPanelLabel>
								<InfoPanelText>{officeLocation}</InfoPanelText>
							</InfoPanelField>
						)}

						<InfoPanelField>
							<InfoPanelLabel>{t('Source')}</InfoPanelLabel>
							<InfoPanelText>{source === 'local' ? 'Rocket.Chat' : 'Outlook'}</InfoPanelText>
						</InfoPanelField>
					</InfoPanelSection>
				</InfoPanel>
			</ContextualbarScrollableContent>
		</ContextualbarDialog>
	);
};

export default ContactInfo;
