import { Importers } from '../../importer/server';
import { ContactImporter } from './ContactImporter';

Importers.add({
	key: 'omnichannel_contact',
	name: 'omnichannel_contacts_importer',
	importer: ContactImporter,
});
