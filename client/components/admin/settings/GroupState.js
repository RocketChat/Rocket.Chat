import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { AssetsGroupPage } from './groups/AssetsGroupPage';
import { OAuthGroupPage } from './groups/OAuthGroupPage';
import { GenericGroupPage } from './groups/GenericGroupPage';
import { useSettingsState } from './SettingsState';

const GroupContext = createContext({});

export function GroupState({ groupId }) {
	const { state, save, cancel } = useSettingsState();

	const group = state.find(({ _id, type }) => _id === groupId && type === 'group');
	const settings = state.filter(({ group }) => group === groupId);
	const changed = settings.some(({ changed }) => changed);
	const sections = Array.from(new Set(settings.map(({ section }) => section || '')));

	const saveRef = useRef(save);
	const cancelRef = useRef(cancel);
	const settingsRef = useRef(settings);
	saveRef.current = save;
	cancelRef.current = cancel;
	settingsRef.current = settings;

	const saveGroup = useCallback(() => {
		const { current: save } = saveRef;
		const { current: fields } = settingsRef;
		save({ fields });
	}, []);

	const cancelGroup = useCallback(() => {
		const { current: cancel } = cancelRef;
		const { current: fields } = settingsRef;
		cancel({ fields });
	}, []);

	const contextValue = useMemo(() => ({
		...group,
		changed,
		sections,
		save: saveGroup,
		cancel: cancelGroup,
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
