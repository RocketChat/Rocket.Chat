import { Importers } from '../../importer/server';
import { isSingleContactEnabled } from '../../livechat/server/lib/Contacts';
import { ContactImporter } from './ContactImporter';

if (isSingleContactEnabled()) {
	Importers.add({
		key: 'omnichannel_contact',
		name: 'omnichannel_contacts_importer',
		importer: ContactImporter,
	});
}
