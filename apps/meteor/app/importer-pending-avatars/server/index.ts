import { PendingAvatarImporter } from './PendingAvatarImporter';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'pending-avatars',
	name: 'Pending Avatars',
	visible: false,
	importer: PendingAvatarImporter,
});
