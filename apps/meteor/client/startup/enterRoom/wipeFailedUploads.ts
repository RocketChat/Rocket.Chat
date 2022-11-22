import { wipeFailedUploads } from '../../../app/ui/client/lib/fileUpload';
import { callbacks } from '../../../lib/callbacks';

callbacks.add('enter-room', wipeFailedUploads);
