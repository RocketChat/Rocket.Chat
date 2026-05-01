import { Button } from '@rocket.chat/fuselage';
import type { IMedsenseDocumentationTemplate, IMedsenseIntervention } from '@rocket.chat/core-typings';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialog,
	ContextualbarHeader,
	ContextualbarTitle,
	Page,
	PageContent,
	PageHeader,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { downloadInterventionDocumentationPdf } from '../queue/InterventionDocumentationPdf';

type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'modified';
type SuggestionTarget = 'documentation' | 'follow_up' | 'prescription';
type Suggestion = {
	fieldKey: string;
	target?: SuggestionTarget;
	rowIndex?: number;
	suggestedValue?: any;
	confidence?: number;
	reviewStatus?: SuggestionStatus;
};
type BundleResponse = {
	intervention: IMedsenseIntervention;
	template: IMedsenseDocumentationTemplate;
	prefill?: { model?: string; fields?: Suggestion[] };
};
type DraftState = {
	documentationValues: Record<string, any>;
	followUp: Record<string, any>;
	prescriptions: Array<Record<string, any>>;
	suggestions: Suggestion[];
};
type TemplateSection = NonNullable<IMedsenseDocumentationTemplate['sections']>[number];
type TemplateField = NonNullable<TemplateSection['fields']>[number];

const css = `
.ms-doc-scroll{height:100%;overflow-y:auto;overflow-x:hidden}.ms-doc-shell{min-height:100%;background:radial-gradient(circle at top left,rgba(70,130,92,.16),transparent 30%),linear-gradient(180deg,#121b20 0%,#18232b 100%);padding:24px}.ms-doc-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;max-width:1180px;margin:0 auto}.ms-doc-main,.ms-doc-side,.ms-doc-signatures{display:flex;flex-direction:column;gap:20px}.ms-doc-card{background:rgba(18,28,33,.92);border:1px solid rgba(255,255,255,.07);border-radius:20px;box-shadow:0 24px 50px rgba(0,0,0,.26)}.ms-doc-pad{padding:20px}.ms-doc-hero{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.ms-doc-eyebrow{color:#8fb498;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}.ms-doc-title{font-size:30px;font-weight:700;color:#f3f7f4;margin:0 0 8px}.ms-doc-subtitle{color:#aac0b1;margin:0;max-width:680px;line-height:1.5}.ms-doc-actions{display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end}.ms-doc-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.ms-doc-pill{border-radius:16px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05)}.ms-doc-pill strong{display:block;color:#f7fbf8;font-size:22px}.ms-doc-pill span{color:#a6b7ad;font-size:12px}.ms-doc-section{padding:18px 20px 20px}.ms-doc-section-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px}.ms-doc-section-title{color:#f7fbf8;font-size:18px;font-weight:700}.ms-doc-fields{display:grid;grid-template-columns:1fr;gap:14px}.ms-doc-field{position:relative;border-radius:18px;padding:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}.ms-doc-field--repeater{grid-column:1/-1}.ms-doc-field.pending{background:linear-gradient(180deg,rgba(40,74,49,.55) 0%,rgba(20,33,25,.92) 100%);border-color:rgba(95,190,117,.72)}.ms-doc-field.accepted,.ms-doc-field.modified{border-color:rgba(131,180,145,.36)}.ms-doc-field.rejected{border-color:rgba(166,142,87,.36)}.ms-doc-field.editing{border-color:rgba(245,200,93,.62)}.ms-doc-field.required-empty{background:linear-gradient(180deg,rgba(104,34,34,.42) 0%,rgba(39,17,20,.92) 100%);border-color:rgba(248,113,113,.86);box-shadow:0 0 0 1px rgba(248,113,113,.18)}.ms-doc-field.required-empty .ms-doc-label{color:#fecaca}.ms-doc-required-message{margin-top:10px;color:#fecaca;font-size:12px;font-weight:700}.ms-doc-label{color:#edf6f0;font-size:14px;font-weight:700;margin-bottom:10px}.ms-doc-value{color:#f9fcfa;font-size:15px;line-height:1.5;min-height:24px;white-space:pre-wrap}.ms-doc-meta{margin-top:10px;font-size:12px;color:#9dc8a8}.ms-doc-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.ms-doc-ghost{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);color:#f5faf7;border-radius:999px;padding:8px 12px;cursor:pointer;font-weight:600}.ms-doc-ghost.accept{background:rgba(74,150,91,.24)}.ms-doc-ghost.reject{background:rgba(184,120,55,.16)}.ms-doc-ghost.modify{background:rgba(102,139,186,.18)}.ms-doc-control input,.ms-doc-control textarea,.ms-doc-control select{width:100%;background:rgba(5,11,14,.52);border:1px solid rgba(255,255,255,.12);border-radius:14px;color:#f7fbf8;padding:12px 14px;font-size:14px}.ms-doc-control input:required:invalid,.ms-doc-control textarea:required:invalid,.ms-doc-control select:required:invalid{border-color:rgba(248,113,113,.9);box-shadow:0 0 0 1px rgba(248,113,113,.22)}.ms-doc-control textarea{min-height:120px;resize:vertical}.ms-doc-table{width:100%;border-collapse:separate;border-spacing:0 12px}.ms-doc-table th{text-align:left;font-size:12px;color:#8eb29c;font-weight:700;padding:0 12px 8px}.ms-doc-table td{vertical-align:top;padding:0 8px}.ms-doc-repeater{display:flex;flex-direction:column;gap:12px}.ms-doc-repeater-tableWrap{overflow-x:auto}.ms-doc-repeater-table{width:100%;border-collapse:collapse}.ms-doc-repeater-table th,.ms-doc-repeater-table td{border:1px solid rgba(255,255,255,.09);padding:10px;vertical-align:top}.ms-doc-repeater-table th{font-size:12px;color:#9fc4ad;text-align:left;background:rgba(255,255,255,.03)}.ms-doc-repeater-table td{min-width:140px}.ms-doc-repeater-empty{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03);color:#8ea39b}.ms-doc-sign{border-radius:16px;border:1px dashed rgba(255,255,255,.16);background:rgba(5,11,14,.42);padding:12px}.ms-doc-sign canvas{width:100%;height:180px;background:#fff;border-radius:12px;display:block;touch-action:none}.ms-doc-muted{color:#8ea39b;font-size:12px}.ms-doc-status{display:inline-flex;align-items:center;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700;background:rgba(255,255,255,.06);color:#eef5f0}.ms-doc-loading-title{font-size:24px;font-weight:700;color:#f3f7f4;margin:0 0 8px}.ms-doc-loading-subtitle{color:#aac0b1;line-height:1.6;margin:0}.ms-doc-disabled{opacity:.58;pointer-events:none;filter:saturate(.82)}@media (max-width:900px){.ms-doc-hero{flex-direction:column}.ms-doc-actions{justify-content:flex-start}.ms-doc-summary{grid-template-columns:1fr}}
`;

