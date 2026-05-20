import { useRouter, useLoginWithToken } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useLoginViaQuery = () => {
	const router = useRouter();
	const loginWithToken = useLoginWithToken();

	useEffect(() => {
		const handleLogin = async () => {
			const { resumeToken, loginClient } = router.getSearchParameters();

			if (!resumeToken) {
				return;
			}

			//Case handled by useLoginOtherClients, we don't want to login here.
			if (loginClient) {
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
			}
		};

		handleLogin();
	}, [loginWithToken, router]);
};
