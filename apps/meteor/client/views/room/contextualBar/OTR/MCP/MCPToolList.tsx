import { Box, Option, Icon, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const MCPToolList = ({ tools }: { tools: any[] }) => {
	const { t } = useTranslation();

	if (tools.length === 0) {
		return (
			<States inline>
				<StatesIcon name='ai' />
				<StatesTitle>{t('No_MCP_Tools_Available')}</StatesTitle>
			</States>
		);
	}

	return (
		<Box>
			{tools.map((tool) => (
				<Option key={tool.name}>
					<Icon name='robot' size='x20' />
					<Box mi='x8'>
						<Box fontScale='p2m'>{tool.name}</Box>
						<Box fontScale='c1' color='hint'>{tool.description}</Box>
					</Box>
				</Option>
			))}
		</Box>
	);
};