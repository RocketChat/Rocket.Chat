import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client/lib/handleError';
import { useBatchSetSettings } from '../../../hooks/useBatchSetSettings';
import { AssetsGroupPage } from './groups/AssetsGroupPage';
import { OAuthGroupPage } from './groups/OAuthGroupPage';
import { GenericGroupPage } from './groups/GenericGroupPage';
import { useSettingsState } from './SettingsState';

const GroupContext = createContext({});

export function GroupState({ groupId }) {
	const { state, persistedState, hydrate } = useSettingsState();

	const group = state.find(({ _id, type }) => _id === groupId && type === 'group');
	const settings = state.filter(({ group }) => group === groupId);
	const changed = settings.some(({ changed }) => changed);
	const sections = Array.from(new Set(settings.map(({ section }) => section || '')));

	const batchSetSettings = useBatchSetSettings();

	const settingsRef = useRef();
	const persistedStateRef = useRef();
	const hydrateRef = useRef();

	useEffect(() => {
		settingsRef.current = settings;
		persistedStateRef.current = persistedState;
		hydrateRef.current = hydrate;
	});

	const save = useCallback(async () => {
		const { current: settings } = settingsRef;

		const changes = settings.filter(({ changed }) => changed)
			.map(({ _id, value, editor }) => ({ _id, value, editor }));

		if (changes.length === 0) {
			return;
		}

		try {
			await batchSetSettings(changes);

			if (changes.some(({ _id }) => _id === 'Language')) {
				const lng = Meteor.user().language
					|| changes.filter(({ _id }) => _id === 'Language').shift().value
					|| 'en';

				TAPi18n._loadLanguage(lng)
					.then(() => toastr.success(TAPi18n.__('Settings_updated', { lng })))
					.catch(handleError);

				return;
			}

			toastr.success(TAPi18n.__('Settings_updated'));
		} catch (error) {
			handleError(error);
		}
	}, []);

	const cancel = useCallback(() => {
		const { current: settings } = settingsRef;
		const { current: persistedState } = persistedStateRef;

		const changes = settings.filter(({ changed }) => changed)
			.map((field) => {
				const { _id, value, editor } = persistedState.find(({ _id }) => _id === field._id);
				return { _id, value, editor, changed: false };
			});

		hydrate(changes);
	}, []);

	const contextValue = useMemo(() => ({
		...group,
		changed,
		sections,
		save,
		cancel,
	}), [group, changed, sections.join(',')]);

	const children = useMemo(() => {
		if (!group) {
			return null;
		}

		return (group._id === 'Assets' && <AssetsGroupPage />)
			|| (group._id === 'OAuth' && <OAuthGroupPage />)
			|| <GenericGroupPage />;
	}, [group]);

	if (!group) {
		return null;
	}

	return <GroupContext.Provider children={children} value={contextValue} />;
}

export const useGroup = () => useContext(GroupContext);
