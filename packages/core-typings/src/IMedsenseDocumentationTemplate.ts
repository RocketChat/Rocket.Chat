import type { IRocketChatRecord } from './IRocketChatRecord';

export type TemplateSectionCategory =
    | 'patient_info'
    | 'questionnaire'
    | 'assessment'
    | 'attestations'
    | 'action_taken'
    | 'provider_communication'
    | 'prescriptions'
    | 'counselling'
    | 'follow_up'
    | 'signatures';

export type TemplateFieldType =
    | 'readonly'
    | 'text'
    | 'textarea'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'radio'
    | 'checkbox'
    | 'boolean'
    | 'drug'
    | 'repeater';

export interface ITemplateField {
    key: string;
    label: string;
    type: TemplateFieldType;
    required: boolean;
    helpText?: string;
    pdfTitle?: string;
    visibleInPdf: boolean;
    aiPrefill?: boolean;
    prefillConfidenceThreshold?: number;
    sourceKey?: string;
    options?: string[]; // For select, radio, multiselect
    drugCatalogCodes?: string[];
    fields?: ITemplateField[]; // For repeater items
    defaultValue?: any;
    sortOrder: number;
}

export interface ITemplateSection {
    key: string;
    title: string;
    type: TemplateSectionCategory;
    sortOrder: number;
    pdfTitle?: string;
    visibleInPdf: boolean;
    fields?: ITemplateField[];
}

export interface IMedsenseDocumentationTemplate extends IRocketChatRecord {
    _id: string;
    key: string;
    label: string;
    description?: string;
    status: 'draft' | 'active' | 'inactive';
    interventionTypes?: string[];
    specialtyActionIds: string[];
    version: number;
    sections: ITemplateSection[];
    signatureRules: {
        requirePharmacistSignature: boolean;
        allowPatientSignature: boolean;
        requirePatientSignature: boolean;
    };
    pdfConfig: {
        documentTitle: string;
        includeQrCode?: boolean;
        showTemplateVersion?: boolean;
        footerText?: string;
    };
    createdAt: Date;
    updatedAt?: Date;
    _updatedAt: Date;
}
