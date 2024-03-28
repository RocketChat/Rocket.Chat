import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useAbsoluteUrl, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

const SAMLLoginRoute = () => {
	const rootUrl = useAbsoluteUrl()('');
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		const { token } = router.getRouteParameters();
		const { redirectUrl } = router.getSearchParameters();

		Meteor.loginWithSamlToken(token, (error?: unknown) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			const decodedRedirectUrl = decodeURIComponent(redirectUrl || '');
			if (decodedRedirectUrl?.startsWith(rootUrl)) {
				const redirect = new URL(decodedRedirectUrl);
				router.navigate(
					{
						pathname: redirect.pathname as LocationPathname,
						search: Object.fromEntries(redirect.searchParams.entries()),
					},
					{ replace: true },
				);
				window.location.href = decodeURIComponent(redirectUrl);
			} else {
				router.navigate(
					{
						pathname: '/home',
					},
					{ replace: true },
				);
			}
		});
	}, [dispatchToastMessage, rootUrl, router]);

	return null;
};

export default SAMLLoginRoute;
