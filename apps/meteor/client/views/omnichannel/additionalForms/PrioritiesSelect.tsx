import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type PrioritiesSelectProps = {
	value: string;
	label: string;
	options: Serialized<ILivechatPriority[]>;
	onChange: (value: string) => void;
};

export const PrioritiesSelect = ({ value = '', label, options, onChange }: PrioritiesSelectProps) => {
	const { t } = useTranslation();
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	const formattedOptions = useMemo<SelectOption[]>(
		() => [
			['', t('Unprioritized')],
			...(options || []).map(({ dirty, name, i18n, _id }) => [_id, dirty && name ? name : t(i18n as TranslationKey)] as SelectOption),
		],
		[options, t],
	);

	const fieldId = useId();

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel id={fieldId}>{label}</FieldLabel>
			<FieldRow>
				<Select aria-labelledby={fieldId} value={value} options={formattedOptions} onChange={(value) => onChange(String(value))} />
			</FieldRow>
		</Field>
	);
};

export default PrioritiesSelect;
