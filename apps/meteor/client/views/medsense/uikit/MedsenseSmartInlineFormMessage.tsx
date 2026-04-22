import { UiKitComponent, UiKitContext as UiKitCtx } from '@rocket.chat/fuselage-ui-kit';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { MedsenseUiKitMessageSurface } from './MedsenseFormSurfaceRenderer';

const ACTION_SELECT = 'selection-form__select';
const ACTION_CUSTOM = 'selection-form__custom';
const ACTION_INLINE_SUBMIT = 'selection-form__inline-submit';

type ParsedOption = {
	blockId: string;
	actionId: string;
	appId?: string;
	value: string;
	label: string;
	selected: boolean;
	multi: boolean;
};

type ParsedCustom = {
	blockId: string;
	actionId: string;
	appId?: string;
	label: string;
	placeholder: string;
	initialValue: string;
};

type ParsedSubmit = {
	blockId: string;
	actionId: string;
	appId?: string;
	value: string;
	label: string;
};

type ParsedInlineLayout = {
	appId?: string;
	title?: string;
	prompt?: string;
	options: ParsedOption[];
	multi: boolean;
	custom?: ParsedCustom;
	submit: ParsedSubmit;
};

const asText = (value: unknown): string => {
	if (!value || typeof value !== 'object') {
		return '';
	}

	const maybeText = (value as { text?: unknown }).text;
	if (typeof maybeText !== 'string') {
		return '';
	}

	return maybeText;
};

const cleanSectionText = (text: string): string => {
	const trimmed = text.trim();
	const markdownTitle = trimmed.match(/^\*(.+)\*$/);
	return markdownTitle ? markdownTitle[1].trim() : trimmed;
};

const MULTI_SELECT_LABEL_MARKER = /^\[[ xX]\]\s+/;

const cleanOptionLabel = (label: string): string => label.replace(MULTI_SELECT_LABEL_MARKER, '');

const isMultiSelectOption = (option: Pick<ParsedOption, 'multi'>): boolean => option.multi;

const getNextSelectedValues = (currentValues: string[], optionValue: string, multi: boolean | undefined): string[] => {
	const alreadySelected = currentValues.includes(optionValue);
	if (multi) {
		return alreadySelected ? currentValues.filter((value) => value !== optionValue) : [...currentValues, optionValue];
	}

	return alreadySelected ? [] : [optionValue];
};

const parseInlineLayout = (blocks: MessageSurfaceLayout): ParsedInlineLayout | null => {
	let title: string | undefined;
	let prompt: string | undefined;
	let appId: string | undefined;
	const options: ParsedOption[] = [];
	let custom: ParsedCustom | undefined;
	let submit: ParsedSubmit | undefined;

	for (const block of blocks as Array<any>) {
		if (!block || typeof block !== 'object') {
			continue;
		}

		if (typeof block.appId === 'string' && !appId) {
			appId = block.appId;
		}

		if (block.type === 'section') {
			const text = cleanSectionText(asText(block.text));
			if (!text) {
				continue;
			}
			if (!title) {
				title = text;
				continue;
			}
			if (!prompt) {
				prompt = text;
			}
			continue;
		}

		if (block.type === 'actions' && Array.isArray(block.elements)) {
			for (const element of block.elements) {
				if (!element || typeof element !== 'object' || element.type !== 'button') {
					continue;
				}

				const actionId = typeof element.actionId === 'string' ? element.actionId : '';
				if (!actionId) {
					continue;
				}

				const value = typeof element.value === 'string' ? element.value : '';
				const rawLabel = asText(element.text);
				const elementAppId = typeof element.appId === 'string' ? element.appId : undefined;

				if (actionId === ACTION_SELECT) {
					const blockId = typeof block.blockId === 'string' ? block.blockId : '';
					options.push({
						blockId,
						actionId,
						appId: elementAppId,
						value,
						label: cleanOptionLabel(rawLabel),
						selected: typeof block.blockId === 'string' && block.blockId.endsWith('::selected'),
						multi: blockId.includes('::multi::') || MULTI_SELECT_LABEL_MARKER.test(rawLabel.trim()),
					});
					continue;
				}

				if (actionId === ACTION_INLINE_SUBMIT) {
					submit = {
						blockId: typeof block.blockId === 'string' ? block.blockId : '',
						actionId,
						appId: elementAppId,
						value,
						label: rawLabel || 'Submit',
					};
				}
			}
			continue;
		}

		if (block.type === 'input' && block.element?.type === 'plain_text_input') {
			const inputElement = block.element;
			const actionId = typeof inputElement.actionId === 'string' ? inputElement.actionId : '';
			if (actionId !== ACTION_CUSTOM) {
				continue;
			}

			custom = {
				blockId: typeof block.blockId === 'string' ? block.blockId : '',
				actionId,
				appId: typeof inputElement.appId === 'string' ? inputElement.appId : undefined,
				label: asText(block.label),
				placeholder: asText(inputElement.placeholder),
				initialValue: typeof inputElement.initialValue === 'string' ? inputElement.initialValue : '',
			};
		}
	}

	if (!submit) {
		return null;
	}

	if (!options.length && !custom) {
		return null;
	}

	return {
		appId,
		title,
		prompt,
		options,
		multi: options.some(isMultiSelectOption),
		custom,
		submit,
	};
};

export const canRenderMedsenseInlineSmartForm = (blocks: MessageSurfaceLayout): boolean => Boolean(parseInlineLayout(blocks));

