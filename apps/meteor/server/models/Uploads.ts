import { registerModel } from '@rocket.chat/models';

import { UploadsRaw } from './raw/Uploads';

registerModel('IUploadsModel', new UploadsRaw());
