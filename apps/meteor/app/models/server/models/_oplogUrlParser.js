import { promisify } from 'util';

import { parseConnectionString } from 'mongodb/lib/core';

export const urlParser = promisify(parseConnectionString);
