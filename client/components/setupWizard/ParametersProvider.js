import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { call } from '../../../app/ui-utils/client';

const ParametersContext = createContext({
	loaded: true,
	settings: [],
	canDeclineServerRegistration: false,
});

export const useSetupWizardParameters = () => useContext(ParametersContext);

export function ParametersProvider({ children }) {
	const [loaded, setLoaded] = useState(false);
	const [settings, setSettings] = useState([]);
	const [canDeclineServerRegistration, setCapableOfDeclineServerRegistration] = useState(false);

	useEffect(() => {
		const getParameters = async () => {
			const {
				settings,
				allowStandaloneServer,
			} = await call('getSetupWizardParameters') || {};

			setLoaded(true);
			setSettings(settings);
			setCapableOfDeclineServerRegistration(allowStandaloneServer);
		};

		getParameters();
	}, []);

	const value = useMemo(() => ({
		loaded,
		settings,
		canDeclineServerRegistration,
	}), [loaded, settings, canDeclineServerRegistration]);

	return <ParametersContext.Provider value={value}>
		{children}
	</ParametersContext.Provider>;
}