const isFilled = (value: any): boolean =>
	value !== undefined &&
	value !== null &&
	(!(typeof value === 'string') || value.trim().length > 0) &&
	(!Array.isArray(value) || value.length > 0) &&
	(!(typeof value === 'object' && !Array.isArray(value)) || Object.keys(value).length > 0);
const displayValue = (value: any): string =>
	value === undefined || value === null || value === ''
		? '—'
		: Array.isArray(value)
			? value.join(', ')
			: typeof value === 'boolean'
				? value
					? 'Yes'
					: 'No'
				: String(value);
const getConditionalValue = (draft: DraftState, fieldKey: string): any =>
	draft.documentationValues[fieldKey] !== undefined ? draft.documentationValues[fieldKey] : draft.followUp[fieldKey];
const conditionValueMatches = (actualValue: any, expectedValue: string, operator: 'equals' | 'includes'): boolean => {
	if (operator === 'equals') {
		return String(actualValue ?? '') === expectedValue;
	}

	if (Array.isArray(actualValue)) {
		return actualValue.some((item) => String(item) === expectedValue);
	}

	if (typeof actualValue === 'string') {
		return actualValue
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean)
			.includes(expectedValue);
	}

	return String(actualValue ?? '') === expectedValue;
};
const isTemplateSectionVisible = (section: TemplateSection, draft: DraftState): boolean => {
	if (!section.visibleWhen) {
		return true;
	}

	const actualValue = getConditionalValue(draft, section.visibleWhen.fieldKey);
	return conditionValueMatches(actualValue, section.visibleWhen.value, section.visibleWhen.operator);
};
const suggestionKey = (suggestion: Pick<Suggestion, 'fieldKey' | 'target' | 'rowIndex'>) =>
	`${suggestion.target || 'documentation'}::${suggestion.fieldKey}::${suggestion.rowIndex ?? -1}`;
const buildDraft = (bundle: BundleResponse): DraftState => ({
	documentationValues: { ...(bundle.intervention.documentationValues || {}) },
	followUp: { ...(bundle.intervention.followUp || {}) },
	prescriptions: Array.isArray(bundle.intervention.prescriptions) ? bundle.intervention.prescriptions.map((row) => ({ ...row })) : [],
	suggestions: Array.isArray(bundle.intervention.documentationPrefill?.fields)
		? bundle.intervention.documentationPrefill.fields.map((field) => ({ ...field }))
		: Array.isArray(bundle.prefill?.fields)
			? bundle.prefill.fields.map((field) => ({ ...field }))
			: [],
});
const cloneFieldValue = (value: any): any =>
	Array.isArray(value)
		? value.map((item) => cloneFieldValue(item))
		: value && typeof value === 'object'
			? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneFieldValue(entry)]))
			: value;
const getRepeaterRows = (value: any): Array<Record<string, any>> =>
	Array.isArray(value) ? value.filter((row) => row && typeof row === 'object') : [];
const hasRepeaterValue = (value: any): boolean =>
	getRepeaterRows(value).some((row) => Object.values(row || {}).some((entry) => isFilled(entry)));
const hasFieldValue = (field: TemplateField, value: any): boolean => (field.type === 'repeater' ? hasRepeaterValue(value) : isFilled(value));
const findSuggestion = (suggestions: Suggestion[], target: SuggestionTarget, fieldKey: string, rowIndex?: number) =>
	suggestions.find(
		(suggestion) =>
			(suggestion.target || 'documentation') === target &&
			suggestion.fieldKey === fieldKey &&
			(target !== 'prescription' || (suggestion.rowIndex ?? 0) === (rowIndex ?? 0)),
	);
const getValue = (draft: DraftState, target: SuggestionTarget, fieldKey: string, rowIndex?: number): any =>
	target === 'follow_up'
		? draft.followUp?.[fieldKey]
		: target === 'prescription'
			? draft.prescriptions?.[rowIndex ?? 0]?.[fieldKey]
			: draft.documentationValues?.[fieldKey];
const setValue = (draft: DraftState, target: SuggestionTarget, fieldKey: string, value: any, rowIndex?: number) => {
	if (target === 'follow_up') {
		if (isFilled(value)) draft.followUp[fieldKey] = cloneFieldValue(value);
		else delete draft.followUp[fieldKey];
		return;
	}
	if (target === 'prescription') {
		const index = rowIndex ?? 0;
		while (draft.prescriptions.length <= index) draft.prescriptions.push({});
		if (isFilled(value)) draft.prescriptions[index][fieldKey] = cloneFieldValue(value);
		else delete draft.prescriptions[index][fieldKey];
		draft.prescriptions = draft.prescriptions.filter((row) => Object.keys(row || {}).length > 0);
		return;
	}
	if (isFilled(value)) draft.documentationValues[fieldKey] = cloneFieldValue(value);
	else delete draft.documentationValues[fieldKey];
};
const roomIdFromSearch = () => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('roomId') || '');

