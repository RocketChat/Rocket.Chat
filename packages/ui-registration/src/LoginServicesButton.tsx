import { css } from '@rocket.chat/css-in-js';
import { Button, useStyle } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { useLoginWithService } from '@rocket.chat/ui-contexts';
import type { SetStateAction, Dispatch } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoginErrorState, LoginErrors } from './LoginForm';

const servicesSupportedByMeteor = ['saml', 'cas', 'ldap'];

// The value ends up in a stylesheet, so one that is not a colour is left out
const isColor = (value?: string): value is string => Boolean(value) && (globalThis.CSS?.supports?.('color', value as string) ?? true);

// The admin's colours replace the secondary button's in every state, as an inline style used to
const adminColors = (color?: string, backgroundColor?: string) => css`
	${isColor(color) && `--rcx-button-secondary-color: ${color}; --rcx-button-secondary-disabled-color: ${color};`}
	${
		isColor(backgroundColor) &&
		['background-color', 'hover-background-color', 'active-background-color', 'focus-background-color', 'disabled-background-color']
			.map((name) => `--rcx-button-secondary-${name}: ${backgroundColor};`)
			.join(' ')
	}
`;

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
	...props
}: T & {
	className?: string;
	disabled?: boolean;
	loginStyle?: 'popup' | 'redirect' | '';
	setError?: Dispatch<SetStateAction<LoginErrorState>>;
}) => {
	const { t } = useTranslation();
	const handler = useLoginWithService({ service, buttonLabelText, ...props });
	const colorsClassName = useStyle(adminColors(buttonLabelColor, buttonColor));

	const handleOnClick = useCallback(() => {
		if (!servicesSupportedByMeteor.includes(service)) {
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
	}, [handler, setError, service, loginStyle]);

	return (
		<Button
			icon={icon as IconName}
			className={[className, colorsClassName].filter(Boolean).join(' ')}
			onClick={handleOnClick}
			title={buttonLabelText && buttonLabelText !== title ? title : undefined}
			disabled={disabled}
		>
			{buttonLabelText || t('Sign_in_with__provider__', { provider: title })}
		</Button>
	);
};

export default LoginServicesButton;
