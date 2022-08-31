import { Button } from '@rocket.chat/fuselage';
import { useLoginService, LoginService } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const LoginServicesButton = <T extends LoginService>(props: T): ReactElement => {
	const handler = useLoginService(props);
	return (
		<Button
			primary
			{...props}
			onClick={handler}
			title={props.buttonLabelText && props.buttonLabelText !== props.title ? props.title : undefined}
			backgroundColor={props.buttonColor}
			borderColor={props.buttonColor}
			color={props.buttonLabelColor}
		>
			{props.buttonLabelText || props.title}
		</Button>
	);
};
