import path from 'path';

import { UploadFS } from '../../../server/ufs';

// set ufs temp dir to $TMPDIR/ufs instead of /tmp/ufs if the variable is set
if ('TMPDIR' in process.env) {
	UploadFS.config.tmpDir = path.join(process.env.TMPDIR || '', 'ufs');
}
