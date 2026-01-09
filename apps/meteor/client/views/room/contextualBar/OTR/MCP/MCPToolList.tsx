import { Box, Option, Icon, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

// FIX: Define proper interface to replace 'any[]'
interface MCPTool {
	name: string;
	description: string;
}

interface MCPToolListProps {
	tools: MCPTool[];
}

export const MCPToolList = ({ tools }: MCPToolListProps) => {
	const { t } = useTranslation();

	// FIX: Defensive validation - filter out malformed data
	const validTools = tools.filter((tool) => tool && typeof tool.name === 'string' && tool.name.trim() !== '');

	if (validTools.length === 0) {
		return (
			<States inline>
				<StatesIcon name='ai' />
				<StatesTitle>{t('No_MCP_Tools_Available')}</StatesTitle>
			</States>
		);
	}

	return (
		<Box>
			{validTools.map((tool, index) => (
				// FIX: Use a unique key combining name and index for stability
				<Option key={`${tool.name}-${index}`}>
					<Icon name='robot' size='x20' />
					<Box mi='x8'>
						{/* FIX: Use nullish coalescing for display safety */}
						<Box fontScale='p2m'>{tool.name ?? t('Unknown_Tool')}</Box>
						<Box fontScale='c1' color='hint'>
							{tool.description ?? ''}
						</Box>
					</Box>
				</Option>
			))}
		</Box>
	);
};