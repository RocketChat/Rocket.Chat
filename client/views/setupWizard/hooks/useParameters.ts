import { useState, useEffect } from 'react';

import { ISetting } from '../../../../definition/ISetting';
import { useMethod } from '../../../contexts/ServerContext';

export const useParameters = (): {
	loaded: boolean;
	settings: Array<ISetting>;
	skipCloudRegistration: boolean;
} => {
	const [loaded, setLoaded] = useState<boolean>(false);
	const [settings, setSettings] = useState<Array<ISetting>>([]);
	const [skipCloudRegistration, setSkipCloudRegistration] = useState<boolean>(false);
	const getSetupWizardParameters = useMethod('getSetupWizardParameters');

	useEffect(() => {
		let mounted = true;
		const requestParameters = async (): Promise<void> => {
			try {
				const { setupWizardSettings = [], serverAlreadyRegistered = false } = (await getSetupWizardParameters()) || {};

				if (!mounted) {
					return;
				}

				setLoaded(true);
				setSettings(setupWizardSettings);
				setSkipCloudRegistration(serverAlreadyRegistered);
			} catch (error) {
				setLoaded(false);
				setSettings([]);
				setSkipCloudRegistration(false);
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
		skipCloudRegistration,
	};
};
