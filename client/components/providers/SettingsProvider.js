import React from 'react';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings/client';
import { SettingsContext } from '../../contexts/SettingsContext';

const contextValue = {
	get: (name, listener) => {
		if (!listener) {
			return Tracker.nonreactive(() => settings.get(name));
		}

		const computation = Tracker.autorun(({ firstRun }) => {
			const value = settings.get(name);
			if (!firstRun) {
				listener(value);
			}
		});

		return () => {
			computation.stop();
		};
	},
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
