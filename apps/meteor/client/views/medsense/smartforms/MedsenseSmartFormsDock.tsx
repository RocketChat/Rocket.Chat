import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

import '../uikit/medsenseUIKit.css';

type SmartFormOption = {
	label: string;
	value: string;
};

type SmartFormEntry = {
	entryId: string;
	formId: string;
	stepId: string;
	title?: string;
	prompt: string;
	options: SmartFormOption[];
	multi: boolean;
	allowCustomText: boolean;
	customLabel: string;
};

type SmartFormResponse = {
	question?: string;
	answer?: string;
	timestamp?: string;
};

type SmartFormsPayload = {
	pendingForms?: SmartFormEntry[];
	pendingCount?: number;
	pastResponses?: SmartFormResponse[];
	viewerCanAnswer?: boolean;
	showCompactReview?: boolean;
	activeFormIndex?: number;
};

const clampIndex = (index: number, length: number): number => {
	if (length <= 0) {
		return 0;
	}

	return Math.max(0, Math.min(index, length - 1));
};

type SmartFormDraft = {
	selection: string[];
	customText: string;
};

const MedsenseSmartFormsDock = ({ roomId }: { roomId: string }): ReactElement | null => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const isDarkMode = useDarkMode();
	const getRoomSmartForms = useEndpoint('GET', '/v1/medsense/room.smartforms' as any);
	const submitSmartForm = useEndpoint('POST', '/v1/medsense/room.smartforms.submit' as any);

	const [selectedTab, setSelectedTab] = useState<'active' | 'past'>('active');
	const [activeIndex, setActiveIndex] = useState(0);
	const [pastResponseIndex, setPastResponseIndex] = useState(0);
	const [draftResponses, setDraftResponses] = useState<Record<string, SmartFormDraft>>({});
	const [selectedValues, setSelectedValues] = useState<string[]>([]);
	const [customText, setCustomText] = useState('');
	const [isReviewExpanded, setIsReviewExpanded] = useState(false);

	const { data } = useQuery({
		queryKey: ['medsense-room-smartforms', roomId],
		queryFn: async () => (await getRoomSmartForms({ roomId })) as SmartFormsPayload,
		enabled: Boolean(roomId),
		refetchInterval: 5000,
	});

	const pendingForms = Array.isArray(data?.pendingForms) ? data.pendingForms : [];
	const pastResponses = Array.isArray(data?.pastResponses) ? data.pastResponses : [];
	const viewerCanAnswer = Boolean(data?.viewerCanAnswer);
	const showCompactReview = Boolean(data?.showCompactReview);
	const hasAnyVisibleContent = pendingForms.length > 0 || pastResponses.length > 0;
	const activeForm = pendingForms[clampIndex(activeIndex, pendingForms.length)];
	const themeClass = isDarkMode ? 'medsenseUIKit--theme-dark' : 'medsenseUIKit--theme-light';

	useEffect(() => {
		setActiveIndex((current) => clampIndex(current, pendingForms.length));
	}, [pendingForms.length]);

	useEffect(() => {
		setPastResponseIndex((current) => clampIndex(current, pastResponses.length));
	}, [pastResponses.length]);

	useEffect(() => {
		setDraftResponses((current) => {
			const activeEntryIds = new Set(pendingForms.map(({ entryId }) => entryId));
			const nextEntries = Object.entries(current).filter(([entryId]) => activeEntryIds.has(entryId));
			return Object.fromEntries(nextEntries);
		});
	}, [pendingForms]);

	useEffect(() => {
		if (pendingForms.length > 0 && viewerCanAnswer) {
			setSelectedTab('active');
			setIsReviewExpanded(false);
		}
	}, [pendingForms.length, viewerCanAnswer]);

	useEffect(() => {
		if (!activeForm) {
			setSelectedValues([]);
			setCustomText('');
			return;
		}

		const activeDraft = draftResponses[activeForm.entryId];
		setSelectedValues(activeDraft?.selection || []);
		setCustomText(activeDraft?.customText || '');
	}, [activeForm?.entryId, draftResponses]);

	const submitMutation = useMutation({
		mutationFn: async () => {
			if (!activeForm) {
				return null;
			}

			if (pendingForms.length > 1) {
				return submitSmartForm({
					roomId,
					formId: activeForm.formId,
					responses: pendingForms.map((form) => ({
						stepId: form.stepId,
						selection: draftResponses[form.entryId]?.selection || [],
						customText: draftResponses[form.entryId]?.customText || '',
					})),
				});
			}

			return submitSmartForm({
				roomId,
				formId: activeForm.formId,
				stepId: activeForm.stepId,
				selection: selectedValues,
				customText,
			});
		},
		onSuccess: async (result: any) => {
			await queryClient.invalidateQueries({ queryKey: ['medsense-room-smartforms', roomId] });
			setDraftResponses({});
			setSelectedValues([]);
			setCustomText('');

			if (Number(result?.pendingCount || 0) === 0) {
				setSelectedTab('past');
				setIsReviewExpanded(false);
			}
		},
		onError: (error: any) => {
			dispatchToastMessage({ type: 'error', message: error?.message || 'Unable to submit Smart Form response.' });
		},
	});

	const canSubmit = useMemo(() => {
		if (pendingForms.length > 1) {
			return pendingForms.every((form) => {
				const draft = draftResponses[form.entryId];
				return Boolean(draft && (draft.selection.length > 0 || draft.customText.trim().length > 0));
			});
		}
		return selectedValues.length > 0 || customText.trim().length > 0;
	}, [customText, draftResponses, pendingForms, selectedValues]);

	const updateActiveDraft = (nextSelection: string[], nextCustomText: string) => {
		if (!activeForm) {
			return;
		}

		setDraftResponses((current) => ({
			...current,
			[activeForm.entryId]: {
				selection: nextSelection,
				customText: nextCustomText,
			},
		}));
	};

	const onToggleValue = (value: string) => {
		if (!activeForm) {
			return;
		}

		setSelectedValues((current) => {
			const nextSelection = activeForm.multi
				? current.includes(value)
					? current.filter((item) => item !== value)
					: [...current, value]
				: current.length === 1 && current[0] === value
					? []
					: [value];
			updateActiveDraft(nextSelection, '');
			return nextSelection;
		});
		setCustomText('');
	};

	const onCustomTextChange = (event: ChangeEvent<HTMLInputElement>) => {
		const nextValue = event.currentTarget.value;
		setCustomText(nextValue);
		if (nextValue.trim()) {
			setSelectedValues([]);
			updateActiveDraft([], nextValue);
			return;
		}
		updateActiveDraft(selectedValues, nextValue);
	};

	const renderPastResponses = () => {
		if (pastResponses.length === 0) {
			return <div className='medsenseSmartFormsDock__empty'>{t('No_data_found') || 'No past responses yet.'}</div>;
		}

		const activePastResponse = pastResponses[clampIndex(pastResponseIndex, pastResponses.length)];

		return (
			<div className='medsenseSmartFormsDock__responses'>
				{pastResponses.length > 1 ? (
					<div className='medsenseSmartFormsDock__toolbar'>
						<div className='medsenseSmartFormsDock__header'>
							<div className='medsenseSmartFormsDock__helper'>Past responses</div>
						</div>
						<div className='medsenseSmartFormsDock__switcher'>
							<button
								type='button'
								className='medsenseSmartFormsDock__switcherButton'
								onClick={() => setPastResponseIndex((current) => clampIndex(current - 1, pastResponses.length))}
								disabled={pastResponseIndex <= 0}
							>
								&lt;
							</button>
							<span className='medsenseSmartFormsDock__switcherCount'>
								{pastResponseIndex + 1} of {pastResponses.length}
							</span>
							<button
								type='button'
								className='medsenseSmartFormsDock__switcherButton'
								onClick={() => setPastResponseIndex((current) => clampIndex(current + 1, pastResponses.length))}
								disabled={pastResponseIndex >= pastResponses.length - 1}
							>
								&gt;
							</button>
						</div>
					</div>
				) : null}
				{activePastResponse ? (
					<div className='medsenseSmartFormsDock__responseCard'>
						<div className='medsenseSmartFormsDock__responseQuestion'>{activePastResponse.question || 'Question'}</div>
						<div className='medsenseSmartFormsDock__responseAnswer'>{activePastResponse.answer || 'No answer provided'}</div>
						{activePastResponse.timestamp ? (
							<div className='medsenseSmartFormsDock__responseMeta'>{new Date(activePastResponse.timestamp).toLocaleString()}</div>
						) : null}
					</div>
				) : null}
			</div>
		);
	};

	const renderActiveForm = () => {
		if (!activeForm) {
			return <div className='medsenseSmartFormsDock__empty'>{t('No_data_found') || 'No pending forms.'}</div>;
		}

		return (
			<div className='medsenseUIKit-inlineForm'>
				<div className='medsenseSmartFormsDock__toolbar'>
					<div className='medsenseSmartFormsDock__header'>
						{activeForm.title ? <div className='medsenseUIKit-inlineForm__title'>{activeForm.title}</div> : null}
						<div className='medsenseUIKit-inlineForm__prompt'>{activeForm.prompt}</div>
						<div className='medsenseSmartFormsDock__helper'>
							{pendingForms.length > 1
								? 'Answer each form, then submit once'
								: activeForm.multi
									? 'Choose all that apply'
									: 'Choose one option'}
						</div>
					</div>
					{pendingForms.length > 1 ? (
						<div className='medsenseSmartFormsDock__switcher'>
							<button
								type='button'
								className='medsenseSmartFormsDock__switcherButton'
								onClick={() => setActiveIndex((current) => clampIndex(current - 1, pendingForms.length))}
								disabled={activeIndex <= 0}
							>
								&lt;
							</button>
							<span className='medsenseSmartFormsDock__switcherCount'>
								{activeIndex + 1} of {pendingForms.length}
							</span>
							<button
								type='button'
								className='medsenseSmartFormsDock__switcherButton'
								onClick={() => setActiveIndex((current) => clampIndex(current + 1, pendingForms.length))}
								disabled={activeIndex >= pendingForms.length - 1}
							>
								&gt;
							</button>
						</div>
					) : null}
				</div>

				<div className='medsenseUIKit-inlineForm__rows'>
					{activeForm.options.map((option) => {
						const isSelected = selectedValues.includes(option.value);
						return (
							<button
								key={option.value}
								type='button'
								className={`medsenseUIKit-inlineRow ${isSelected ? 'medsenseUIKit-inlineRow--selected' : ''}`}
								onClick={() => onToggleValue(option.value)}
							>
								<span className='medsenseUIKit-inlineRow__label'>{option.label}</span>
								<span className='medsenseUIKit-inlineRow__indicator'>{isSelected ? '✓' : ''}</span>
							</button>
						);
					})}
					{activeForm.allowCustomText ? (
						<div
							className={`medsenseUIKit-inlineRow ${customText.trim() ? 'medsenseUIKit-inlineRow--selected medsenseUIKit-inlineRow--customOpen' : 'medsenseUIKit-inlineRow--customOpen'}`}
						>
							<input
								type='text'
								className='medsenseUIKit-inlineRow__input'
								value={customText}
								onChange={onCustomTextChange}
								placeholder={activeForm.customLabel || 'Tell us what to do differently'}
							/>
						</div>
					) : null}
				</div>

				<div className='medsenseUIKit-inlineForm__footer'>
					<button
						type='button'
						className='medsenseUIKit-inlineForm__submit'
						onClick={() => submitMutation.mutate()}
						disabled={!canSubmit || submitMutation.isPending}
					>
						{submitMutation.isPending ? 'Submitting...' : pendingForms.length > 1 ? 'Submit all' : 'Submit'}
					</button>
				</div>
			</div>
		);
	};

	if (!hasAnyVisibleContent) {
		return null;
	}

	const shouldShowExpandedDock = viewerCanAnswer && pendingForms.length > 0;
	const shouldShowCompactChip = !shouldShowExpandedDock && (showCompactReview || pastResponses.length > 0);

	return (
		<div className='medsenseSmartFormsDock'>
			{shouldShowExpandedDock ? (
				<div className={`medsenseUIKit ${themeClass} medsenseSmartFormsDock__panel`}>
					<div className='medsenseSmartFormsDock__tabs'>
						<button
							type='button'
							className={`medsenseSmartFormsDock__tab ${selectedTab === 'active' ? 'medsenseSmartFormsDock__tab--active' : ''}`}
							onClick={() => setSelectedTab('active')}
						>
							Active
						</button>
						<button
							type='button'
							className={`medsenseSmartFormsDock__tab ${selectedTab === 'past' ? 'medsenseSmartFormsDock__tab--active' : ''}`}
							onClick={() => setSelectedTab('past')}
						>
							Past responses
						</button>
					</div>
					{selectedTab === 'active' ? renderActiveForm() : renderPastResponses()}
				</div>
			) : null}

			{shouldShowCompactChip ? (
				<>
					<button
						type='button'
						className={`medsenseUIKit ${themeClass} medsenseSmartFormsDock__chip`}
						onClick={() => setIsReviewExpanded((current) => !current)}
					>
						Past responses{pastResponses.length > 0 ? ` (${pastResponses.length})` : ''}
					</button>
					{isReviewExpanded ? (
						<div className={`medsenseUIKit ${themeClass} medsenseSmartFormsDock__panel`}>{renderPastResponses()}</div>
					) : null}
				</>
			) : null}
		</div>
	);
};

export default MedsenseSmartFormsDock;
