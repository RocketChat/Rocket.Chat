import { promisify } from 'util';

import _urlParser from 'mongodb/lib/url_parser';

export const urlParser = promisify(_urlParser);
