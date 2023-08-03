import { Importers } from '../../importer/server';
import { PendingAvatarImporter } from './importer';

Importers.add({
	key: 'pending-avatars',
	name: 'Pending Avatars',
	visible: false,
	importer: PendingAvatarImporter,
});
