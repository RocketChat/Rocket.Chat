import { useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { useCheckRegistrationSecret } from './hooks/useCheckRegistrationSecret';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import LoginRegisterForm from './RegisterForm';
import FormSkeleton from './template/FormSkeleton';

const SecretRegisterForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const hash = useRouteParameter('hash');

	const { data: valid, isSuccess } = useCheckRegistrationSecret(hash);

	useEffect(() => {
		isSuccess && !valid && setLoginRoute('register-invalid');
	}, [isSuccess, valid]);

	if (isSuccess && valid) {
		return <LoginRegisterForm hash={hash} setLoginRoute={setLoginRoute} />;
	}

	return <FormSkeleton />;
};

export default SecretRegisterForm;
