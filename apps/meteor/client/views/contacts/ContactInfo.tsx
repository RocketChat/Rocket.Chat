import type { IContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Chip, Divider } from '@rocket.chat/fuselage';
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

import ContactInfoEntry from './ContactInfoEntry';
import ContactMenu from './ContactMenu';
import { useContactCall } from './hooks/useContactCall';
import { useContactLabel } from './hooks/useContactLabel';
import { getAvatarURL } from '../../../app/utils/client/getAvatarURL';

export type ContactInfoProps = {
	contact: Serialized<IContact>;
	onEdit: () => void;
	onClose: () => void;
};

const ContactInfo = ({ contact, onEdit, onClose }: ContactInfoProps) => {
	const { t } = useTranslation();
	const labelOf = useContactLabel();
	const { canCall, call } = useContactCall();
	const { _id, source, displayName, emails, phones, categories, companyName, officeLocation } = contact;

	// A labelled address says something an unlabelled one does not, so it gets its own field to say it in.
	const plainEmails = emails.filter(({ label }) => !label);
	const labelledEmails = emails.filter(({ label }) => label);

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='address-book' />
				<ContextualbarTitle>{t('Contact_info')}</ContextualbarTitle>
				<ContactMenu contact={contact} onEdit={onEdit} onDeleted={onClose} />
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelSection>
						<InfoPanelTitle title={displayName} icon={<BaseAvatar size='x32' url={getAvatarURL({ contactId: _id }) ?? ''} />} />
					</InfoPanelSection>
					<InfoPanelSection>
						{!!emails.length && <Divider />}

						{!!plainEmails.length && (
							<InfoPanelField>
								<InfoPanelLabel>{t('Email')}</InfoPanelLabel>
								{plainEmails.map(({ address }) => (
									<ContactInfoEntry
										key={address}
										text={address}
										actionIcon='mail'
										actionLabel={t('Email')}
										onAction={() => window.open(`mailto:${address}`, '_self')}
									/>
								))}
							</InfoPanelField>
						)}

						{labelledEmails.map(({ address, label }) => (
							<InfoPanelField key={address}>
								<InfoPanelLabel>{`${t('Email')} (${labelOf(label)})`}</InfoPanelLabel>
								<ContactInfoEntry
									text={address}
									actionIcon='mail'
									actionLabel={t('Email')}
									onAction={() => window.open(`mailto:${address}`, '_self')}
								/>
							</InfoPanelField>
						))}

						{!!phones.length && <Divider />}

						{phones.map(({ raw, label }) => {
							const resolved = labelOf(label);

							return (
								<InfoPanelField key={raw}>
									<InfoPanelLabel>{resolved ? `${t('Phone')} (${resolved})` : t('Phone')}</InfoPanelLabel>
									<ContactInfoEntry
										text={raw}
										actionIcon='phone'
										actionLabel={t('Call')}
										onAction={canCall ? () => call(raw) : undefined}
									/>
								</InfoPanelField>
							);
						})}

						{!!categories?.length && (
							<>
								<Divider />
								<InfoPanelField>
									<InfoPanelLabel>{t('Category')}</InfoPanelLabel>
									<Box display='flex' flexWrap='wrap' style={{ gap: 4 }}>
										{categories.map((category) => (
											<Chip key={category}>{category}</Chip>
										))}
									</Box>
								</InfoPanelField>
							</>
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

						<Divider />

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
