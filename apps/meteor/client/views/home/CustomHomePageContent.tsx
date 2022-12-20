import { Box, Button, Icon, Tag } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import { useIsEnterprise } from '../../hooks/useIsEnterprise';

const CustomHomePageContent = (): ReactElement | null => {
	const body = String(useSetting('Layout_Home_Body'));
	const { data } = useIsEnterprise();
	const isAdmin = usePermission('view-user-administration');
	// const [showOnlyThisContent, setShowOnlyThisContent] = useState(useSetting('Layout_Custom_Body_Only'));
	const [isCustomContentVisible, setIsCustomContentVisible] = useState(useSetting('Layout_Custom_Body'));

	const isEnterprise = data?.isEnterprise;

	if (!isAdmin && isCustomContentVisible) {
		return <Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />;
	}

	return (
		<Card variant='light' data-qa-id='homepage-custom-content'>
			<Card.Title>
				<Tag>
					<Icon mie='x4' name={!isCustomContentVisible ? 'eye' : 'eye-off'} size='x12' />
					{!isCustomContentVisible ? 'Visible to workspace' : 'Not visible to workspace'}
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
						onClick={(): void => {
							setIsCustomContentVisible(!isCustomContentVisible);
						}}
					>
						<Icon name='eye-off' size='x16' />
						Show to workspace
					</Button>
					<Button disabled={!isEnterprise} title='It will hide all other white blocks in the homepage (Enterprise only)'>
						<Icon name='lightning' size='x16' /> Show only this content
					</Button>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default CustomHomePageContent;
