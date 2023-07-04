import { HipChatEnterpriseImporter } from './importer';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'hipchatenterprise',
	name: 'HipChat (tar.gz)',
	importer: HipChatEnterpriseImporter,
});
