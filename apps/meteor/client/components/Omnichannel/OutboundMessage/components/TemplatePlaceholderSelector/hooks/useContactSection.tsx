import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type UseContactSectionProps = {
	contact?: Serialized<ILivechatContact>;
	onSelect(value: string): void;
};

export const useContactSection = ({ contact, onSelect }: UseContactSectionProps) => {
	const { t } = useTranslation();

	return useMemo(() => {
		if (!contact) {
			return [{ title: t('Contact'), items: [{ id: 'no-contact-data', content: t('No_data_found') }] }];
		}

		const renderItem = (label: string, value: string, index?: number) => (
			<p>
				{index ? `${label} (${index})` : label} <span>{value}</span>
			</p>
		);

		const nameItem = {
			id: `${contact._id}.name`,
			content: renderItem(t('Name'), contact.name),
			onClick: () => onSelect(contact.name || contact._id),
		};

		const phones =
			contact.phones?.map((item, index) => ({
				id: `${contact._id}.phone.${index}`,
				content: renderItem(t('Phone_number'), item.phoneNumber, index + 1),
				onClick: () => onSelect(item.phoneNumber),
			})) || [];

		const emails =
			contact.emails?.map((item, index) => ({
				id: `${contact._id}.email.${index}`,
				content: renderItem(t('Email'), item.address, index + 1),
				onClick: () => onSelect(item.address),
			})) || [];

		return [{ title: t('Contact'), items: [nameItem, ...phones, ...emails] }];
	}, [contact, onSelect, t]);
};
