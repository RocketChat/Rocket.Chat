import type { IMedsenseDocumentationTemplate, IMedsenseIntervention, ITemplateField, ITemplateSection } from '@rocket.chat/core-typings';
import { Box, Button, Field, FieldGroup, FieldLabel, FieldRow, Select, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { buildDocumentationTemplateExportBasename, buildDocumentationTemplateExportPayload } from './DocumentationTemplateTransfer';
import { downloadJsonAs } from '../../../lib/download';
import { buildInterventionDocumentationPdfUrl } from '../../medsense/queue/InterventionDocumentationPdf';

const SECTION_TYPE_OPTIONS: [string, string][] = [
	['patient_info', 'Patient Info'],
	['questionnaire', 'Questionnaire'],
	['assessment', 'Assessment'],
	['attestations', 'Attestations'],
	['action_taken', 'Action Taken'],
	['provider_communication', 'Provider Communication'],
	['prescriptions', 'Prescriptions'],
	['counselling', 'Counselling'],
	['follow_up', 'Follow-up'],
	['signatures', 'Signatures'],
];

const FIELD_TYPE_OPTIONS: [string, string][] = [
	['text', 'Text'],
	['textarea', 'Textarea'],
	['date', 'Date'],
	['number', 'Number'],
	['select', 'Select'],
	['drug', 'Drug Dropdown'],
	['boolean', 'Yes / No'],
	['repeater', 'Repeatable Rows'],
];

const REPEATER_CHILD_FIELD_TYPE_OPTIONS = FIELD_TYPE_OPTIONS.filter(([value]) => value !== 'repeater') as [string, string][];

const buildDefaultSection = (index: number): ITemplateSection => ({
	key: `section_${index + 1}`,
	title: 'New Section',
	type: 'assessment',
	sortOrder: index,
	visibleInPdf: true,
	fields: [],
});

const buildDefaultField = (index: number): ITemplateField => ({
	key: `field_${index + 1}`,
	label: 'New Field',
	type: 'text',
	required: false,
	visibleInPdf: true,
	sortOrder: index,
});

const normalizeFields = (fields: ITemplateField[]): ITemplateField[] =>
	fields.map((field, fieldIndex) => ({
		...field,
		sortOrder: fieldIndex,
		fields: field.type === 'repeater' && Array.isArray(field.fields) ? normalizeFields(field.fields) : field.fields,
	}));

const normalizeSections = (sections: ITemplateSection[]): ITemplateSection[] =>
	sections.map((section, sectionIndex) => ({
		...section,
		sortOrder: sectionIndex,
		fields: normalizeFields(section.fields || []),
	}));

const CheckboxRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
	<Box is='label' display='flex' alignItems='center' mb='x8'>
		<Box is='input' type='checkbox' checked={checked} onChange={(event: any) => onChange(Boolean(event.currentTarget.checked))} mie='x8' />
		<Box>{label}</Box>
	</Box>
);

const buildPreviewValueForField = (field: ITemplateField) => {
	if (field.type === 'date') {
		return new Date().toISOString().slice(0, 10);
	}
	if (field.type === 'number') {
		return 1;
	}
	if (field.type === 'select') {
		return field.options?.[0] || '';
	}
	if (field.type === 'drug') {
		return field.options?.[0] || 'Sample Drug';
	}
	if (field.type === 'repeater') {
		const childFields = field.fields || [];
		if (!childFields.length) {
			return [];
		}

		return [
			Object.fromEntries(childFields.map((childField) => [childField.key, buildPreviewValueForField(childField)])),
			Object.fromEntries(childFields.map((childField) => [childField.key, `Additional ${childField.label}`])),
		];
	}
	if (field.type === 'boolean' || field.type === 'checkbox') {
		return 'Yes';
	}
	return field.label ? `Sample: ${field.label}` : 'Sample value';
};

