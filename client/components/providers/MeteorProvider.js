import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import React from 'react';

import { MeteorContext } from '../contexts/MeteorContext';
import { RouterProvider } from './RouterProvider';
import { ConnectionStatusProvider } from './ConnectionStatusProvider';
import { TranslationProvider } from './TranslationProvider';

const contextValue = {
	Meteor,
	Tracker,
};

export function MeteorProvider({ children }) {
	return <MeteorContext.Provider value={contextValue}>
		<ConnectionStatusProvider>
			<RouterProvider>
				<TranslationProvider>
					{children}
				</TranslationProvider>
			</RouterProvider>
		</ConnectionStatusProvider>
	</MeteorContext.Provider>;
}
