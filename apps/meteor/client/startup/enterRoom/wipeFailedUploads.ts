import { Session } from 'meteor/session';

import type { Uploading } from '../../../app/ui/client/lib/fileUpload';
import { callbacks } from '../../../lib/callbacks';

function wipeFailedUploads(): void {
	const uploads: Uploading[] = Session.get('uploading');

	if (uploads) {
		Session.set(
			'uploading',
			uploads.filter((upload) => !upload.error),
		);
	}
}

callbacks.add('enter-room', wipeFailedUploads);
