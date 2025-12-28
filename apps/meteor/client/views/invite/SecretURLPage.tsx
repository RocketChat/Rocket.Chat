import { useUserId, useRouter } from '@rocket.chat/ui-contexts';
import RegistrationPageRouter from '@rocket.chat/web-ui-registration';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

const SecretURLPage = (): ReactElement | null => {
	const uid = useUserId();
	const router = useRouter();

	useEffect(() => {
		if (uid) {
			router.navigate('/home');
		}
	}, [uid, router]);

	if (uid) {
		return null;
	}

	return <RegistrationPageRouter defaultRoute='secret-register' />;
};

export default SecretURLPage;
