import { useUserId, useNavigate } from '@rocket.chat/ui-contexts';
import RegistrationPageRouter from '@rocket.chat/web-ui-registration';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

const SecretURLPage = (): ReactElement | null => {
	const uid = useUserId();
	const navigate = useNavigate();

	useEffect(() => {
		if (uid) {
			navigate('/home');
		}
	}, [uid, navigate]);

	if (uid) {
		return null;
	}

	return <RegistrationPageRouter defaultRoute='secret-register' />;
};

export default SecretURLPage;
