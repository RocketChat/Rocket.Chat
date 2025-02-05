import { NumberInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ComponentProps } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const MaxChatsPerAgent = ({ className }: { className?: ComponentProps<typeof Field>['className'] }) => {
	const { t } = useTranslation();
	const { control } = useFormContext();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const maxChatsField = useId();

	if (!hasLicense) {
		return null;
	}

	return (
		<Field className={className}>
			<FieldLabel htmlFor={maxChatsField}>{t('Max_number_of_chats_per_agent')}</FieldLabel>
			<FieldRow>
				<Controller
					name='maxNumberSimultaneousChat'
					control={control}
					render={({ field }) => <NumberInput id={maxChatsField} {...field} />}
				/>
			</FieldRow>
		</Field>
	);
};

export default MaxChatsPerAgent;
