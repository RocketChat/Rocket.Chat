import {
	Box,
	Button,
	States,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesLink,
	StatesSubtitle,
	StatesTitle,
} from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const DOCS_URL = 'https://rocket.chat/docs/user-guides/end-to-end-encryption/';

type RoomE2EENotAllowedProps = {
	title: string;
	subTitle: string;
	action: () => void;
	btnText: string;
};

const RoomE2EENotAllowed = ({ title, subTitle, action, btnText }: RoomE2EENotAllowedProps): ReactElement => {
	const router = useRouter();

	const handleGoHomeClick = () => {
		router.navigate('/home');
	};

	return (
		<Box display='flex' justifyContent='center' height='full'>
			<States>
				<StatesIcon name='key' variation='primary' />
				<StatesTitle>{title}</StatesTitle>
				<StatesSubtitle>{subTitle}</StatesSubtitle>
				<StatesActions>
					<Button secondary={true} role='link' onClick={handleGoHomeClick}>
						Back to home
					</Button>
					<StatesAction primary onClick={action}>
						{btnText}
					</StatesAction>
				</StatesActions>
				<StatesLink target='_blank' href={DOCS_URL}>
					Learn more about E2EE
				</StatesLink>
			</States>
		</Box>
	);
};

export default RoomE2EENotAllowed;
