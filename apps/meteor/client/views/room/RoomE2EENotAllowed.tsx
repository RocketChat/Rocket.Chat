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
import type { Keys as IconName } from '@rocket.chat/icons';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const DOCS_URL = 'https://rocket.chat/docs/user-guides/end-to-end-encryption/';

type RoomE2EENotAllowedProps = {
	title: string;
	subTitle: string;
	action?: () => void;
	btnText?: string;
	icon: IconName;
};

const RoomE2EENotAllowed = ({ title, subTitle, action, btnText, icon }: RoomE2EENotAllowedProps): ReactElement => {
	const router = useRouter();
	const t = useTranslation();
	const handleGoHomeClick = () => {
		router.navigate('/home');
	};

	return (
		<Box display='flex' justifyContent='center' height='full'>
			<States>
				<StatesIcon name={icon} variation='primary' />
				<StatesTitle>{title}</StatesTitle>
				<StatesSubtitle>{subTitle}</StatesSubtitle>
				{action && (
					<StatesActions>
						<Button secondary={true} role='link' onClick={handleGoHomeClick}>
							{t('Back_to_home')}
						</Button>
						<StatesAction primary onClick={action}>
							{btnText}
						</StatesAction>
					</StatesActions>
				)}
				<StatesLink target='_blank' href={DOCS_URL}>
					{t('Learn_more_about_E2EE')}
				</StatesLink>
			</States>
		</Box>
	);
};

export default RoomE2EENotAllowed;
