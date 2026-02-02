import { useRouter, useLoginWithToken } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { useEffect } from 'react';

export const useLoginViaQuery = () => {
	const router = useRouter();
	const loginWithToken = useLoginWithToken();

	useEffect(() => {
		const handleLogin = async () => {
			const { resumeToken } = router.getSearchParameters();

			if (!resumeToken) {
				return;
			}

			try {
				await loginWithToken(resumeToken);

				const routeName = router.getRouteName();

				if (!routeName) {
					router.navigate('/home');
				}

				const { resumeToken: _, userId: __, ...search } = router.getSearchParameters();

				router.navigate(
					{
						pathname: router.getLocationPathname(),
						search,
					},
					{ replace: true },
				);
			} catch (error) {
				console.error('Failed to login with token', error);
				// Clear invalid tokens, this prevents getting stuck on registration page
				Accounts._unstoreLoginToken();
				const { resumeToken: _, userId: __, ...search } = router.getSearchParameters();
				router.navigate(
					{
						pathname: router.getLocationPathname(),
						search,
					},
					{ replace: true },
				);
			}
		};

		void handleLogin();
	}, [loginWithToken, router]);
};
