import React from 'react';

import { settings } from '../../app/settings/client';
import { SettingsContext } from '../contexts/SettingsContext';
import { createObservableFromReactive } from './createObservableFromReactive';

const contextValue = {
	get: createObservableFromReactive((name) => settings.get(name)),
	set: (name, value) => new Promise((resolve, reject) => {
		settings.set(name, value, (error, result) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result);
		});
	}),
	batchSet: (entries) => new Promise((resolve, reject) => {
		settings.batchSet(entries, (error, result) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result);
		});
	}),
};

export function SettingsProvider({ children }) {
	return <SettingsContext.Provider children={children} value={contextValue} />;
}