const MedsenseSmartInlineFormMessage = ({ blocks }: { blocks: MessageSurfaceLayout }) => {
	const contextValue = useContext(UiKitCtx);
	const parsed = useMemo(() => parseInlineLayout(blocks), [blocks]);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const initialSelectedValues = useMemo(
		() => parsed?.options.filter((option) => option.selected).map((option) => option.value) || [],
		[parsed],
	);
	const initialCustom = useMemo(() => parsed?.custom?.initialValue || '', [parsed]);

	const [selectedValues, setSelectedValues] = useState<string[]>(initialSelectedValues);
	const [customDraft, setCustomDraft] = useState(initialCustom);
	const [isCustomOpen, setIsCustomOpen] = useState(Boolean(initialCustom.trim().length));

	useEffect(() => {
		setSelectedValues(initialSelectedValues);
		setCustomDraft(initialCustom);
		setIsCustomOpen(Boolean(initialCustom.trim().length));
	}, [initialCustom, initialSelectedValues]);

	useEffect(() => {
		if (!isCustomOpen) {
			return;
		}
		inputRef.current?.focus();
	}, [isCustomOpen]);

	const emitAction = useCallback(
		async (params: { actionId: string; blockId: string; value: string; appId?: string }) => {
			const appId = params.appId || parsed?.appId || contextValue.appId || 'core';
			await contextValue.action(
				{
					actionId: params.actionId as any,
					blockId: params.blockId,
					value: params.value,
					appId,
				},
				{
					preventDefault: () => undefined,
					stopPropagation: () => undefined,
					target: {
						value: params.value,
					},
				} as any,
			);
		},
		[contextValue, parsed?.appId],
	);

	const onSelectOption = useCallback(
		async (option: ParsedOption): Promise<void> => {
			const nextSelectedValues = getNextSelectedValues(selectedValues, option.value, parsed?.multi);
			setSelectedValues(nextSelectedValues);
			setCustomDraft('');
			setIsCustomOpen(false);
			await emitAction({
				actionId: option.actionId,
				blockId: option.blockId,
				value: option.value,
				appId: option.appId,
			});
		},
		[emitAction, parsed?.multi, selectedValues],
	);

	const onSubmit = useCallback(async (): Promise<void> => {
		if (!parsed?.submit) {
			return;
		}

		if (!customDraft.trim().length && selectedValues.length === 0) {
			return;
		}

		const submitValue = customDraft.trim().length
			? `${parsed.submit.value}::${encodeURIComponent(customDraft.trim())}`
			: parsed.submit.value;

		await emitAction({
			actionId: parsed.submit.actionId,
			blockId: parsed.submit.blockId,
			value: submitValue,
			appId: parsed.submit.appId,
		});
	}, [customDraft, emitAction, parsed?.submit, selectedValues.length]);

	if (!parsed) {
		return <UiKitComponent render={MedsenseUiKitMessageSurface} blocks={blocks} />;
	}

	const customLabel = parsed.custom?.label || parsed.custom?.placeholder || 'Tell us what to do differently';
	const submitLabel = customDraft.trim().length ? 'Continue' : 'Submit';

	return (
		<div className='medsenseUIKit medsenseUIKit--message'>
			<div className='medsenseUIKit-inlineForm'>
				{parsed.title && <div className='medsenseUIKit-inlineForm__title'>{parsed.title}</div>}
				{parsed.prompt && <div className='medsenseUIKit-inlineForm__prompt'>{parsed.prompt}</div>}

				<div className='medsenseUIKit-inlineForm__rows'>
					{parsed.options.map((option) => {
						const isSelected = selectedValues.includes(option.value);
						return (
							<button
								key={option.blockId || `${option.actionId}-${option.value}`}
								type='button'
								className={`medsenseUIKit-inlineRow ${isSelected ? 'medsenseUIKit-inlineRow--selected' : ''}`}
								onClick={() => void onSelectOption(option)}
							>
								<span className='medsenseUIKit-inlineRow__label'>{option.label}</span>
								<span className='medsenseUIKit-inlineRow__indicator' aria-hidden='true'>
									{isSelected ? '\u2713' : ''}
								</span>
							</button>
						);
					})}

					{parsed.custom && !isCustomOpen && (
						<button type='button' className='medsenseUIKit-inlineRow medsenseUIKit-inlineRow--custom' onClick={() => setIsCustomOpen(true)}>
							<span className='medsenseUIKit-inlineRow__label'>{customLabel}</span>
							<span className='medsenseUIKit-inlineRow__indicator' aria-hidden='true'>
								{' '}
							</span>
						</button>
					)}

					{parsed.custom && isCustomOpen && (
						<div className='medsenseUIKit-inlineRow medsenseUIKit-inlineRow--customOpen'>
							<input
								ref={inputRef}
								type='text'
								className='medsenseUIKit-inlineRow__input'
								value={customDraft}
								placeholder={customLabel}
								onChange={(event) => {
									const next = event.currentTarget.value;
									setCustomDraft(next);
									if (next.trim().length > 0) {
										setSelectedValues([]);
									}
								}}
								onKeyDown={(event) => {
									if (event.key !== 'Enter') {
										return;
									}
									event.preventDefault();
									event.stopPropagation();
									void onSubmit();
								}}
							/>
						</div>
					)}
				</div>

				<div className='medsenseUIKit-inlineForm__footer'>
					<button type='button' className='medsenseUIKit-inlineForm__submit' onClick={() => void onSubmit()}>
						{submitLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

export default MedsenseSmartInlineFormMessage;
