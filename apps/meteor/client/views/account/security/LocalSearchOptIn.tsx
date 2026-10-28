import { Field, FieldDescription, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useCallback, useId, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import EndToEndSettingsSection from './layout/EndToEndSettingsSection';
import { getSearchIndexBackend } from '../../../lib/e2eeSearch/getSearchIndexBackend';
import { isSearchIndexOptedIn, setSearchIndexOptIn, subscribeToSearchIndexOptIn } from '../../../lib/e2eeSearch/searchIndexOptIn';

/**
 * The user's opt-in to the local search of encrypted messages on this device. It shows only when the workspace admin
 * allows local search and the app has a local index (the desktop app). Turning it off wipes the index at once.
 */
const LocalSearchOptIn = () => {
	const { t } = useTranslation();
	const userId = useUserId() ?? undefined;
	const adminAllows = useSetting('E2E_Enable_Local_Search', false);
	const toggleId = useId();
	const descriptionId = useId();

	const optedIn = useSyncExternalStore(subscribeToSearchIndexOptIn, () => isSearchIndexOptedIn(userId));

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			if (!userId) return;
			setSearchIndexOptIn(userId, event.currentTarget.checked);
		},
		[userId],
	);

	if (!adminAllows || !userId || !getSearchIndexBackend()) {
		return null;
	}

	return (
		<EndToEndSettingsSection>
			<Field>
				<FieldRow>
					<FieldLabel htmlFor={toggleId}>{t('E2E_Local_Search_Opt_In')}</FieldLabel>
					<ToggleSwitch id={toggleId} checked={optedIn} onChange={handleChange} aria-describedby={descriptionId} />
				</FieldRow>
				<FieldDescription id={descriptionId}>{t('E2E_Local_Search_Opt_In_Description')}</FieldDescription>
			</Field>
		</EndToEndSettingsSection>
	);
};

export default LocalSearchOptIn;
