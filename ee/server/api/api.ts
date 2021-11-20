import { API } from '../../../app/api/server/api';
import { use } from '../../../app/settings/server/Middleware';
import { isEnterprise } from '../../app/license/server/license';

// Overwrites two factor method to enforce 2FA check for enterprise APIs when
// no license was provided to prevent abuse on enterprise APIs.
API.v1.processTwoFactor = use(API.v1.processTwoFactor, function(context, next) {
	const [params] = context;

	if (params.options?.enterprise && params.options?.twoFactorRequired && !params.options.twoFactorOptions?.requireSecondFactor) {
		params.options = {
			...params.options,
			twoFactorOptions: {
				...params.options.twoFactorOptions,
				requireSecondFactor: !isEnterprise(),
			},
		};
	}

	return next(params);
});
