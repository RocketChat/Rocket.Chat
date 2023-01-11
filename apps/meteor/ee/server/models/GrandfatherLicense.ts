import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { GrandfatherLicenseRaw } from './raw/GrandfatherLicense';

registerModel('IGrandfatherLicenseModel', new GrandfatherLicenseRaw(db));
