import { Accordion, Box } from '@rocket.chat/fuselage';
import { PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';
import SettingsGroupPage from '../SettingsGroupPage';
import Section from '../SettingsSection';

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

const EnterpriseGroupPage = ({ _id, i18nLabel, hasReset, currentTab, onClickBack, ...props }: EnterpriseGroupPageProps) => {
	const { t } = useTranslation();
	const { navigate } = useRouter();
	const redirectProps = useRedirectToRouteLink(() => navigate('/admin/subscription'));
	const sections = useEditableSettingsGroupSections(_id);

	return (
		<SettingsGroupPage isCustom _id={_id} i18nLabel={i18nLabel} onClickBack={onClickBack} {...props}>
			<PageScrollableContentWithShadow>
				<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
					<Trans
						i18nKey='Workspace_license_is_now_managed_from_the_subscription_page'
						components={{ a: <Box is='a' fontScale='p2' color='info' {...redirectProps} /> }}
					/>
					<Accordion>
						{sections.map((sectionName) => (
							<Section
								key={sectionName || ''}
								hasReset={hasReset}
								groupId={_id}
								sectionName={sectionName}
								sectionTitle={t('Manual_license_management_deprecated')}
								currentTab={currentTab}
								solo={false}
							/>
						))}
					</Accordion>
				</Box>
			</PageScrollableContentWithShadow>
		</SettingsGroupPage>
	);
};

export default EnterpriseGroupPage;
