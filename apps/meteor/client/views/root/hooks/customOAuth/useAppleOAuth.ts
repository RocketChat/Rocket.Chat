import { config } from '../../../../../app/apple/lib/config';
import { CustomOAuth } from '../../../../lib/customOAuth/CustomOAuth';

/* const Apple =*/ CustomOAuth.configureOAuthService('apple', config);

export const useAppleOAuth = () => {
	// do nothing
};
