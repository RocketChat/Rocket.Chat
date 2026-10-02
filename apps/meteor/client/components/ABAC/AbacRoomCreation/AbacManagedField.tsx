import { Field, FieldHint, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AbacRoomCreation } from './useAbacRoomCreation';

type AbacManagedFieldProps = {
	abac: AbacRoomCreation;
	canCreatePrivate: boolean;
};

const getHintKey = ({ enforced, canCreateManaged }: AbacRoomCreation, canCreatePrivate: boolean): TranslationKey => {
	if (!canCreateManaged) {
		return 'ABAC_Managed_Not_Allowed_Hint';
	}

	if (!canCreatePrivate) {
		return 'ABAC_Managed_Private_Only_Hint';
	}

	if (enforced) {
		return 'ABAC_Managed_Enforced_Hint';
	}

	return 'ABAC_Managed_Hint';
};

const AbacManagedField = ({ abac, canCreatePrivate }: AbacManagedFieldProps) => {
	const { t } = useTranslation();
	const { control } = useFormContext<{ isAbacManaged: boolean }>();

	return (
		<Field>
			<FieldRow>
				<FieldLabel>{t('ABAC_Managed')}</FieldLabel>
				<Controller
					control={control}
					name='isAbacManaged'
					render={({ field: { value, ...field } }) => (
						<ToggleSwitch {...field} checked={value} disabled={abac.enforced || !abac.canCreateManaged || !canCreatePrivate} />
					)}
				/>
			</FieldRow>
			<FieldHint>{t(getHintKey(abac, canCreatePrivate))}</FieldHint>
		</Field>
	);
};

export default AbacManagedField;
