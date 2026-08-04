import type { SelectOption } from '@rocket.chat/fuselage';
import { Select } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

export type SeverityFilterSelectProps = Omit<ComponentProps<typeof Select>, 'options'>;

export const SeverityFilterSelect = ({ ...props }: SeverityFilterSelectProps) => {
	const { t } = useTranslation();

	const options = [
		['all', t('All')],
		['0', t('Warning')],
		['1', t('Info')],
		['2', t('Debug')],
	] as SelectOption[];
	return <Select {...props} aria-label={t('Severity')} options={options} />;
};
