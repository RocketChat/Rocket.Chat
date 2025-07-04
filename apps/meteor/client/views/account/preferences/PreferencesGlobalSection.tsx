import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, Select, FieldDescription, FieldLabelInfo } from '@rocket.chat/fuselage-forms';
import { AccordionItem } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
// import { useId } from 'react';

const PreferencesGlobalSection = () => {
	const { t } = useTranslation();

	// const multiSelectId = useId();

	const userDontAskAgainList = useUserPreference<{ action: string; label: string }[]>('dontAskAgainList') || [];
	const options: SelectOption[] = userDontAskAgainList.map(({ action, label }) => [action, label]);

	const { control } = useFormContext();

	return (
		<AccordionItem title={t('Global')}>
			<FieldGroup>
				<legend hidden>{t('Global')}</legend>
				<Field>
					<FieldLabel required>{t('Dont_ask_me_again_list')}</FieldLabel>
					<FieldLabelInfo title='with extra info in a tooltip' />
					<FieldDescription>You can use this field to enter multi-line text</FieldDescription>
					<FieldRow>
						<Controller
							name='dontAskAgainList'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select placeholder={t('Nothing_found')} value={value} onChange={onChange} options={options} />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesGlobalSection;
