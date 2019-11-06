import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { useSettingsState } from './SettingsState';

const SectionContext = createContext({});

export function SectionState({ children, group, section: name }) {
	const { state, persistedState, hydrate } = useSettingsState();
	const { _id: groupId } = group;

	name = name || '';

	const settings = state.filter(({ group, section }) => group === groupId
		&& ((!name && !section) || (name === section)));
	const changed = settings.some(({ changed }) => changed);
	const canReset = settings.some(({ value, packageValue }) => value !== packageValue);
	const settingsIds = settings.map(({ _id }) => _id);

	const settingsRef = useRef();
	const persistedStateRef = useRef();

	useEffect(() => {
		settingsRef.current = settings;
		persistedStateRef.current = persistedState;
	});

	const reset = useCallback(() => {
		const { current: settings } = settingsRef;
		const { current: persistedState } = persistedStateRef;

		const changes = settings.map((setting) => {
			const { _id, value, packageValue, editor } = persistedState.find(({ _id }) => _id === setting._id);
			return {
				_id,
				value: packageValue,
				editor,
				changed: packageValue !== value,
			};
		});

		hydrate(changes);
	}, []);

	const contextValue = useMemo(() => ({
		name,
		changed,
		canReset,
		settings: settingsIds,
		reset,
	}), [
		name,
		changed,
		canReset,
		settingsIds.join(','),
	]);

	return <SectionContext.Provider children={children} value={contextValue} />;
}

export const useSection = () => useContext(SectionContext);
