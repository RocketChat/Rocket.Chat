import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { RawImports } from './raw/RawImports';

registerModel('IRawImportsModel', new RawImports(db));
