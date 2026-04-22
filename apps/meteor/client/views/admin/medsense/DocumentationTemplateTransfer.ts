import type { IMedsenseDocumentationTemplate, ITemplateField, ITemplateSection } from '@rocket.chat/core-typings';

export const DOCUMENTATION_TEMPLATE_EXPORT_FORMAT = 'medsense.documentation-template';
export const DOCUMENTATION_TEMPLATE_EXPORT_VERSION = 1;

type TemplateTransferData = Pick<
	IMedsenseDocumentationTemplate,
	'key' | 'label' | 'interventionTypes' | 'specialtyActionIds' | 'sections' | 'signatureRules' | 'pdfConfig'
> & {
	description?: string;
};

export type DocumentationTemplateExportPayload = {
	format: typeof DOCUMENTATION_TEMPLATE_EXPORT_FORMAT;
	formatVersion: typeof DOCUMENTATION_TEMPLATE_EXPORT_VERSION;
	exportedAt: string;
	template: TemplateTransferData;
};

const isRecord = (value: unknown): value is Record<string, any> => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const normalizeStringArray = (value: unknown): string[] =>
	Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];

const normalizeField = (field: Partial<ITemplateField>, index: number): ITemplateField => {
	const childFields = Array.isArray(field.fields)
		? field.fields.map((childField, childIndex) => normalizeField(childField, childIndex))
		: undefined;

	return {
		key: typeof field.key === 'string' ? field.key.trim() : '',
		label: typeof field.label === 'string' ? field.label.trim() : '',
		type: field.type || 'text',
		required: Boolean(field.required),
		helpText: typeof field.helpText === 'string' ? field.helpText.trim() : undefined,
		pdfTitle: typeof field.pdfTitle === 'string' ? field.pdfTitle.trim() : undefined,
		visibleInPdf: field.visibleInPdf !== false,
		aiPrefill: typeof field.aiPrefill === 'boolean' ? field.aiPrefill : undefined,
		prefillConfidenceThreshold:
			typeof field.prefillConfidenceThreshold === 'number' && Number.isFinite(field.prefillConfidenceThreshold)
				? field.prefillConfidenceThreshold
				: undefined,
		sourceKey: typeof field.sourceKey === 'string' ? field.sourceKey.trim() : undefined,
		options: normalizeStringArray(field.options),
		drugCatalogCodes: normalizeStringArray(field.drugCatalogCodes),
		fields: field.type === 'repeater' ? childFields || [] : undefined,
		defaultValue: field.defaultValue,
		sortOrder: index,
	};
};

const normalizeSection = (section: Partial<ITemplateSection>, index: number): ITemplateSection => ({
	key: typeof section.key === 'string' ? section.key.trim() : '',
	title: typeof section.title === 'string' ? section.title.trim() : '',
	type: section.type || 'assessment',
	sortOrder: index,
	pdfTitle: typeof section.pdfTitle === 'string' ? section.pdfTitle.trim() : undefined,
	visibleInPdf: section.visibleInPdf !== false,
	fields: Array.isArray(section.fields) ? section.fields.map((field, fieldIndex) => normalizeField(field, fieldIndex)) : [],
});

export const normalizeDocumentationTemplateForTransfer = (template: Partial<IMedsenseDocumentationTemplate>): TemplateTransferData => ({
	key: typeof template.key === 'string' ? template.key.trim() : '',
	label: typeof template.label === 'string' ? template.label.trim() : '',
	description: typeof template.description === 'string' ? template.description.trim() : undefined,
	interventionTypes: normalizeStringArray(template.interventionTypes),
	specialtyActionIds: normalizeStringArray(template.specialtyActionIds),
	sections: Array.isArray(template.sections) ? template.sections.map((section, index) => normalizeSection(section, index)) : [],
	signatureRules: {
		requirePharmacistSignature: Boolean(template.signatureRules?.requirePharmacistSignature),
		allowPatientSignature: Boolean(template.signatureRules?.allowPatientSignature),
		requirePatientSignature: Boolean(template.signatureRules?.requirePatientSignature),
	},
	pdfConfig: {
		documentTitle: typeof template.pdfConfig?.documentTitle === 'string' ? template.pdfConfig.documentTitle.trim() : '',
		includeQrCode: Boolean(template.pdfConfig?.includeQrCode),
		showTemplateVersion: Boolean(template.pdfConfig?.showTemplateVersion),
		footerText: typeof template.pdfConfig?.footerText === 'string' ? template.pdfConfig.footerText.trim() : undefined,
	},
});

export const buildDocumentationTemplateExportPayload = (
	template: Partial<IMedsenseDocumentationTemplate>,
): DocumentationTemplateExportPayload => ({
	format: DOCUMENTATION_TEMPLATE_EXPORT_FORMAT,
	formatVersion: DOCUMENTATION_TEMPLATE_EXPORT_VERSION,
	exportedAt: new Date().toISOString(),
	template: normalizeDocumentationTemplateForTransfer(template),
});

export const parseDocumentationTemplateImport = (value: unknown): TemplateTransferData => {
	if (!isRecord(value)) {
		throw new Error('Import file must contain a documentation template JSON object');
	}

	const template = value.format === DOCUMENTATION_TEMPLATE_EXPORT_FORMAT && isRecord(value.template) ? value.template : value;
	const normalized = normalizeDocumentationTemplateForTransfer(template as Partial<IMedsenseDocumentationTemplate>);

	if (!normalized.key || !normalized.label) {
		throw new Error('Imported template must include a key and label');
	}

	if (!normalized.interventionTypes.length) {
		throw new Error('Imported template must include at least one intervention type');
	}

	if (!normalized.sections.length) {
		throw new Error('Imported template must include at least one section');
	}

	return normalized;
};

export const buildDocumentationTemplateExportBasename = (template: Partial<IMedsenseDocumentationTemplate>): string => {
	const baseName = template.key || template.label || 'documentation-template';
	const normalizedBaseName = String(baseName)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return `${normalizedBaseName || 'documentation-template'}-template`;
};
