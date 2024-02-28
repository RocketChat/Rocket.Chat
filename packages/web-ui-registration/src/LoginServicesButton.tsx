import { Button } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { useLoginWithService, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, SetStateAction, Dispatch } from 'react';
import { useCallback } from 'react';

import type { LoginErrors } from './LoginForm';

const LoginServicesButton = <T extends LoginService>({
	buttonLabelText,
	icon,
	title,
	service,
	className,
	disabled,
	setError,
	...props
}: T & {
	className?: string;
	disabled?: boolean;
	setError?: Dispatch<SetStateAction<LoginErrors | undefined>>;
}): ReactElement => {
	const t = useTranslation();
	const handler = useLoginWithService({ service, buttonLabelText, ...props });

	const handleOnClick = useCallback(() => {
		handler().catch((e: { error?: LoginErrors }) => {
			if (!e.error || typeof e.error !== 'string') {
				return;
			}
			setError?.(e.error);
		});
	}, [handler, setError]);

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
		>
			{buttonLabelText || t('Sign_in_with__provider__', { provider: title })}
		</Button>
	);
};

export default LoginServicesButton;
