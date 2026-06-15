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
	loginStyle,
	enableModernOAuthFlow,
	...props
}: T & {
	className?: string;
	disabled?: boolean;
	loginStyle?: 'popup' | 'redirect' | '';
	setError?: Dispatch<SetStateAction<LoginErrorState>>;
	enableModernOAuthFlow?: boolean;
}): ReactElement => {
	const { t } = useTranslation();
	const handler = useLoginWithService({ service, buttonLabelText, ...props });

	const handleOnClick = useCallback(() => {
		if (!servicesSupportedByMeteor.includes(service) && enableModernOAuthFlow) {
			const url = new URL(window.location.href);
			const queryParams = url.searchParams;
			const loginClient = queryParams.get('loginClient');

			if (loginStyle === 'popup') {
				window.open(
					`/oauth/${service}${loginClient ? `?loginClient=${loginClient}` : ''}`,
					'oauth',
					'popup=yes,width=500,height=700,left=100,top=100',
				);
				return;
			}

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
	}, [handler, setError, service, enableModernOAuthFlow, loginStyle]);

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
