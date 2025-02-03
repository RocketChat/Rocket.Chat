import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem, Field, FieldGroup, FieldLabel, FieldRow, MultiSelect } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesGlobalSection = () => {
	const { t } = useTranslation();

	const userDontAskAgainList = useUserPreference<{ action: string; label: string }[]>('dontAskAgainList') || [];
	const options: SelectOption[] = userDontAskAgainList.map(({ action, label }) => [action, label]);

	const { control } = useFormContext();
	const dontAskAgainListId = useId();

	return (
		<AccordionItem title={t('Global')}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={dontAskAgainListId}>{t('Dont_ask_me_again_list')}</FieldLabel>
					<FieldRow>
						<Controller
							name='dontAskAgainList'
							control={control}
							render={({ field: { value, onChange } }) => (
								<MultiSelect id={dontAskAgainListId} placeholder={t('Nothing_found')} value={value} onChange={onChange} options={options} />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesGlobalSection;
