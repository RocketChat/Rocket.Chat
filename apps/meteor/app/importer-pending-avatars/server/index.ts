import { Importers } from '../../importer/server';
import { PendingAvatarImporter } from './PendingAvatarImporter';

Importers.add({
	key: 'pending-avatars',
	name: 'Pending Avatars',
	visible: false,
	importer: PendingAvatarImporter,
});
