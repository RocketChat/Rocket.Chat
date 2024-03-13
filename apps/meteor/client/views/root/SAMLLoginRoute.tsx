import { useRouter, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

const SAMLLoginRoute = () => {
	const siteUrl = useSetting<string>('Site_Url');
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		const { token } = router.getRouteParameters();
		const { redirectUrl } = router.getSearchParameters();

		if (!siteUrl) {
			return;
		}
		Meteor.loginWithSamlToken(token, (error?: unknown) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			if (redirectUrl?.startsWith(siteUrl)) {
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
	}, [dispatchToastMessage, router, siteUrl]);

	return null;
};

export default SAMLLoginRoute;
