import React, { createContext, useMemo, useContext, useRef, useCallback } from 'react';

import { useSettingsState } from './SettingsState';
import { useGroup } from './GroupState';

const SectionContext = createContext({});

export function SectionState({ children, section: name }) {
	const { state, reset } = useSettingsState();
	const { _id: groupId } = useGroup();

	name = name || '';

	const settings = state.filter(({ group, section }) => group === groupId
		&& ((!name && !section) || (name === section)));
	const changed = settings.some(({ changed }) => changed);
	const canReset = settings.some(({ value, packageValue }) => value !== packageValue);
	const settingsIds = settings.map(({ _id }) => _id);

	const resetRef = useRef(reset);
	const settingsRef = useRef(settings);
	resetRef.current = reset;
	settingsRef.current = settings;

	const resetSection = useCallback(() => {
		const { current: reset } = resetRef;
		const { current: fields } = settingsRef;
		reset({ fields });
	}, []);

	const contextValue = useMemo(() => ({
		name,
		changed,
		canReset,
		settings: settingsIds,
		reset: resetSection,
	}), [groupId, changed, canReset, settingsIds.join(',')]);

	return <SectionContext.Provider children={children} value={contextValue} />;
}

export const useSection = () => useContext(SectionContext);
