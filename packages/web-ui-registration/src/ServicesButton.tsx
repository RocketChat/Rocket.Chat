import { Button } from '@rocket.chat/fuselage';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { useLoginWithService } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

const ServicesButton = <T extends LoginService>({
	buttonLabelColor,
	buttonColor,
	buttonLabelText,
	title,
	clientConfig,
	service,
	className,
	...props
}: T & {
	className?: string;
}): ReactElement => {
	const handler = useLoginWithService({ service, buttonLabelColor, buttonColor, buttonLabelText, title, clientConfig, ...props });
	return (
		<Button
			primary
			className={className}
			onClick={handler}
			title={buttonLabelText && buttonLabelText !== title ? title : undefined}
			backgroundColor={buttonColor}
			borderColor={buttonColor}
			color={buttonLabelColor}
		>
			{buttonLabelText || title}
		</Button>
	);
};

export default ServicesButton;
