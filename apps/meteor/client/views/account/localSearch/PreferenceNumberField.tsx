import { Field, FieldDescription, FieldLabel, FieldRow, NumberInput } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useE2EESearchPreferences } from '../../../hooks/useE2EESearchPreferences';
import { e2eSearchIndexNamespace } from '../../../lib/e2ee/rocketchat.e2e';
import type { SearchIndexPreferences } from '../../../lib/e2eeSearch/searchIndexPreferences';
import { updateSearchIndexPreferences } from '../../../lib/e2eeSearch/searchIndexPreferences';

type NumberPreference = Exclude<keyof SearchIndexPreferences, 'rooms'>;

export const numberPreferences: { field: NumberPreference; label: string; description: string; min: number; max?: number }[] = [
	{
		field: 'backfillMonths',
		label: 'E2E_Local_Search_Backfill_Months',
		description: 'E2E_Local_Search_Backfill_Months_Description',
		min: 0,
		max: 1200,
	},
	{
		field: 'maxMessagesPerRoom',
		label: 'E2E_Local_Search_Backfill_Max_Messages_Per_Room',
		description: 'E2E_Local_Search_Backfill_Max_Messages_Per_Room_Description',
		min: 0,
	},
	{
		field: 'pageSize',
		label: 'E2E_Local_Search_Backfill_Page_Size',
		description: 'E2E_Local_Search_Backfill_Page_Size_Description',
		min: 10,
		max: 100,
	},
	{
		field: 'pauseSeconds',
		label: 'E2E_Local_Search_Backfill_Pause',
		description: 'E2E_Local_Search_Backfill_Pause_Description',
		min: 1,
	},
	{
		field: 'backoffMinSeconds',
		label: 'E2E_Local_Search_Backoff_Min',
		description: 'E2E_Local_Search_Backoff_Min_Description',
		min: 1,
	},
	{
		field: 'backoffMaxSeconds',
		label: 'E2E_Local_Search_Backoff_Max',
		description: 'E2E_Local_Search_Backoff_Max_Description',
		min: 1,
	},
];

/** One number of the preferences. The value is saved when the field loses focus, and only when it is in range. */
const PreferenceNumberField = ({ field, label, description, min, max }: (typeof numberPreferences)[number]) => {
	const { t } = useTranslation();
	const userId = useUserId();
	const id = useId();
	const descriptionId = useId();
	const saved = useE2EESearchPreferences()[field];
	const [draft, setDraft] = useState(String(saved));

	useEffect(() => setDraft(String(saved)), [saved]);

	const commit = () => {
		const value = Number(draft);
		if (!userId || draft.trim() === '' || !Number.isFinite(value) || value < min || (max !== undefined && value > max)) {
			setDraft(String(saved));
			return;
		}
		updateSearchIndexPreferences(e2eSearchIndexNamespace, userId, (current) => ({ ...current, [field]: Math.round(value) }));
	};

	return (
		<Field>
			<FieldLabel htmlFor={id}>{t(label)}</FieldLabel>
			<FieldRow>
				<NumberInput
					id={id}
					value={draft}
					min={min}
					max={max}
					aria-describedby={descriptionId}
					onChange={(event) => setDraft(event.currentTarget.value)}
					onBlur={commit}
				/>
			</FieldRow>
			<FieldDescription id={descriptionId}>{t(description)}</FieldDescription>
		</Field>
	);
};

export default PreferenceNumberField;
