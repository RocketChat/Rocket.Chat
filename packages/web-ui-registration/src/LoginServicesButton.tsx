import { Button, Icon } from '@rocket.chat/fuselage';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { useLoginWithService, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';

const LoginServicesButton = <T extends LoginService>({
	buttonLabelText,
	icon,
	title,
	clientConfig,
	service,
	className,
	disabled,
	...props
}: T & {
	className?: string;
	disabled?: boolean;
}): ReactElement => {
	const t = useTranslation();
	const handler = useLoginWithService({ service, buttonLabelText, title, clientConfig, ...props });

	return (
		<Button
			className={className}
			onClick={handler}
			title={buttonLabelText && buttonLabelText !== title ? title : undefined}
			disabled={disabled}
			alignItems='center'
			display='flex'
			justifyContent='center'
		>
			{icon && <Icon size='x20' mie='x4' name={icon as ComponentProps<typeof Icon>['name']} />}
			{buttonLabelText || t('Sign_in_with__provider__', { provider: title })}
		</Button>
	);
};

export default LoginServicesButton;
