import { useRouteParameter } from '@rocket.chat/ui-contexts';

import RegisterForm from './RegisterForm.js';
import SecretRegisterInvalidForm from './SecretRegisterInvalidForm.js';
import { useCheckRegistrationSecret } from './hooks/useCheckRegistrationSecret.js';
import type { DispatchLoginRouter } from './hooks/useLoginRouter.js';
import FormSkeleton from './template/FormSkeleton.js';
import HorizontalTemplate from './template/HorizontalTemplate.js';

export type SecretRegisterFormProps = { setLoginRoute: DispatchLoginRouter };

const SecretRegisterForm = ({ setLoginRoute }: SecretRegisterFormProps) => {
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
