import { onLicense } from '../../app/license/server';
import { settings } from '../../../app/settings/server/functions/settings';


export const addEnterpriseSettings = function(name: string): void {
	onLicense('SAML-enterprise', () => {
		settings.add(`SAML_Custom_${ name }_allowed_clock_drift`, false, {
			type: 'int',
			group: 'SAML',
			enterprise: true,
			invalidValue: false,
			section: 'SAML_Section_6_Advanced',
			i18nLabel: 'SAML_Allowed_Clock_Drift',
			i18nDescription: 'SAML_Allowed_Clock_Drift_Description',
		});
	});
};
