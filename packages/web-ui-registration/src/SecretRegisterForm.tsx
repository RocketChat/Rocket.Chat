import { useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import RegisterForm from './RegisterForm';
import SecretRegisterInvalidForm from './SecretRegisterInvalidForm';
import { useCheckRegistrationSecret } from './hooks/useCheckRegistrationSecret';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import FormSkeleton from './template/FormSkeleton';
import HorizontalTemplate from './template/HorizontalTemplate';

const SecretRegisterForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const hash = useRouteParameter('hash');

	const { data: valid, isSuccess } = useCheckRegistrationSecret(hash);

	if (isSuccess && !valid) {
		return <SecretRegisterInvalidForm />;
	}

	if (isSuccess && valid) {
		return (
			<HorizontalTemplate>
				<RegisterForm setLoginRoute={setLoginRoute} />
			</HorizontalTemplate>
		);
	}

	return (
		<HorizontalTemplate>
			<FormSkeleton />
		</HorizontalTemplate>
	);
};

export default SecretRegisterForm;
