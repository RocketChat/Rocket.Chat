import { useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatPhoneNumber } from '../../../../../../lib/formatPhoneNumber';

type UseAgentSectionProps = {
	onSelect(value: string): void;
};

export const useAgentSection = ({ onSelect }: UseAgentSectionProps) => {
	const { t } = useTranslation();
	const user = useUser();

	return useMemo(() => {
		if (!user) {
			return [{ title: t('Agent'), items: [{ id: 'no-contact-data', content: t('No_data_found') }] }];
		}

		const renderItem = (label: string, value: string, index?: number) => (
			<p>
				{index ? `${label} (${index})` : label} <span>{value}</span>
			</p>
		);

		const nameItem = {
			id: `${user._id}.name`,
			content: renderItem(t('Name'), user.name || user.username || t('Unnamed')),
			onClick: () => onSelect(user.name || user._id),
		};

		const phoneItem = {
			id: `${user._id}.phone`,
			content: renderItem(t('Phone_number'), user.phone ? formatPhoneNumber(user.phone) : t('None')),
			onClick: () => onSelect(user.phone || ''),
		};

		const emails =
			user.emails?.map((item, index) => ({
				id: `${user._id}.email.${index}`,
				content: renderItem(t('Email'), item.address, index + 1),
				onClick: () => onSelect(item.address),
			})) || [];

		return [{ title: t('Agent'), items: [nameItem, phoneItem, ...emails] }];
	}, [user, onSelect, t]);
};
