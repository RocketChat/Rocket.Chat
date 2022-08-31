import { ButtonGroup, Button, Divider } from '@rocket.chat/fuselage';
import { useLoginServices, useLoginService, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode } from 'react';

export const LoginServices = (): ReactNode => {
	const services = useLoginServices();
	const t = useTranslation();
	if (services.length === 0) {
		return null;
	}

	return (
		<>
			<ButtonGroup vertical stretch small>
				{services.map(({ service, buttonLabelColor, clientConfig, buttonColor, displayName, buttonLabelText }) => (
					<LoginServicesButton
						key={service}
						service={service}
						title={displayName}
						clientConfig={clientConfig}
						bg={buttonColor}
						color={buttonLabelColor}
					>
						{buttonLabelText}
					</LoginServicesButton>
				))}
			</ButtonGroup>
			<Divider children={t('or')} />
		</>
	);
};

const LoginServicesButton = <
	T extends { service: string; clientConfig?: unknown; title: string; bg?: string; color?: string; children?: ReactNode },
>({
	bg,
	color,
	title,
	service,
	clientConfig,
	...props
}: T): ReactElement => {
	const handler = useLoginService({ service, clientConfig });
	return <Button {...props} onClick={handler} title={title} primary backgroundColor={bg} borderColor={bg} color={color} />;
};
