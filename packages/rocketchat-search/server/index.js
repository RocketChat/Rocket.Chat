import SearchProvider from './model/provider';
import './service/providerService.js';
import './service/validationService.js';
import './events/events.js';
import './provider/defaultProvider.js';

import { searchProviderService } from './service/providerService';

export {
	searchProviderService,
	SearchProvider,
};