const buildPreviewArtifacts = (template: Partial<IMedsenseDocumentationTemplate>) => {
	const resolvedTemplate = {
		key: template.key || 'preview_template',
		label: template.label || 'Documentation Preview',
		description: template.description || '',
		status: template.status || 'draft',
		version: template.version || 1,
		interventionTypes: template.interventionTypes || [],
		specialtyActionIds: template.specialtyActionIds || [],
		pdfConfig: {
			documentTitle: template.pdfConfig?.documentTitle || template.label || 'Documentation Preview',
			showTemplateVersion: Boolean(template.pdfConfig?.showTemplateVersion),
		},
		signatureRules: {
			requirePharmacistSignature: Boolean(template.signatureRules?.requirePharmacistSignature),
			allowPatientSignature: Boolean(template.signatureRules?.allowPatientSignature),
			requirePatientSignature: Boolean(template.signatureRules?.requirePatientSignature),
		},
		sections: normalizeSections((template.sections || []) as ITemplateSection[]),
	} as IMedsenseDocumentationTemplate;

	const documentationValues: Record<string, any> = {
		patient_name: 'Preview Patient',
	};
	const followUp: Record<string, any> = {};
	const prescriptionSection = resolvedTemplate.sections.find((section) => section.type === 'prescriptions');
	const prescriptions = prescriptionSection?.fields?.length
		? [Object.fromEntries(prescriptionSection.fields.map((field) => [field.key, buildPreviewValueForField(field)]))]
		: [];

	resolvedTemplate.sections.forEach((section) => {
		if (section.type === 'prescriptions' || section.type === 'signatures') {
			return;
		}

		(section.fields || []).forEach((field) => {
			const value = buildPreviewValueForField(field);
			if (section.type === 'follow_up') {
				followUp[field.key] = value;
				return;
			}
			documentationValues[field.key] = value;
		});
	});

	const previewIntervention = {
		_id: 'preview',
		patientUserId: 'preview-patient',
		createdAt: new Date(),
		documentationStatus: 'draft',
		documentationValues,
		prescriptions,
		followUp,
		finalizedBy: { username: 'preview-pharmacist' },
		signatures: {},
	} as IMedsenseIntervention;

	return { resolvedTemplate, previewIntervention };
};

