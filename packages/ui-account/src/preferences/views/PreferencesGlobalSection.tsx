import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, MultiSelect } from '@rocket.chat/fuselage-forms';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { DontAskAgainItem } from '../logic/preferencesPayload';

export type PreferencesGlobalSectionProps = {
	dontAskAgainItems: DontAskAgainItem[];
};

const PreferencesGlobalSection = ({ dontAskAgainItems }: PreferencesGlobalSectionProps) => {
	const { t } = useTranslation();

	const options: SelectOption[] = dontAskAgainItems.map(({ action, label }) => [action, label]);

	const { control } = useFormContext();

	return (
		<AccordionItem title={t('Global')}>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Dont_ask_me_again_list')}</FieldLabel>
					<FieldRow>
						<Controller
							name='dontAskAgainList'
							control={control}
							render={({ field: { value, onChange } }) => (
								<MultiSelect placeholder={t('Nothing_found')} value={value} onChange={onChange} options={options} />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesGlobalSection;
