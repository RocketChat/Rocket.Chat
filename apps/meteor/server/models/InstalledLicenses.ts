import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { InstalledLicensesRaw } from './raw/InstalledLicenses';

registerModel('IInstalledLicensesModel', new InstalledLicensesRaw(db));