const DocumentationTemplateEditor = ({ templateId, onBack }: { templateId: string | null; onBack: () => void }) => {
	const dispatchToast = useToastMessageDispatch();
	const getTemplate = useEndpoint('GET', '/v1/medsense/documentation.templates.info');
	const createTemplate = useEndpoint('POST', '/v1/medsense/documentation.templates.create');
	const updateTemplate = useEndpoint('POST', '/v1/medsense/documentation.templates.update');
	const activateTemplate = useEndpoint('POST', '/v1/medsense/documentation.templates.activate');
	const getDrugCatalog = useEndpoint('GET', '/v1/medsense/drug-catalog.list');
	const getInterventionTypes = useEndpoint('GET', '/v1/medsense/intervention-types.list');

	const [loading, setLoading] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [drugSearch, setDrugSearch] = useState('');
	const [formData, setFormData] = useState<Partial<IMedsenseDocumentationTemplate>>({
		key: '',
		label: '',
		description: '',
		interventionTypes: [],
		specialtyActionIds: [],
		sections: [],
		signatureRules: { requirePharmacistSignature: true, allowPatientSignature: false, requirePatientSignature: false },
		pdfConfig: { documentTitle: '', showTemplateVersion: false },
	});

	const { data: initialData, isLoading: fetching } = useQuery({
		queryKey: ['medsense', 'documentation-template', templateId],
		queryFn: async () => {
			if (!templateId) {
				return null;
			}

			const result = await getTemplate({ templateId });
			return result.template;
		},
		enabled: Boolean(templateId),
	});

	const { data: drugCatalogData } = useQuery({
		queryKey: ['medsense', 'drug-catalog', drugSearch],
		queryFn: async () => getDrugCatalog({ text: drugSearch, limit: 40 }),
	});
	const { data: interventionTypesData } = useQuery({
		queryKey: ['medsense', 'intervention-types'],
		queryFn: async () => getInterventionTypes(),
	});

	useEffect(() => {
		if (initialData) {
			setFormData(initialData);
		}
	}, [initialData]);

	useEffect(
		() => () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		},
		[previewUrl],
	);

	useEffect(() => {
		if (!previewOpen || !previewLoading) {
			return;
		}

		let cancelled = false;

		const generatePreview = async () => {
			try {
				const { resolvedTemplate, previewIntervention } = buildPreviewArtifacts(formData);
				const url = await buildInterventionDocumentationPdfUrl(previewIntervention, resolvedTemplate);
				if (cancelled) {
					URL.revokeObjectURL(url);
					return;
				}
				setPreviewUrl(url);
			} catch (error: any) {
				if (!cancelled) {
					setPreviewError(error?.message || String(error));
					dispatchToast({ type: 'error', message: error?.message || String(error) });
				}
			} finally {
				if (!cancelled) {
					setPreviewLoading(false);
				}
			}
		};

		void generatePreview();

		return () => {
			cancelled = true;
		};
	}, [dispatchToast, formData, previewLoading, previewOpen]);

	const handleChange = (field: string, value: any) => {
		setFormData((current) => ({ ...current, [field]: value }));
	};

	const handleInterventionTypesChange = (value: string) => {
		handleChange(
			'interventionTypes',
			value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean),
		);
	};

	const toggleInterventionType = (value: string, checked: boolean) => {
		const currentValues = Array.isArray(formData.interventionTypes) ? [...formData.interventionTypes] : [];
		const nextValues = checked ? Array.from(new Set([...currentValues, value])) : currentValues.filter((item) => item !== value);
		handleChange('interventionTypes', nextValues);
	};

	const handleActionIdsChange = (value: string) => {
		handleChange(
			'specialtyActionIds',
			value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean),
		);
	};

	const updateSections = (updater: (sections: ITemplateSection[]) => ITemplateSection[]) => {
		setFormData((current) => ({
			...current,
			sections: normalizeSections(updater((current.sections || []) as ITemplateSection[])),
		}));
	};

	const addSection = () => updateSections((sections) => [...sections, buildDefaultSection(sections.length)]);
	const updateSection = (sectionIndex: number, update: Partial<ITemplateSection>) => {
		updateSections((sections) => sections.map((section, index) => (index === sectionIndex ? { ...section, ...update } : section)));
	};
	const removeSection = (sectionIndex: number) => updateSections((sections) => sections.filter((_, index) => index !== sectionIndex));
	const addField = (sectionIndex: number) => {
		updateSections((sections) =>
			sections.map((section, index) =>
				index === sectionIndex
					? { ...section, fields: [...(section.fields || []), buildDefaultField((section.fields || []).length)] }
					: section,
			),
		);
	};
	const updateField = (sectionIndex: number, fieldIndex: number, update: Partial<ITemplateField>) => {
		updateSections((sections) =>
			sections.map((section, index) =>
				index === sectionIndex
					? {
							...section,
							fields: (section.fields || []).map((field, currentIndex) => (currentIndex === fieldIndex ? { ...field, ...update } : field)),
						}
					: section,
			),
		);
	};
	const addRepeaterChildField = (sectionIndex: number, fieldIndex: number) => {
		updateSections((sections) =>
			sections.map((section, index) =>
				index === sectionIndex
					? {
							...section,
							fields: (section.fields || []).map((field, currentIndex) =>
								currentIndex === fieldIndex
									? { ...field, fields: [...(field.fields || []), buildDefaultField((field.fields || []).length)] }
									: field,
							),
						}
					: section,
			),
		);
	};
	const updateRepeaterChildField = (sectionIndex: number, fieldIndex: number, childFieldIndex: number, update: Partial<ITemplateField>) => {
		updateSections((sections) =>
			sections.map((section, index) =>
				index === sectionIndex
					? {
							...section,
							fields: (section.fields || []).map((field, currentIndex) =>
								currentIndex === fieldIndex
									? {
											...field,
											fields: (field.fields || []).map((childField, currentChildIndex) =>
												currentChildIndex === childFieldIndex ? { ...childField, ...update } : childField,
											),
										}
									: field,
							),
						}
					: section,
			),
		);
	};
	const removeRepeaterChildField = (sectionIndex: number, fieldIndex: number, childFieldIndex: number) => {
		updateSections((sections) =>
			sections.map((section, index) =>
				index === sectionIndex
					? {
							...section,
							fields: (section.fields || []).map((field, currentIndex) =>
								currentIndex === fieldIndex
									? { ...field, fields: (field.fields || []).filter((_, currentChildIndex) => currentChildIndex !== childFieldIndex) }
									: field,
							),
						}
					: section,
			),
		);
	};
	const toggleDrugSelection = (sectionIndex: number, fieldIndex: number, code: string, displayName: string) => {
		const section = sections[sectionIndex];
		const field = section?.fields?.[fieldIndex] as (ITemplateField & { drugCatalogCodes?: string[] }) | undefined;
		if (!field) {
			return;
		}

		const currentCodes = Array.isArray(field.drugCatalogCodes) ? [...field.drugCatalogCodes] : [];
		const currentLabels = Array.isArray(field.options) ? [...field.options] : [];
		const existingIndex = currentCodes.indexOf(code);

		if (existingIndex >= 0) {
			currentCodes.splice(existingIndex, 1);
			currentLabels.splice(existingIndex, 1);
		} else {
			currentCodes.push(code);
			currentLabels.push(displayName);
		}

		updateField(sectionIndex, fieldIndex, {
			drugCatalogCodes: currentCodes,
			options: currentLabels,
		} as Partial<ITemplateField>);
	};
	const removeField = (sectionIndex: number, fieldIndex: number) => {
		updateSections((sections) =>
			sections.map((section, index) =>
				index === sectionIndex
					? {
							...section,
							fields: (section.fields || []).filter((_, currentIndex) => currentIndex !== fieldIndex),
						}
					: section,
			),
		);
	};

	const handleSave = async () => {
		setLoading(true);
		try {
			if (templateId) {
				await updateTemplate({ templateId, updateData: formData });
				dispatchToast({ type: 'success', message: 'Template updated successfully' });
			} else {
				await createTemplate(formData as any);
				dispatchToast({ type: 'success', message: 'Template created successfully' });
				onBack();
			}
		} catch (error: any) {
			dispatchToast({ type: 'error', message: error?.message || String(error) });
		} finally {
			setLoading(false);
		}
	};

	const handleActivate = async () => {
		if (!templateId) {
			return;
		}

		setLoading(true);
		try {
			await activateTemplate({ templateId });
			dispatchToast({ type: 'success', message: 'Template activated' });
			onBack();
		} catch (error: any) {
			dispatchToast({ type: 'error', message: error?.message || String(error) });
		} finally {
			setLoading(false);
		}
	};

	const handlePreview = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewOpen(true);
		setPreviewLoading(true);
		setPreviewError(null);
		setPreviewUrl(null);
	};

	const handleClosePreview = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewOpen(false);
		setPreviewUrl(null);
		setPreviewError(null);
	};

	const handleExport = () => {
		downloadJsonAs(buildDocumentationTemplateExportPayload(formData), buildDocumentationTemplateExportBasename(formData));
		dispatchToast({ type: 'success', message: 'Template export downloaded' });
	};

	if (fetching) {
		return <Box p='x24'>Loading template...</Box>;
	}

	const sections = (formData.sections || []) as ITemplateSection[];
	const drugCatalog = Array.isArray((drugCatalogData as any)?.drugs) ? (drugCatalogData as any).drugs : [];

	return (
		<Box p='x24' display='flex' flexDirection='column' maxWidth='x900' w='full'>
			<Box mb='x24' display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap'>
				<Button onClick={onBack}>Back to List</Button>
				<Box display='flex'>
					<Button onClick={handleExport} disabled={loading || previewLoading} mie='x8'>
						Export JSON
					</Button>
					<Button onClick={handlePreview} disabled={loading || previewLoading} loading={previewLoading} mie='x8'>
						Preview PDF
					</Button>
					<Button primary onClick={handleSave} disabled={loading} loading={loading} mie='x8'>
						Save
					</Button>
					{templateId && formData.status !== 'active' && (
						<Button onClick={handleActivate} disabled={loading} loading={loading}>
							Activate
						</Button>
					)}
				</Box>
			</Box>

			<Box mb='x24' p='x16' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
				<Box fontScale='p2m' mbe='x12'>
					Template Basics
				</Box>
				<Box fontScale='c1' color='hint' mbe='x16'>
					Supported field shapes include repeatable row groups for medication lists, goals, resources, and other variable-length answers.
				</Box>
				<FieldGroup>
					<Field>
						<FieldLabel>Template Key</FieldLabel>
						<FieldRow>
							<TextInput
								disabled={Boolean(templateId)}
								value={formData.key || ''}
								onChange={(event: any) => handleChange('key', event.currentTarget.value)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldRow>
							<TextInput value={formData.label || ''} onChange={(event: any) => handleChange('label', event.currentTarget.value)} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>Description</FieldLabel>
						<FieldRow>
							<TextAreaInput
								value={formData.description || ''}
								onChange={(event: any) => handleChange('description', event.currentTarget.value)}
								rows={3}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>Intervention Types</FieldLabel>
						<Box display='flex' flexDirection='column'>
							{Array.isArray(interventionTypesData?.interventionTypes) && interventionTypesData.interventionTypes.length > 0 ? (
								interventionTypesData.interventionTypes.map((item: any) => (
									<CheckboxRow
										key={String(item.value)}
										label={`${item.label} (${item.value})`}
										checked={Boolean(formData.interventionTypes?.includes(String(item.value)))}
										onChange={(checked) => toggleInterventionType(String(item.value), checked)}
									/>
								))
							) : (
								<FieldRow>
									<TextInput
										value={formData.interventionTypes?.join(', ') || ''}
										onChange={(event: any) => handleInterventionTypesChange(event.currentTarget.value)}
										placeholder='uti, counseling, medication_review'
									/>
								</FieldRow>
							)}
						</Box>
					</Field>
					<Field>
						<FieldLabel>Specialty Action IDs</FieldLabel>
						<FieldRow>
							<TextInput
								value={formData.specialtyActionIds?.join(', ') || ''}
								onChange={(event: any) => handleActionIdsChange(event.currentTarget.value)}
								placeholder='medessist:uti'
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Box>

			<Box mb='x24' p='x16' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
				<Box fontScale='p2m' mbe='x12'>
					PDF Configuration
				</Box>
				<FieldGroup>
					<Field>
						<FieldLabel>Document Title</FieldLabel>
						<FieldRow>
							<TextInput
								value={formData.pdfConfig?.documentTitle || ''}
								onChange={(event: any) => handleChange('pdfConfig', { ...formData.pdfConfig, documentTitle: event.currentTarget.value })}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
				<CheckboxRow
					label='Show Template Version'
					checked={Boolean(formData.pdfConfig?.showTemplateVersion)}
					onChange={(checked) => handleChange('pdfConfig', { ...formData.pdfConfig, showTemplateVersion: checked })}
				/>
			</Box>

			<Box mb='x24' p='x16' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
				<Box fontScale='p2m' mbe='x12'>
					Signature Rules
				</Box>
				<CheckboxRow
					label='Require Pharmacist Signature'
					checked={Boolean(formData.signatureRules?.requirePharmacistSignature)}
					onChange={(checked) => handleChange('signatureRules', { ...formData.signatureRules, requirePharmacistSignature: checked })}
				/>
				<CheckboxRow
					label='Allow Patient Signature'
					checked={Boolean(formData.signatureRules?.allowPatientSignature)}
					onChange={(checked) => handleChange('signatureRules', { ...formData.signatureRules, allowPatientSignature: checked })}
				/>
				<CheckboxRow
					label='Require Patient Signature'
					checked={Boolean(formData.signatureRules?.requirePatientSignature)}
					onChange={(checked) => handleChange('signatureRules', { ...formData.signatureRules, requirePatientSignature: checked })}
				/>
			</Box>

			<Box p='x16' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
				<Box display='flex' justifyContent='space-between' alignItems='center' mb='x16'>
					<Box fontScale='p2m'>Template Sections</Box>
					<Button small onClick={addSection}>
						Add Section
					</Button>
				</Box>

				{sections.map((section, sectionIndex) => (
					<Box key={`${section.key}-${sectionIndex}`} mb='x16' p='x12' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
						<Box display='flex' justifyContent='space-between' alignItems='center' mb='x8'>
							<Box fontScale='p2m'>Section {sectionIndex + 1}</Box>
							<Button small danger onClick={() => removeSection(sectionIndex)}>
								Remove Section
							</Button>
						</Box>

						<FieldGroup>
							<Field>
								<FieldLabel>Section Key</FieldLabel>
								<FieldRow>
									<TextInput
										value={section.key}
										onChange={(event: any) => updateSection(sectionIndex, { key: event.currentTarget.value })}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>Section Title</FieldLabel>
								<FieldRow>
									<TextInput
										value={section.title}
										onChange={(event: any) => updateSection(sectionIndex, { title: event.currentTarget.value })}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>Section Type</FieldLabel>
								<FieldRow>
									<Select
										options={SECTION_TYPE_OPTIONS}
										value={section.type}
										onChange={(value) => updateSection(sectionIndex, { type: String(value) as any })}
									/>
								</FieldRow>
							</Field>
						</FieldGroup>

						<CheckboxRow
							label='Visible In PDF'
							checked={section.visibleInPdf !== false}
							onChange={(checked) => updateSection(sectionIndex, { visibleInPdf: checked })}
						/>

						{section.type !== 'signatures' && (
							<>
								<Box display='flex' justifyContent='space-between' alignItems='center' mb='x8' mt='x16'>
									<Box fontScale='p2m'>Fields</Box>
									<Button small onClick={() => addField(sectionIndex)}>
										Add Field
									</Button>
								</Box>

								{(section.fields || []).map((field, fieldIndex) => (
									<Box
										key={`${field.key}-${fieldIndex}`}
										mb='x12'
										p='x12'
										borderWidth='default'
										borderColor='extra-light'
										borderRadius='x4'
									>
										<Box display='flex' justifyContent='space-between' alignItems='center' mb='x8'>
											<Box fontScale='p2m'>Field {fieldIndex + 1}</Box>
											<Button small danger onClick={() => removeField(sectionIndex, fieldIndex)}>
												Remove Field
											</Button>
										</Box>

										<FieldGroup>
											<Field>
												<FieldLabel>Field Key</FieldLabel>
												<FieldRow>
													<TextInput
														value={field.key}
														onChange={(event: any) => updateField(sectionIndex, fieldIndex, { key: event.currentTarget.value })}
													/>
												</FieldRow>
											</Field>
											<Field>
												<FieldLabel>Field Label</FieldLabel>
												<FieldRow>
													<TextInput
														value={field.label}
														onChange={(event: any) => updateField(sectionIndex, fieldIndex, { label: event.currentTarget.value })}
													/>
												</FieldRow>
											</Field>
											<Field>
												<FieldLabel>Field Type</FieldLabel>
												<FieldRow>
													<Select
														options={FIELD_TYPE_OPTIONS}
														value={field.type}
														onChange={(value) => updateField(sectionIndex, fieldIndex, { type: String(value) as any })}
													/>
												</FieldRow>
											</Field>
											<Field>
												<FieldLabel>Source Key</FieldLabel>
												<FieldRow>
													<TextInput
														value={field.sourceKey || ''}
														onChange={(event: any) => updateField(sectionIndex, fieldIndex, { sourceKey: event.currentTarget.value })}
														placeholder='patient.name or request.aiSummary'
													/>
												</FieldRow>
											</Field>
											{field.type === 'select' && (
												<Field>
													<FieldLabel>Options</FieldLabel>
													<FieldRow>
														<TextInput
															value={field.options?.join(', ') || ''}
															onChange={(event: any) =>
																updateField(sectionIndex, fieldIndex, {
																	options: event.currentTarget.value
																		.split(',')
																		.map((item: string) => item.trim())
																		.filter(Boolean),
																})
															}
														/>
													</FieldRow>
												</Field>
											)}
											{field.type === 'drug' && (
												<Field>
													<FieldLabel>Allowed Drugs</FieldLabel>
													<FieldRow>
														<Box display='flex' flexDirection='column' w='full'>
															<TextInput
																value={drugSearch}
																onChange={(event: any) => setDrugSearch(event.currentTarget.value)}
																placeholder='Search imported CCDD drug catalog'
															/>
															<Box fontScale='c1' color='hint' mbs='x8' mbe='x8'>
																Selected drugs:{' '}
																{Array.isArray((field as any).drugCatalogCodes) ? (field as any).drugCatalogCodes.length : 0}
															</Box>
															<Box maxHeight='180px' overflowY='auto' borderWidth='default' borderColor='extra-light' p='x8'>
																{drugCatalog.map((drug: any) => {
																	const checked =
																		Array.isArray((field as any).drugCatalogCodes) && (field as any).drugCatalogCodes.includes(drug.code);
																	return (
																		<Box key={drug.code} display='flex' alignItems='center' mb='x4'>
																			<Box is='label' display='flex' alignItems='center'>
																				<Box
																					is='input'
																					type='checkbox'
																					checked={checked}
																					onChange={() => toggleDrugSelection(sectionIndex, fieldIndex, drug.code, drug.displayName)}
																					mie='x8'
																				/>
																				<Box display='flex' flexDirection='column'>
																					<Box fontScale='p2'>{drug.displayName}</Box>
																					<Box fontScale='c1' color='hint'>
																						{drug.code}
																					</Box>
																				</Box>
																			</Box>
																		</Box>
																	);
																})}
																{!drugCatalog.length && <Box fontScale='c1'>No imported drugs found for this search.</Box>}
															</Box>
														</Box>
													</FieldRow>
												</Field>
											)}
											{field.type === 'repeater' && (
												<Box w='full'>
													<Box display='flex' justifyContent='space-between' alignItems='center' mb='x8'>
														<Box fontScale='p2m'>Repeater Columns</Box>
														<Button small onClick={() => addRepeaterChildField(sectionIndex, fieldIndex)}>
															Add Column
														</Button>
													</Box>
													<Box fontScale='c1' color='hint' mbe='x12'>
														Rows will be added dynamically in documentation review and PDF output.
													</Box>
													{(field.fields || []).map((childField, childFieldIndex) => (
														<Box
															key={`${childField.key}-${childFieldIndex}`}
															mb='x12'
															p='x12'
															borderWidth='default'
															borderColor='extra-light'
															borderRadius='x4'
														>
															<Box display='flex' justifyContent='space-between' alignItems='center' mb='x8'>
																<Box fontScale='p2m'>Column {childFieldIndex + 1}</Box>
																<Button small danger onClick={() => removeRepeaterChildField(sectionIndex, fieldIndex, childFieldIndex)}>
																	Remove Column
																</Button>
															</Box>
															<FieldGroup>
																<Field>
																	<FieldLabel>Column Key</FieldLabel>
																	<FieldRow>
																		<TextInput
																			value={childField.key}
																			onChange={(event: any) =>
																				updateRepeaterChildField(sectionIndex, fieldIndex, childFieldIndex, {
																					key: event.currentTarget.value,
																				})
																			}
																		/>
																	</FieldRow>
																</Field>
																<Field>
																	<FieldLabel>Column Label</FieldLabel>
																	<FieldRow>
																		<TextInput
																			value={childField.label}
																			onChange={(event: any) =>
																				updateRepeaterChildField(sectionIndex, fieldIndex, childFieldIndex, {
																					label: event.currentTarget.value,
																				})
																			}
																		/>
																	</FieldRow>
																</Field>
																<Field>
																	<FieldLabel>Column Type</FieldLabel>
																	<FieldRow>
																		<Select
																			options={REPEATER_CHILD_FIELD_TYPE_OPTIONS}
																			value={childField.type}
																			onChange={(value) =>
																				updateRepeaterChildField(sectionIndex, fieldIndex, childFieldIndex, { type: String(value) as any })
																			}
																		/>
																	</FieldRow>
																</Field>
																{childField.type === 'select' && (
																	<Field>
																		<FieldLabel>Options</FieldLabel>
																		<FieldRow>
																			<TextInput
																				value={childField.options?.join(', ') || ''}
																				onChange={(event: any) =>
																					updateRepeaterChildField(sectionIndex, fieldIndex, childFieldIndex, {
																						options: event.currentTarget.value
																							.split(',')
																							.map((item: string) => item.trim())
																							.filter(Boolean),
																					})
																				}
																			/>
																		</FieldRow>
																	</Field>
																)}
															</FieldGroup>
															<CheckboxRow
																label='Required'
																checked={Boolean(childField.required)}
																onChange={(checked) =>
																	updateRepeaterChildField(sectionIndex, fieldIndex, childFieldIndex, { required: checked })
																}
															/>
															<CheckboxRow
																label='Visible In PDF'
																checked={childField.visibleInPdf !== false}
																onChange={(checked) =>
																	updateRepeaterChildField(sectionIndex, fieldIndex, childFieldIndex, { visibleInPdf: checked })
																}
															/>
														</Box>
													))}
												</Box>
											)}
										</FieldGroup>

										<CheckboxRow
											label='Required'
											checked={Boolean(field.required)}
											onChange={(checked) => updateField(sectionIndex, fieldIndex, { required: checked })}
										/>
										<CheckboxRow
											label='Visible In PDF'
											checked={field.visibleInPdf !== false}
											onChange={(checked) => updateField(sectionIndex, fieldIndex, { visibleInPdf: checked })}
										/>
										<CheckboxRow
											label='Allow Prefill'
											checked={Boolean(field.aiPrefill)}
											onChange={(checked) => updateField(sectionIndex, fieldIndex, { aiPrefill: checked })}
										/>
									</Box>
								))}
							</>
						)}
					</Box>
				))}
			</Box>

			{previewOpen &&
				createPortal(
					<div
						style={{
							position: 'fixed',
							inset: 0,
							backgroundColor: 'rgba(17, 24, 39, 0.6)',
							zIndex: 100000,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '12px',
						}}
					>
						<div
							style={{
								background: 'var(--rcx-color-surface-light, #fff)',
								width: 'calc(100vw - 24px)',
								height: 'calc(100vh - 24px)',
								maxWidth: '1400px',
								maxHeight: '1000px',
								borderRadius: '8px',
								display: 'flex',
								flexDirection: 'column',
								overflow: 'hidden',
								boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '16px 20px',
									borderBottom: '1px solid var(--rcx-color-stroke-extra-light, #e5e7eb)',
								}}
							>
								<div style={{ fontWeight: 600 }}>Template PDF Preview</div>
								<div style={{ display: 'flex', gap: '8px' }}>
									{previewUrl && (
										<Button small onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>
											Open in New Tab
										</Button>
									)}
									<Button small onClick={handleClosePreview}>
										Close
									</Button>
								</div>
							</div>
							<div style={{ flex: 1, background: 'var(--rcx-color-surface-tint, #f8fafc)' }}>
								{previewLoading && <Box p='x16'>Generating preview...</Box>}
								{!previewLoading && previewError && (
									<Box p='x16' color='danger'>
										Unable to generate preview: {previewError}
									</Box>
								)}
								{!previewLoading && !previewError && previewUrl && (
									<object data={previewUrl} type='application/pdf' width='100%' height='100%' style={{ display: 'block' }}>
										<embed src={previewUrl} type='application/pdf' width='100%' height='100%' style={{ display: 'block' }} />
									</object>
								)}
							</div>
						</div>
					</div>,
					document.body,
				)}
		</Box>
	);
};

export default DocumentationTemplateEditor;
