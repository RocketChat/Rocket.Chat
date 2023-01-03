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
						{!isCustomContentVisible ? 'Not visible to workspace' : 'Visible to workspace'}
					</Tag>
				</Card.Title>
				<Card.Body>
					<Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />
				</Card.Body>
				<Card.FooterWrapper>
					<Card.Footer>
						<Button is='a' href='/admin/settings/Layout' title='Layout / Home page content'>
							Customize content
						</Button>
						<Button
							title={!isCustomContentVisible ? `Now it's available only for admins` : `Now it's available for everyone`}
							onClick={handleChangeCustomContentVisibility}
						>
							<Icon name='eye-off' size='x16' />
							Show to workspace
						</Button>
						<Button
							disabled={!isEnterprise}
							title='It will hide all other white blocks in the homepage (Enterprise only)'
							onClick={handleOnlyShowCustomContent}
						>
							<Icon name='lightning' size='x16' /> Show only this content
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
