import type { RocketchatI18nKeys } from '@rocket.chat/i18n';

import type { Importer } from '../classes/ImporterBase';

export type ImporterInfo = {
	key: string;
	name: RocketchatI18nKeys;
	visible: boolean; // Determines if this importer can be selected by the user in the New Import screen.
	importer: typeof Importer;
};
