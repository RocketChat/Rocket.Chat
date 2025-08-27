import { config } from '../../../../../app/apple/lib/config';
import { CustomOAuth } from '../../../../lib/customOAuth/CustomOAuth';

/* const Apple =*/ CustomOAuth.configureOAuthService('apple', config);

export const useAppleOAuth = () => {
	// Here we would expect to handle changes in settings, updating the configuration
	// accordingly, but it was not implemented yet.
};
