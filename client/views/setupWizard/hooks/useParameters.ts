import { useState, useEffect } from 'react';

import { useMethod } from '../../../contexts/ServerContext';

export const useParameters = (): {
	loaded: boolean;
	settings: Array<string>;
	canDeclineServerRegistration: boolean;
} => {
	const [loaded, setLoaded] = useState(false);
	const [settings, setSettings] = useState([]);
	const [canDeclineServerRegistration, setCapableOfDeclineServerRegistration] = useState(false);
	const getSetupWizardParameters = useMethod('getSetupWizardParameters');

	useEffect(() => {
		let mounted = true;
		const requestParameters = async (): Promise<void> => {
			try {
				const { settings = [], allowStandaloneServer = false } =
					(await getSetupWizardParameters()) || {};

				if (!mounted) {
					return;
				}

				setLoaded(true);
				setSettings(settings);
				setCapableOfDeclineServerRegistration(allowStandaloneServer);
			} catch (error) {
				setLoaded(false);
				setSettings([]);
				setCapableOfDeclineServerRegistration(false);
			}
		};

		requestParameters();

		return (): void => {
			mounted = false;
		};
	}, [getSetupWizardParameters]);

	return {
		loaded,
		settings,
		canDeclineServerRegistration,
	};
};
