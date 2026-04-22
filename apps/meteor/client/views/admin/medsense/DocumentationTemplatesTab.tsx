import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';

import {
	buildDocumentationTemplateExportBasename,
	buildDocumentationTemplateExportPayload,
	parseDocumentationTemplateImport,
} from './DocumentationTemplateTransfer';
import { downloadJsonAs } from '../../../lib/download';

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
	const createTemplate = useEndpoint('POST', '/v1/medsense/documentation.templates.create');
	const removeTemplate = useEndpoint('POST', '/v1/medsense/documentation.templates.remove');
	const dispatchToast = useToastMessageDispatch();
	const importInputRef = useRef<HTMLInputElement | null>(null);
	const [importing, setImporting] = useState(false);
	const [removingTemplateId, setRemovingTemplateId] = useState<string | null>(null);

	const { data, isLoading, refetch } = useQuery({
		queryKey: ['medsense', 'documentation-templates'],
		queryFn: async () => {
			const response = await getTemplates();
			return response.templates || [];
		},
	});

	const handleExport = (template: any) => {
		downloadJsonAs(buildDocumentationTemplateExportPayload(template), buildDocumentationTemplateExportBasename(template));
		dispatchToast({ type: 'success', message: 'Template export downloaded' });
	};

	const handleImportClick = () => {
		importInputRef.current?.click();
	};

	const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';

		if (!file) {
			return;
		}

		setImporting(true);
		try {
			const rawContent = await file.text();
			const importedTemplate = parseDocumentationTemplateImport(JSON.parse(rawContent));
			await createTemplate(importedTemplate as any);
			dispatchToast({ type: 'success', message: `Imported template ${importedTemplate.key}` });
			await refetch();
		} catch (error: any) {
			dispatchToast({ type: 'error', message: error?.message || String(error) });
		} finally {
			setImporting(false);
		}
	};

	const handleRemove = async (template: any) => {
		const templateLabel = template.label || template.key || 'this template';
		if (!window.confirm(`Remove ${templateLabel}? This cannot be undone.`)) {
			return;
		}

		setRemovingTemplateId(template._id);
		try {
			await removeTemplate({ templateId: template._id });
			dispatchToast({ type: 'success', message: `Removed template ${template.key}` });
			await refetch();
		} catch (error: any) {
			dispatchToast({ type: 'error', message: error?.message || String(error) });
		} finally {
			setRemovingTemplateId(null);
		}
	};

	return (
		<Box p='x24' display='flex' flexDirection='column' maxWidth='x900' w='full'>
			<Box mb='x16' display='flex' justifyContent='flex-end' flexWrap='wrap'>
				<input type='file' accept='application/json,.json' ref={importInputRef} style={{ display: 'none' }} onChange={handleImportChange} />
				<Button onClick={handleImportClick} disabled={importing} loading={importing} mie='x8'>
					Import JSON
				</Button>
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
									Intervention Types:{' '}
									{Array.isArray(template.interventionTypes) && template.interventionTypes.length
										? template.interventionTypes.join(', ')
										: 'All'}
								</Box>
								<Box fontScale='c1' color='hint'>
									Version: v{template.version || 1} | Status: {statusLabel(String(template.status || 'draft'))}
								</Box>
							</Box>
							<Box display='flex' alignItems='center'>
								<Button small onClick={() => handleExport(template)} disabled={removingTemplateId === template._id} mie='x8'>
									Export
								</Button>
								<Button small onClick={() => onEdit(template._id)} disabled={removingTemplateId === template._id} mie='x8'>
									Edit
								</Button>
								<Button
									small
									danger
									onClick={() => handleRemove(template)}
									disabled={Boolean(removingTemplateId) && removingTemplateId !== template._id}
									loading={removingTemplateId === template._id}
								>
									Remove
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