const SignaturePad = ({
	title,
	helperText,
	buttonLabel,
	disabled,
	requireSignerName = false,
	onSubmit,
}: {
	title: string;
	helperText: string;
	buttonLabel: string;
	disabled?: boolean;
	requireSignerName?: boolean;
	onSubmit: (signatureImageData: string, signerName?: string) => Promise<void>;
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [drawing, setDrawing] = useState(false);
	const [hasDrawing, setHasDrawing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [signerName, setSignerName] = useState('');

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ratio = window.devicePixelRatio || 1;
		canvas.width = Math.floor(canvas.offsetWidth * ratio);
		canvas.height = Math.floor(canvas.offsetHeight * ratio);
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.scale(ratio, ratio);
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#1a2b20';
	}, []);

	const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();
		return { x: event.clientX - rect.left, y: event.clientY - rect.top };
	};
	const clear = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		setHasDrawing(false);
	};
	const save = async () => {
		if (!canvasRef.current || !hasDrawing || disabled || saving || (requireSignerName && !signerName.trim())) return;
		setSaving(true);
		try {
			await onSubmit(canvasRef.current.toDataURL('image/png'), signerName.trim() || undefined);
			clear();
			setSignerName('');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='ms-doc-card'>
			<div className='ms-doc-pad'>
				<h3>{title}</h3>
				<p>{helperText}</p>
				{requireSignerName && (
					<div className='ms-doc-control'>
						<input
							value={signerName}
							onChange={(event) => setSignerName(event.currentTarget.value)}
							placeholder='Signer name'
							disabled={disabled || saving}
						/>
					</div>
				)}
				<div className='ms-doc-sign'>
					<canvas
						ref={canvasRef}
						onPointerDown={(event) => {
							if (disabled) return;
							const ctx = canvasRef.current?.getContext('2d');
							if (!ctx) return;
							const nextPoint = point(event);
							ctx.beginPath();
							ctx.moveTo(nextPoint.x, nextPoint.y);
							setDrawing(true);
							setHasDrawing(true);
						}}
						onPointerMove={(event) => {
							if (!drawing || disabled) return;
							const ctx = canvasRef.current?.getContext('2d');
							if (!ctx) return;
							const nextPoint = point(event);
							ctx.lineTo(nextPoint.x, nextPoint.y);
							ctx.stroke();
						}}
						onPointerUp={() => setDrawing(false)}
						onPointerLeave={() => setDrawing(false)}
					/>
				</div>
				<div className='ms-doc-buttons'>
					<button className='ms-doc-ghost' onClick={clear} disabled={disabled || saving}>
						Clear
					</button>
					<button
						className='ms-doc-ghost accept'
						onClick={save}
						disabled={disabled || saving || !hasDrawing || (requireSignerName && !signerName.trim())}
					>
						{saving ? 'Saving…' : buttonLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

type DocumentationReviewScreenProps = {
	embedded?: boolean;
	interventionId?: string;
	roomId?: string;
	onClose?: () => void;
};

export const DocumentationReviewScreen = ({
	embedded = false,
	interventionId: interventionIdProp,
	roomId: roomIdProp,
	onClose,
}: DocumentationReviewScreenProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const routeInterventionId = useRouteParameter('interventionId') as string;
	const interventionId = interventionIdProp || routeInterventionId;
	const roomId = useMemo(() => roomIdProp || roomIdFromSearch(), [roomIdProp]);
	const getInfo = useEndpoint('GET', '/v1/medsense/interventions.documentation.info');
	const prefill = useEndpoint('POST', '/v1/medsense/interventions.documentation.prefill');
	const saveDraft = useEndpoint('POST', '/v1/medsense/interventions.documentation.saveDraft');
	const finalizeDocumentation = useEndpoint('POST', '/v1/medsense/interventions.documentation.finalize');
	const signDocumentation = useEndpoint('POST', '/v1/medsense/interventions.documentation.sign');
	const [bundle, setBundle] = useState<BundleResponse | null>(null);
	const [draft, setDraft] = useState<DraftState | null>(null);
	const [editing, setEditing] = useState<Record<string, boolean>>({});
	const [editingValues, setEditingValues] = useState<Record<string, any>>({});
	const [prefillRequested, setPrefillRequested] = useState(false);
	const [prefillLoading, setPrefillLoading] = useState(false);
	const prefillRequestRef = useRef(0);
	const formRef = useRef<HTMLFormElement>(null);
	const template = bundle?.template;
	const intervention = bundle?.intervention;

	const { data, isLoading } = useQuery({
		queryKey: ['medsense-documentation-review', interventionId],
		queryFn: async () => getInfo({ interventionId }),
		enabled: Boolean(interventionId),
		refetchOnWindowFocus: false,
	});
	useEffect(() => {
		if (!data?.intervention) return;
		const intervention = data.intervention as IMedsenseIntervention;
		const template = intervention.documentationTemplateSnapshot;
		if (!template) return;

		const hasExistingPrefill = Boolean(intervention.documentationPrefill);
		if (!hasExistingPrefill && !prefillRequested) {
			const baseBundle = { intervention, template, prefill: undefined } as BundleResponse;
			setBundle(baseBundle);
			setDraft(buildDraft(baseBundle));
			setEditing({});
			setEditingValues({});
			setPrefillRequested(true);
			setPrefillLoading(true);
			prefillRequestRef.current += 1;
			const requestId = prefillRequestRef.current;
			void prefill({ interventionId, roomId })
				.then((prefillResponse: any) => {
					if (prefillRequestRef.current !== requestId) {
						return;
					}
					if (!prefillResponse?.intervention || !prefillResponse?.template) {
						setBundle(baseBundle);
						setDraft(buildDraft(baseBundle));
						setEditing({});
						setEditingValues({});
						return;
					}
					const nextBundle = {
						intervention: prefillResponse.intervention,
						template: prefillResponse.template,
						prefill: prefillResponse.prefill,
					} as BundleResponse;
					setBundle(nextBundle);
					setDraft(buildDraft(nextBundle));
					setEditing({});
					setEditingValues({});
				})
				.catch(() => {
					if (prefillRequestRef.current !== requestId) {
						return;
					}
					setBundle(baseBundle);
					setDraft(buildDraft(baseBundle));
					setEditing({});
					setEditingValues({});
				})
				.finally(() => {
					if (prefillRequestRef.current === requestId) {
						setPrefillLoading(false);
					}
				});
			return;
		}

		if (!hasExistingPrefill && prefillRequested && prefillLoading) {
			return;
		}

		const nextBundle = {
			intervention,
			template,
			prefill: intervention.documentationPrefill
				? { fields: intervention.documentationPrefill.fields, model: intervention.documentationPrefill.model }
				: undefined,
		} as BundleResponse;
		setPrefillLoading(false);
		setBundle(nextBundle);
		setDraft(buildDraft(nextBundle));
		setEditing({});
		setEditingValues({});
	}, [data, interventionId, prefill, prefillRequested, roomId]);

	const saveMutation = useMutation({
		mutationFn: async () =>
			draft && bundle
				? saveDraft({
						interventionId,
						documentationValues: draft.documentationValues,
						prescriptions: draft.prescriptions,
						followUp: draft.followUp,
						documentationPrefill: { ...(bundle.intervention.documentationPrefill || {}), fields: draft.suggestions },
					})
				: null,
		onSuccess: (response) => {
			if (!response?.intervention || !bundle) return;
			const nextBundle = { ...bundle, intervention: response.intervention };
			setBundle(nextBundle);
			setDraft(buildDraft(nextBundle));
			setEditing({});
			setEditingValues({});
			dispatchToastMessage({ type: 'success', message: 'Draft saved' });
		},
		onError: () => dispatchToastMessage({ type: 'error', message: 'Unable to save draft' }),
	});
	const finalizeMutation = useMutation({
		mutationFn: async () => finalizeDocumentation({ interventionId }),
		onSuccess: (response) => {
			if (response?.intervention && bundle) setBundle({ ...bundle, intervention: response.intervention });
			dispatchToastMessage({ type: 'success', message: 'Documentation finalized' });
		},
		onError: (error: any) =>
			dispatchToastMessage({ type: 'error', message: error?.details || error?.message || 'Unable to finalize documentation' }),
	});
	const signMutation = useMutation({
		mutationFn: async ({
			role,
			signatureImageData,
			signerName,
		}: {
			role: 'pharmacist' | 'patient';
			signatureImageData: string;
			signerName?: string;
		}) => signDocumentation({ interventionId, role, signatureImageData, signerName }),
		onSuccess: (response) => {
			if (response?.intervention && bundle) setBundle({ ...bundle, intervention: response.intervention });
			dispatchToastMessage({ type: 'success', message: 'Signature saved' });
		},
		onError: (error: any) =>
			dispatchToastMessage({ type: 'error', message: error?.details || error?.message || 'Unable to save signature' }),
	});

	const counts = useMemo(
		() =>
			(draft?.suggestions || []).reduce(
				(acc, suggestion) => {
					const status = suggestion.reviewStatus || 'pending';
					acc.total += 1;
					acc[status] += 1;
					return acc;
				},
				{ total: 0, pending: 0, accepted: 0, modified: 0, rejected: 0 } as Record<'total' | SuggestionStatus, number>,
			),
		[draft],
	);
	const commitSuggestion = useCallback(
		(target: SuggestionTarget, fieldKey: string, status: SuggestionStatus, value: any, rowIndex?: number) =>
			setDraft((current) => {
				if (!current) return current;
				const next: DraftState = {
					documentationValues: { ...current.documentationValues },
					followUp: { ...current.followUp },
					prescriptions: current.prescriptions.map((row) => ({ ...row })),
					suggestions: current.suggestions.map((item) => ({ ...item })),
				};
				setValue(next, target, fieldKey, value, rowIndex);
				next.suggestions = next.suggestions.map((suggestion) =>
					(suggestion.target || 'documentation') === target &&
					suggestion.fieldKey === fieldKey &&
					(target !== 'prescription' || (suggestion.rowIndex ?? 0) === (rowIndex ?? 0))
						? { ...suggestion, reviewStatus: status }
						: suggestion,
				);
				return next;
			}),
		[],
	);
	const acceptAllPending = useCallback(
		() =>
			setDraft((current) => {
				if (!current) return current;
				const next: DraftState = {
					documentationValues: { ...current.documentationValues },
					followUp: { ...current.followUp },
					prescriptions: current.prescriptions.map((row) => ({ ...row })),
					suggestions: current.suggestions.map((item) => ({ ...item })),
				};
				next.suggestions.forEach((suggestion) => {
					if ((suggestion.reviewStatus || 'pending') !== 'pending') return;
					setValue(next, suggestion.target || 'documentation', suggestion.fieldKey, suggestion.suggestedValue, suggestion.rowIndex);
					suggestion.reviewStatus = 'accepted';
				});
				return next;
			}),
		[],
	);
	const startEdit = useCallback(
		(suggestion: Suggestion) => {
			const key = suggestionKey(suggestion);
			setEditing((current) => ({ ...current, [key]: true }));
			setEditingValues((current) => ({
				...current,
				[key]: cloneFieldValue(
					getValue(draft as DraftState, suggestion.target || 'documentation', suggestion.fieldKey, suggestion.rowIndex) ??
						suggestion.suggestedValue ??
						(Array.isArray(suggestion.suggestedValue) ? [] : ''),
				),
			}));
		},
		[draft],
	);
	const completeEdit = useCallback(
		(suggestion: Suggestion) => {
			const key = suggestionKey(suggestion);
			const value = editingValues[key];
			const status: SuggestionStatus = isFilled(value) ? 'modified' : 'rejected';
			commitSuggestion(suggestion.target || 'documentation', suggestion.fieldKey, status, value, suggestion.rowIndex);
			setEditing((current) => {
				const next = { ...current };
				delete next[key];
				return next;
			});
			setEditingValues((current) => {
				const next = { ...current };
				delete next[key];
				return next;
			});
		},
		[commitSuggestion, editingValues],
	);
	const updateManual = useCallback(
		(target: SuggestionTarget, fieldKey: string, value: any, rowIndex?: number) =>
			setDraft((current) => {
				if (!current) return current;
				const next: DraftState = {
					documentationValues: { ...current.documentationValues },
					followUp: { ...current.followUp },
					prescriptions: current.prescriptions.map((row) => ({ ...row })),
					suggestions: current.suggestions.map((item) => ({ ...item })),
				};
				setValue(next, target, fieldKey, value, rowIndex);
				return next;
			}),
		[],
	);
	const addPrescriptionRow = useCallback(
		() => setDraft((current) => (current ? { ...current, prescriptions: [...current.prescriptions, {}] } : current)),
		[],
	);
	const cancelInitialPrefill = useCallback(() => {
		prefillRequestRef.current += 1;
		setPrefillLoading(false);
	}, []);
	const regeneratePrefill = useCallback(async () => {
		setPrefillRequested(true);
		setPrefillLoading(true);
		prefillRequestRef.current += 1;
		const requestId = prefillRequestRef.current;

		try {
			const prefillResponse: any = await prefill({ interventionId, roomId, forceRefresh: true });
			if (prefillRequestRef.current !== requestId) {
				return;
			}
			if (!prefillResponse?.intervention || !prefillResponse?.template) {
				dispatchToastMessage({ type: 'error', message: 'Unable to regenerate documentation prefill' });
				return;
			}

			const nextBundle = {
				intervention: prefillResponse.intervention,
				template: prefillResponse.template,
				prefill: prefillResponse.prefill,
			} as BundleResponse;
			setBundle(nextBundle);
			setDraft(buildDraft(nextBundle));
			setEditing({});
			setEditingValues({});
			dispatchToastMessage({ type: 'success', message: 'Documentation prefill regenerated' });
		} catch {
			if (prefillRequestRef.current === requestId) {
				dispatchToastMessage({ type: 'error', message: 'Unable to regenerate documentation prefill' });
			}
		} finally {
			if (prefillRequestRef.current === requestId) {
				setPrefillLoading(false);
			}
		}
	}, [dispatchToastMessage, interventionId, prefill, roomId]);
	const reportValidity = useCallback(() => {
		if (formRef.current && !formRef.current.reportValidity()) {
			return false;
		}
		if (!template || !draft) {
			return true;
		}

		for (const section of template.sections || []) {
			if (section.type === 'signatures' || !isTemplateSectionVisible(section, draft)) {
				continue;
			}

			const target: SuggestionTarget = section.type === 'follow_up' ? 'follow_up' : 'documentation';
			for (const field of section.fields || []) {
				if (!field.required) {
					continue;
				}

				if (section.type === 'prescriptions') {
					const hasPrescriptionValue = draft.prescriptions.some((row) => hasFieldValue(field, row?.[field.key]));
					if (!hasPrescriptionValue) {
						dispatchToastMessage({ type: 'error', message: `${field.label} is required.` });
						return false;
					}
					continue;
				}

				const value = getValue(draft, target, field.key);
				if (!hasFieldValue(field, value)) {
					dispatchToastMessage({
						type: 'error',
						message: field.type === 'repeater' ? `${field.label} requires at least one row.` : `${field.label} is required.`,
					});
					return false;
				}
			}
		}

		return true;
	}, [dispatchToastMessage, draft, template]);
	const renderInput = useCallback((field: TemplateField, value: any, onChange: (value: any) => void, disabled = false) => {
		const sharedProps = {
			disabled,
			required: Boolean(field.required),
			onInvalid: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
				const target = event.currentTarget;
				target.setCustomValidity(field.required ? `${field.label} is required.` : '');
			},
			onInput: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
				event.currentTarget.setCustomValidity('');
			},
		};
		if (field.type === 'select' || field.type === 'drug') {
			return (
				<select {...sharedProps} value={value ?? ''} onChange={(event) => onChange(event.currentTarget.value)}>
					<option value=''>Select {field.label}</option>
					{(field.options || []).map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			);
		}
		if (field.type === 'boolean') {
			return (
				<select
					{...sharedProps}
					value={value === undefined ? '' : String(Boolean(value))}
					onChange={(event) => onChange(event.currentTarget.value === 'true')}
				>
					<option value=''>Select {field.label}</option>
					<option value='true'>Yes</option>
					<option value='false'>No</option>
				</select>
			);
		}
		if (field.type === 'textarea') {
			return <textarea {...sharedProps} value={value ?? ''} onChange={(event) => onChange(event.currentTarget.value)} />;
		}
		if (field.type === 'number') {
			return (
				<input
					{...sharedProps}
					type='number'
					step='any'
					value={value ?? ''}
					onChange={(event) => onChange(event.currentTarget.value === '' ? '' : event.currentTarget.value)}
				/>
			);
		}
		return (
			<input
				{...sharedProps}
				type={field.type === 'date' ? 'date' : 'text'}
				value={value ?? ''}
				onChange={(event) => onChange(event.currentTarget.value)}
			/>
		);
	}, []);
	const renderRepeaterValue = useCallback((field: TemplateField, value: any) => {
		const childFields = field.fields || [];
		const rows = getRepeaterRows(value).filter((row) => Object.values(row || {}).some((entry) => isFilled(entry)));
		if (!rows.length || !childFields.length) {
			return <div className='ms-doc-repeater-empty'>No rows added.</div>;
		}

		return (
			<div className='ms-doc-repeater-tableWrap'>
				<table className='ms-doc-repeater-table'>
					<thead>
						<tr>
							{childFields.map((childField) => (
								<th key={`${field.key}-header-${childField.key}`}>{childField.label}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, rowIndex) => (
							<tr key={`${field.key}-row-${rowIndex}`}>
								{childFields.map((childField) => (
									<td key={`${field.key}-${rowIndex}-${childField.key}`}>{displayValue(row?.[childField.key])}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}, []);
	const renderRepeaterEditor = useCallback(
		(field: TemplateField, value: any, onChange: (value: any) => void, disabled = false) => {
			const childFields = field.fields || [];
			const rows = getRepeaterRows(value);
			const updateRows = (nextRows: Array<Record<string, any>>) => onChange(nextRows);
			const updateRowCell = (rowIndex: number, childFieldKey: string, nextValue: any) => {
				const nextRows = rows.map((row) => ({ ...row }));
				while (nextRows.length <= rowIndex) {
					nextRows.push({});
				}
				if (isFilled(nextValue)) {
					nextRows[rowIndex][childFieldKey] = nextValue;
				} else {
					delete nextRows[rowIndex][childFieldKey];
				}
				updateRows(nextRows);
			};
			const addRow = () => updateRows([...rows, {}]);
			const removeRow = (rowIndex: number) => updateRows(rows.filter((_, currentRowIndex) => currentRowIndex !== rowIndex));

			return (
				<div className='ms-doc-repeater'>
					<div className='ms-doc-buttons'>
						<button type='button' className='ms-doc-ghost modify' onClick={addRow} disabled={disabled}>
							Add row
						</button>
					</div>
					{rows.length ? (
						<div className='ms-doc-repeater-tableWrap'>
							<table className='ms-doc-repeater-table'>
								<thead>
									<tr>
										{childFields.map((childField) => (
											<th key={`${field.key}-editor-header-${childField.key}`}>{childField.label}</th>
										))}
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row, rowIndex) => (
										<tr key={`${field.key}-editor-row-${rowIndex}`}>
											{childFields.map((childField) => (
												<td key={`${field.key}-editor-${rowIndex}-${childField.key}`}>
													<div className='ms-doc-control'>
														{renderInput(
															childField,
															row?.[childField.key],
															(nextValue) => updateRowCell(rowIndex, childField.key, nextValue),
															disabled,
														)}
													</div>
												</td>
											))}
											<td>
												<button type='button' className='ms-doc-ghost reject' onClick={() => removeRow(rowIndex)} disabled={disabled}>
													Remove
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className='ms-doc-repeater-empty'>No rows added yet.</div>
					)}
				</div>
			);
		},
		[renderInput],
	);
	const renderField = useCallback(
		(field: TemplateField, target: SuggestionTarget, rowIndex?: number) => {
			if (!draft) return null;
			const suggestion = findSuggestion(draft.suggestions, target, field.key, rowIndex);
			const key = suggestion ? suggestionKey(suggestion) : `${target}::${field.key}::${rowIndex ?? -1}`;
			const status = suggestion?.reviewStatus || 'pending';
			const editingNow = Boolean(editing[key]);
			const committed = getValue(draft, target, field.key, rowIndex);
			const value = isFilled(committed) ? committed : status === 'pending' ? suggestion?.suggestedValue : undefined;
			const requiredMessage = <div className='ms-doc-required-message'>Required field is empty.</div>;
			const baseFieldClassName = `ms-doc-field${field.type === 'repeater' ? ' ms-doc-field--repeater' : ''}`;
			const isRequiredEmpty = Boolean(field.required) && !hasFieldValue(field, value);
			const fieldClassName = `${baseFieldClassName} ${status}${isRequiredEmpty ? ' required-empty' : ''}`;

			if (!suggestion) {
				const isManualRequiredEmpty = Boolean(field.required) && !hasFieldValue(field, committed);
				return (
					<div className={`${baseFieldClassName}${isManualRequiredEmpty ? ' required-empty' : ''}`}>
						<div className='ms-doc-label'>{field.label}</div>
						<div className='ms-doc-control'>
							{field.type === 'repeater'
								? renderRepeaterEditor(
										field,
										committed,
										(nextValue) => updateManual(target, field.key, nextValue, rowIndex),
										prefillLoading,
									)
								: renderInput(field, committed, (nextValue) => updateManual(target, field.key, nextValue, rowIndex), prefillLoading)}
						</div>
						{isManualRequiredEmpty && requiredMessage}
					</div>
				);
			}

			if (editingNow) {
				const isEditingRequiredEmpty = Boolean(field.required) && !hasFieldValue(field, editingValues[key]);
				return (
					<div className={`${baseFieldClassName} editing${isEditingRequiredEmpty ? ' required-empty' : ''}`}>
						<div className='ms-doc-label'>{field.label}</div>
						<div className='ms-doc-control'>
							{field.type === 'repeater'
								? renderRepeaterEditor(
										field,
										editingValues[key],
										(nextValue) => setEditingValues((current) => ({ ...current, [key]: nextValue })),
										prefillLoading,
									)
								: renderInput(
										field,
										editingValues[key],
										(nextValue) => setEditingValues((current) => ({ ...current, [key]: nextValue })),
										prefillLoading,
									)}
						</div>
						{isEditingRequiredEmpty && requiredMessage}
						<div className='ms-doc-buttons'>
							<button type='button' className='ms-doc-ghost accept' onClick={() => completeEdit(suggestion)} disabled={prefillLoading}>
								Complete
							</button>
						</div>
					</div>
				);
			}

			return (
				<div className={fieldClassName}>
					<div className='ms-doc-label'>{field.label}</div>
					<div className='ms-doc-value'>{field.type === 'repeater' ? renderRepeaterValue(field, value) : displayValue(value)}</div>
					{isRequiredEmpty && requiredMessage}
					<div className='ms-doc-meta'>
						{status === 'pending'
							? `AI suggestion • ${Math.round((suggestion.confidence || 0) * 100)}% confidence`
							: status === 'accepted'
								? 'Accepted and locked'
								: status === 'modified'
									? 'Modified by pharmacist'
									: 'Suggestion rejected'}
					</div>
					<div className='ms-doc-buttons'>
						{status === 'pending' ? (
							<>
								<button
									type='button'
									className='ms-doc-ghost accept'
									disabled={prefillLoading}
									onClick={() => commitSuggestion(target, field.key, 'accepted', suggestion.suggestedValue, rowIndex)}
								>
									Accept
								</button>
								<button
									type='button'
									className='ms-doc-ghost reject'
									disabled={prefillLoading}
									onClick={() => {
										commitSuggestion(target, field.key, 'rejected', undefined, rowIndex);
										setEditing((current) => ({ ...current, [key]: true }));
										setEditingValues((current) => ({ ...current, [key]: field.type === 'repeater' ? [] : '' }));
									}}
								>
									Reject
								</button>
								<button type='button' className='ms-doc-ghost modify' disabled={prefillLoading} onClick={() => startEdit(suggestion)}>
									Modify
								</button>
							</>
						) : (
							<button type='button' className='ms-doc-ghost modify' disabled={prefillLoading} onClick={() => startEdit(suggestion)}>
								Modify
							</button>
						)}
					</div>
				</div>
			);
		},
		[
			commitSuggestion,
			completeEdit,
			draft,
			editing,
			editingValues,
			prefillLoading,
			renderInput,
			renderRepeaterEditor,
			renderRepeaterValue,
			startEdit,
			updateManual,
		],
	);

	const prescriptionSection = template?.sections?.find(
		(section) => section.type === 'prescriptions' && (!draft || isTemplateSectionVisible(section, draft)),
	);
	const prescriptionSuggestionRows =
		draft?.suggestions
			.filter((suggestion) => (suggestion.target || 'documentation') === 'prescription')
			.map((suggestion) => suggestion.rowIndex ?? 0) || [];
	const prescriptionRowCount = Math.max(
		1,
		draft?.prescriptions?.length || 0,
		prescriptionSuggestionRows.length ? Math.max(...prescriptionSuggestionRows) + 1 : 0,
	);
	const loadingContent = (
		<div className='ms-doc-scroll'>
			<div className='ms-doc-shell'>
				<div className='ms-doc-card'>
					<div className='ms-doc-pad'>
						<div className='ms-doc-eyebrow'>Documentation review</div>
						<h2 className='ms-doc-loading-title'>{prefillLoading ? 'MedSense AI is summarizing' : 'Loading documentation'}</h2>
						<p className='ms-doc-loading-subtitle'>
							{prefillLoading
								? 'Please wait while MedSense AI reviews the room context, submitted answers, and the selected documentation form to prepare prefilled suggestions.'
								: 'Please wait while the documentation bundle loads.'}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
	if (isLoading || !bundle || !draft || !template || !intervention) {
		if (embedded) {
			return (
				<>
					<style>{css}</style>
					<ContextualbarDialog>
						<ContextualbarHeader>
							<ContextualbarTitle>Documentation Review</ContextualbarTitle>
							{onClose && <ContextualbarClose onClick={onClose} />}
						</ContextualbarHeader>
						<ContextualbarContent paddingInline={0} paddingBlock={0}>
							{loadingContent}
						</ContextualbarContent>
					</ContextualbarDialog>
				</>
			);
		}

		return (
			<Page>
				<PageHeader title='Documentation Review' />
				<PageContent>{loadingContent}</PageContent>
			</Page>
		);
	}

	const content = (
		<div className='ms-doc-shell'>
			<div className='ms-doc-grid'>
				<div className='ms-doc-main'>
					<form ref={formRef} onSubmit={(event) => event.preventDefault()} noValidate={false}>
							<div className='ms-doc-card'>
								<div className='ms-doc-pad'>
									<div className='ms-doc-hero'>
										<div>
											<div className='ms-doc-eyebrow'>Intervention documentation review</div>
											<h1 className='ms-doc-title'>{template.label}</h1>
											<p className='ms-doc-subtitle'>
												Review the AI suggestions first. Accepted or modified fields become the committed documentation and drive final PDF
												export.
											</p>
										</div>
										<div className='ms-doc-actions'>
											<Button small onClick={regeneratePrefill} disabled={prefillLoading}>
												{prefillLoading ? 'Regenerating…' : 'Regenerate AI'}
											</Button>
											<Button small primary onClick={acceptAllPending} disabled={!counts.pending || prefillLoading}>
												Accept all pending
											</Button>
											<Button
												small
												onClick={() => {
													if (reportValidity()) saveMutation.mutate();
												}}
												disabled={saveMutation.isPending || prefillLoading}
											>
												{saveMutation.isPending ? 'Saving…' : 'Save draft'}
											</Button>
											<Button
												small
												onClick={() => {
													if (reportValidity()) finalizeMutation.mutate();
												}}
												disabled={counts.pending > 0 || finalizeMutation.isPending || prefillLoading}
											>
												{finalizeMutation.isPending ? 'Finalizing…' : 'Finalize'}
											</Button>
											<Button
												small
												disabled={prefillLoading}
												onClick={async () => {
													if (!reportValidity()) return;
													await downloadInterventionDocumentationPdf(
														{
															...intervention,
															documentationValues: draft.documentationValues,
															followUp: draft.followUp,
															prescriptions: draft.prescriptions,
															documentationPrefill: { ...(intervention.documentationPrefill || {}), fields: draft.suggestions },
														} as IMedsenseIntervention,
														template,
													);
												}}
											>
												Download PDF
											</Button>
										</div>
									</div>
								</div>
							</div>
							{prefillLoading && (
								<div className='ms-doc-card'>
									<div className='ms-doc-pad'>
										<div className='ms-doc-eyebrow'>MedSense AI</div>
										<h2 className='ms-doc-loading-title'>MedSense AI is preparing suggestions</h2>
										<p className='ms-doc-loading-subtitle'>
											Please wait while the selected documentation form is being reviewed against room context and submitted answers. Inputs
											are temporarily locked until prefill completes or fails.
										</p>
										<div className='ms-doc-buttons'>
											<button type='button' className='ms-doc-ghost reject' onClick={cancelInitialPrefill}>
												Exit AI Prefill
											</button>
										</div>
									</div>
								</div>
							)}
							<div className='ms-doc-card'>
								<div className='ms-doc-pad'>
									<div className='ms-doc-section-head'>
										<div className='ms-doc-section-title'>Review state</div>
										<span className='ms-doc-status'>
											{intervention.documentationStatus || 'draft'}
											{bundle.prefill?.model ? ` • ${bundle.prefill.model}` : ''}
										</span>
									</div>
									<div className='ms-doc-summary'>
										<div className='ms-doc-pill'>
											<strong>{counts.total}</strong>
											<span>Suggested</span>
										</div>
										<div className='ms-doc-pill'>
											<strong>{counts.pending}</strong>
											<span>Pending</span>
										</div>
										<div className='ms-doc-pill'>
											<strong>{counts.accepted}</strong>
											<span>Accepted</span>
										</div>
										<div className='ms-doc-pill'>
											<strong>{counts.modified}</strong>
											<span>Modified</span>
										</div>
										<div className='ms-doc-pill'>
											<strong>{counts.rejected}</strong>
											<span>Rejected</span>
										</div>
									</div>
								</div>
							</div>
							<div className={prefillLoading ? 'ms-doc-disabled' : ''}>
								{template.sections
									.filter(
										(section) =>
											section.type !== 'signatures' && section.type !== 'prescriptions' && isTemplateSectionVisible(section, draft),
									)
									.map((section) => {
									const target: SuggestionTarget = section.type === 'follow_up' ? 'follow_up' : 'documentation';
									return (
										<div key={section.key} className='ms-doc-card ms-doc-section'>
											<div className='ms-doc-section-head'>
												<div className='ms-doc-section-title'>{section.title}</div>
												<span className='ms-doc-status'>{section.fields?.length || 0} fields</span>
											</div>
											<div className='ms-doc-fields'>
												{(section.fields || []).map((field) => (
													<React.Fragment key={`${section.key}-${field.key}`}>{renderField(field, target)}</React.Fragment>
												))}
											</div>
										</div>
									);
								})}
							{prescriptionSection && (
								<div className='ms-doc-card ms-doc-section'>
									<div className='ms-doc-section-head'>
										<div className='ms-doc-section-title'>{prescriptionSection.title}</div>
										<div className='ms-doc-buttons'>
											<button type='button' className='ms-doc-ghost modify' disabled={prefillLoading} onClick={addPrescriptionRow}>
												Add row
											</button>
										</div>
									</div>
									<table className='ms-doc-table'>
										<thead>
											<tr>
												{(prescriptionSection.fields || []).map((field) => (
													<th key={field.key}>{field.label}</th>
												))}
											</tr>
										</thead>
										<tbody>
											{Array.from({ length: prescriptionRowCount }).map((_, rowIndex) => (
												<tr key={`rx-row-${rowIndex}`}>
													{(prescriptionSection.fields || []).map((field) => (
														<td key={`${field.key}-${rowIndex}`}>{renderField(field, 'prescription', rowIndex)}</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
								)}
							</div>
						</form>
						<div className='ms-doc-signatures'>
							<SignaturePad
								title='Pharmacist signature'
								helperText='Finalize first, then apply the pharmacist signature.'
								buttonLabel='Save pharmacist signature'
								disabled={prefillLoading || (intervention.documentationStatus || 'draft') === 'draft' || signMutation.isPending}
								onSubmit={(signatureImageData) => signMutation.mutateAsync({ role: 'pharmacist', signatureImageData })}
							/>
							{template.signatureRules?.allowPatientSignature && (
								<SignaturePad
									title='Patient signature'
									helperText='Optional unless the selected template requires it.'
									buttonLabel='Save patient signature'
									requireSignerName
									disabled={prefillLoading || (intervention.documentationStatus || 'draft') === 'draft' || signMutation.isPending}
									onSubmit={(signatureImageData, signerName) => signMutation.mutateAsync({ role: 'patient', signatureImageData, signerName })}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
	);

	return (
		<>
			<style>{css}</style>
			{embedded ? (
				<ContextualbarDialog>
					<ContextualbarHeader>
						<ContextualbarTitle>{template.label || t('Documentation')}</ContextualbarTitle>
						{onClose && <ContextualbarClose onClick={onClose} />}
					</ContextualbarHeader>
					<ContextualbarContent paddingInline={0} paddingBlock={0}>
						<div className='ms-doc-scroll'>{content}</div>
					</ContextualbarContent>
				</ContextualbarDialog>
			) : (
				<Page>
					<PageHeader title={template.label || t('Documentation')} />
					<PageContent>
						<div className='ms-doc-scroll'>{content}</div>
					</PageContent>
				</Page>
			)}
		</>
	);
};

const DocumentationReviewPage = () => <DocumentationReviewScreen />;

export default DocumentationReviewPage;
