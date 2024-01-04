import { Importers } from '../../importer/server';
import { HipChatEnterpriseImporter } from './HipChatEnterpriseImporter';

Importers.add({
	key: 'hipchatenterprise',
	name: 'HipChat (tar.gz)',
	importer: HipChatEnterpriseImporter,
});
