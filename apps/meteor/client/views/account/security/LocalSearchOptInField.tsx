import { Field, FieldDescription, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage';
import type { ChangeEventHandler } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export type LocalSearchOptInFieldProps = {
	checked: boolean;
	onChange: ChangeEventHandler<HTMLInputElement>;
};

const LocalSearchOptInField = ({ checked, onChange }: LocalSearchOptInFieldProps) => {
	const { t } = useTranslation();
	const toggleId = useId();
	const descriptionId = useId();

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={toggleId}>{t('E2E_Local_Search_Opt_In')}</FieldLabel>
				<ToggleSwitch id={toggleId} checked={checked} onChange={onChange} aria-describedby={descriptionId} />
			</FieldRow>
			<FieldDescription id={descriptionId}>{t('E2E_Local_Search_Opt_In_Description')}</FieldDescription>
		</Field>
	);
};

export default LocalSearchOptInField;
