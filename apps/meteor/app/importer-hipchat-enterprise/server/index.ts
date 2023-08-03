import { Importers } from '../../importer/server';
import { HipChatEnterpriseImporter } from './importer';

Importers.add({
	key: 'hipchatenterprise',
	name: 'HipChat (tar.gz)',
	importer: HipChatEnterpriseImporter,
});
