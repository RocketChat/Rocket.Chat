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
	const [isCustomContentVisible, setIsCustomContentVisible] = useState(useSetting('Layout_Home_Custom_Block_Visible'));

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
	}

	return <Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />;
};

export default CustomHomePageContent;
