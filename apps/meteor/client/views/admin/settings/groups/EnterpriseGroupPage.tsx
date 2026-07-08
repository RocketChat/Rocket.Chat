import { Box } from '@rocket.chat/fuselage';
import { PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Trans } from 'react-i18next';

import SettingsGroupPage from '../SettingsGroupPage';

type EnterpriseGroupPageProps = {
	_id: string;
	i18nLabel: string;
	currentTab?: string;
	hasReset?: boolean;
	onClickBack?: () => void;
};

const useRedirectToRouteLink = (onClick: (event: MouseEvent<HTMLAnchorElement>) => void) => {
	const handleClick = useCallback(
		(event: MouseEvent<HTMLAnchorElement>) => {
			event.preventDefault();
			onClick(event);
		},
		[onClick],
	);

	return { href: '#', onClick: handleClick };
};

const EnterpriseGroupPage = ({ _id, i18nLabel, onClickBack, ...props }: EnterpriseGroupPageProps) => {
	const { navigate } = useRouter();
	const redirectProps = useRedirectToRouteLink(() => navigate('/admin/subscription'));

	return (
		<SettingsGroupPage isCustom _id={_id} i18nLabel={i18nLabel} onClickBack={onClickBack} {...props}>
			<PageScrollableContentWithShadow>
				<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
					<Trans
						i18nKey='Workspace_license_is_now_managed_from_the_subscription_page'
						components={{ a: <Box is='a' fontScale='p2' color='info' {...redirectProps} /> }}
					/>
				</Box>
			</PageScrollableContentWithShadow>
		</SettingsGroupPage>
	);
};

export default EnterpriseGroupPage;
