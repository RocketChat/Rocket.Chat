import path from 'path';

import { config } from '@rocket.chat/config';

import { UploadFS } from '../../../server/ufs';

// set ufs temp dir to $TMPDIR/ufs instead of /tmp/ufs if the variable is set
if (config.TMPDIR) {
	UploadFS.config.tmpDir = path.join(config.TMPDIR || '', 'ufs');
}
