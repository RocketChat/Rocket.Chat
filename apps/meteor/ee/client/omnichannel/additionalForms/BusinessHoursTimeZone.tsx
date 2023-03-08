import type { SelectOption } from '@rocket.chat/fuselage';
import { SelectFiltered, Field } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { useForm } from '../../../../client/hooks/useForm';
import { useTimezoneNameList } from '../../../../client/hooks/useTimezoneNameList';

type Props = {
	onChange: (val: any) => void;
	data: string;
	className?: string;
	hasChanges: (_val: any) => void;
};

const getInitialData = (data: string | undefined = undefined) => ({
	name: data ?? '',
});

const BusinessHoursTimeZone = ({ onChange, data, className, hasChanges = (_val) => undefined }: Props) => {
	const t = useTranslation();

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialData(data));

	const { name } = values as { name: string };
	const { handleName } = handlers;

	const timeZones = useTimezoneNameList();

	const timeZonesOptions = useMemo<SelectOption[]>(() => timeZones.map((name) => [name, t(name as TranslationKey)]), [t, timeZones]);

	onChange?.({ name });
	hasChanges(hasUnsavedChanges);

	return (
		<Field className={className}>
			<Field.Label>{t('Timezone')}</Field.Label>
			<Field.Row>
				<SelectFiltered options={timeZonesOptions} value={name} onChange={handleName} />
			</Field.Row>
		</Field>
	);
};

export default BusinessHoursTimeZone;
