import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

const statusLabel = (status: string) => {
	if (status === 'active') {
		return 'Active';
	}
	if (status === 'inactive') {
		return 'Inactive';
	}
	return 'Draft';
};

const DocumentationTemplatesTab = ({ onEdit }: { onEdit: (id: string | null) => void }) => {
	const getTemplates = useEndpoint('GET', '/v1/medsense/documentation.templates.list');

	const { data, isLoading } = useQuery({
		queryKey: ['medsense', 'documentation-templates'],
		queryFn: async () => {
			const response = await getTemplates();
			return response.templates || [];
		},
	});

	return (
		<Box p='x24' display='flex' flexDirection='column' maxWidth='x900' w='full'>
			<Box mb='x16' display='flex' justifyContent='flex-end'>
				<Button primary onClick={() => onEdit(null)}>
					Create New Template
				</Button>
			</Box>

			{isLoading && <Box p='x16'>Loading templates...</Box>}

			{!isLoading && (!data || data.length === 0) && (
				<Box p='x16' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
					No documentation templates found.
				</Box>
			)}

			{!isLoading && data?.length > 0 && (
				<Box display='flex' flexDirection='column' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
					{data.map((template: any, index: number) => (
						<Box
							key={template._id}
							display='flex'
							justifyContent='space-between'
							alignItems='center'
							pi='x16'
							pt='x16'
							pb='x16'
							flexWrap='wrap'
							borderBlockEndWidth={index === data.length - 1 ? 'none' : 'default'}
							borderColor='extra-light'
						>
							<Box display='flex' flexDirection='column' mie='x16'>
								<Box fontScale='p2m'>{template.label || template.key}</Box>
								<Box fontScale='c1' color='hint'>
									Key: {template.key}
								</Box>
								<Box fontScale='c1' color='hint'>
									Intervention Types: {Array.isArray(template.interventionTypes) && template.interventionTypes.length ? template.interventionTypes.join(', ') : 'All'}
								</Box>
								<Box fontScale='c1' color='hint'>
									Version: v{template.version || 1} | Status: {statusLabel(String(template.status || 'draft'))}
								</Box>
							</Box>
							<Box display='flex' alignItems='center'>
								<Button small onClick={() => onEdit(template._id)}>
									Edit
								</Button>
							</Box>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};

export default DocumentationTemplatesTab;
