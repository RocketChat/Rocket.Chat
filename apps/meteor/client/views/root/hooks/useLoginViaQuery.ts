import { useRouter, useLoginWithToken, useUnstoreLoginToken } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useLoginViaQuery = () => {
	const router = useRouter();
	const loginWithToken = useLoginWithToken();
	const unstoreLoginToken = useUnstoreLoginToken();

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
				unstoreLoginToken(() => {
					const { resumeToken: _, userId: __, ...search } = router.getSearchParameters();
					router.navigate(
						{
							pathname: router.getLocationPathname(),
							search,
						},
						{ replace: true },
					);
				});
			}
		};

		void handleLogin();
	}, [loginWithToken, router, unstoreLoginToken]);
};
