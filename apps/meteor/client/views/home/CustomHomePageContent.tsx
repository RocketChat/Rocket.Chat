import { Box, Button, Icon, Tag } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useEndpoint, usePermission, useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import { useIsEnterprise } from '../../hooks/useIsEnterprise';

const CustomHomePageContent = (): ReactElement | null => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const body = String(useSetting('Layout_Home_Body'));
	const { data } = useIsEnterprise();
	const isAdmin = usePermission('view-user-administration');
	const [isCustomContentVisible, setIsCustomContentVisible] = useState(useSetting('Layout_Home_Custom_Block_Visible'));
	const isCustomContentOnly = useSetting('Layout_Custom_Body_Only');
	const customContentVisible = useEndpoint('POST', '/v1/settings/Layout_Home_Custom_Block_Visible') as unknown as ({
		value,
	}: {
		value: boolean;
	}) => void;
	const customContentOnly = useEndpoint('POST', '/v1/settings/Layout_Custom_Body_Only') as unknown as ({
		value,
	}: {
		value: boolean;
	}) => void;

	const handleChangeCustomContentVisibility = async () => {
		try {
			await customContentVisible({ value: Boolean(!isCustomContentVisible) });
			setIsCustomContentVisible(!isCustomContentVisible);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Invalid_password') });
		}
	};

	const handleOnlyShowCustomContent = async () => {
		try {
			await customContentOnly({ value: Boolean(!isCustomContentOnly) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Invalid_password') });
		}
	};

	const isEnterprise = data?.isEnterprise;

	if (isAdmin) {
		return (
			<Card variant='light' data-qa-id='homepage-custom-content'>
				<Card.Title>
					<Tag>
						<Icon mie='x4' name={!isCustomContentVisible ? 'eye-off' : 'eye'} size='x12' />
						{!isCustomContentVisible ? t('Not_Visible_To_Workspace') : t('Visible_To_Workspace')}
					</Tag>
				</Card.Title>
				<Card.Body>
					<Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />
				</Card.Body>
				<Card.FooterWrapper>
					<Card.Footer>
						<Button is='a' href='/admin/settings/Layout' title={t('Layout_Home_Page_Content')}>
							{t('Customize_Content')}
						</Button>
						<Button
							title={!isCustomContentVisible ? t('Now_Its_Available_Only_For_Admins') : t('Now_Its_Available_For_Everyone')}
							onClick={handleChangeCustomContentVisibility}
						>
							<Icon name='eye-off' size='x16' />
							{t('Show_To_Workspace')}
						</Button>
						<Button
							disabled={Boolean(!isCustomContentVisible) || !isEnterprise}
							title={t('It_Will_Hide_All_Other_White_Blockes_In_The_Homepage')}
							onClick={handleOnlyShowCustomContent}
						>
							<Icon name='lightning' size='x16' /> {t('Show_Only_This_Content')}
						</Button>
					</Card.Footer>
				</Card.FooterWrapper>
			</Card>
		);
	}

	if (isCustomContentVisible) {
		return <Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />;
	}

	return <></>;
};

export default CustomHomePageContent;
