import React from 'react';

import { RouterProvider } from './RouterProvider';
import { ConnectionStatusProvider } from './ConnectionStatusProvider';
import { TranslationProvider } from './TranslationProvider';

export function MeteorProvider({ children }) {
	return <ConnectionStatusProvider>
		<RouterProvider>
			<TranslationProvider>
				{children}
			</TranslationProvider>
		</RouterProvider>
	</ConnectionStatusProvider>;
}
