import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type UseCustomFieldsSectionProps = {
	customFields?: Record<string, unknown>;
	onSelect(value: string): void;
};

export const useCustomFieldsSection = ({ customFields, onSelect }: UseCustomFieldsSectionProps) => {
	const { t } = useTranslation();

	return useMemo(() => {
		const entries = customFields ? Object.entries(customFields) : [];

		if (!entries.length) {
			return [{ title: t('Custom_fields'), items: [{ id: 'no-custom-fields-data', content: t('No_data_found') }] }];
		}

		const items = entries.map(([label, value]) => ({
			id: label,
			onClick: () => onSelect(String(value)),
			content: (
				<p>
					<Box is='span' fontScale='p2m'>
						{label}
					</Box>{' '}
					<Box is='span' fontScale='p2'>
						{String(value)}
					</Box>
				</p>
			),
		}));

		return [{ title: t('Custom_fields'), items }];
	}, [customFields, onSelect, t]);
};
