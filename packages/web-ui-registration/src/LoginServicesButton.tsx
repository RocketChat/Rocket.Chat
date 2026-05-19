import { Button } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { useLoginWithService } from '@rocket.chat/ui-contexts';
import type { ReactElement, SetStateAction, Dispatch } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoginErrorState, LoginErrors } from './LoginForm';

const servicesSupportedByMeteor = ['saml', 'cas', 'ldap'];

const LoginServicesButton = <T extends LoginService>({
	buttonLabelText,
	icon,
	title,
	service,
	className,
	disabled,
	setError,
	buttonColor,
	buttonLabelColor,
	...props
}: T & {
	className?: string;
	disabled?: boolean;
	setError?: Dispatch<SetStateAction<LoginErrorState>>;
}): ReactElement => {
	const { t } = useTranslation();
	const handler = useLoginWithService({ service, buttonLabelText, ...props });

	const handleOnClick = useCallback(() => {
		if (!servicesSupportedByMeteor.includes(service)) {
			const url = new URL(window.location.href);
			const queryParams = url.searchParams;
			const loginClient = queryParams.get('loginClient');

			const redirectUrl = new URL(`/oauth/${service}`, window.location.origin);

			if (loginClient) {
				redirectUrl.searchParams.set('loginClient', loginClient);
			}

			window.location.href = redirectUrl.toString();
			return;
		}

		handler().catch((e: { error?: LoginErrors; reason?: string }) => {
			if (!e.error || typeof e.error !== 'string') {
				return;
			}
			setError?.([e.error, e.reason]);
		});
	}, [handler, setError, service]);

	return (
		<Button
			icon={icon as IconName}
			className={className}
			onClick={handleOnClick}
			title={buttonLabelText && buttonLabelText !== title ? title : undefined}
			disabled={disabled}
			alignItems='center'
			display='flex'
			justifyContent='center'
			color={buttonLabelColor}
			backgroundColor={buttonColor}
		>
			{buttonLabelText || t('Sign_in_with__provider__', { provider: title })}
		</Button>
	);
};

export default LoginServicesButton;
