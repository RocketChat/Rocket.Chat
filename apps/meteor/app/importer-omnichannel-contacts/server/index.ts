import { License } from '@rocket.chat/license';

import { Importers } from '../../importer/server';
import { ContactImporter } from './ContactImporter';

License.onValidFeature('contact-id-verification', () => {
	Importers.add({
		key: 'omnichannel_contact',
		name: 'omnichannel_contacts_importer',
		importer: ContactImporter,
	});
});
