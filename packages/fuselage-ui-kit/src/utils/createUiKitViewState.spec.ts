import type * as UiKit from '@rocket.chat/ui-kit';

import { createUiKitViewState } from './createUiKitViewState';

const textInput = (actionId: string, blockId: string | undefined, initialValue?: string): UiKit.InputBlock =>
	({
		type: 'input',
		...(blockId && { blockId }),
		label: { type: 'plain_text', text: actionId },
		element: { type: 'plain_text_input', actionId, ...(blockId && { blockId }), ...(initialValue !== undefined && { initialValue }) },
	}) as UiKit.InputBlock;

it('starts from the initial values of the elements that have a block id', () => {
	const viewState = createUiKitViewState([textInput('name', 'name-block', 'Ada'), textInput('nickname', undefined, 'ada')]);

	expect(viewState.getState()).toEqual({ 'name-block': { name: 'Ada' } });
});

it('keeps each change under the block of the element', () => {
	const viewState = createUiKitViewState([textInput('name', 'name-block', 'Ada')]);

	viewState.setValue('name', { value: 'Grace', blockId: 'name-block' });
	viewState.setValue('nickname', { value: 'grace', blockId: 'default' });

	expect(viewState.getState()).toEqual({ 'name-block': { name: 'Grace' }, 'default': { nickname: 'grace' } });
});

it('keeps what the user entered, seeds new elements and drops removed ones when reseeded', () => {
	const viewState = createUiKitViewState([textInput('name', 'name-block', 'Ada'), textInput('notes', 'notes-block', 'draft')]);
	viewState.setValue('name', { value: 'Grace', blockId: 'name-block' });

	viewState.reseed([textInput('name', 'name-block', 'Ada Lovelace'), textInput('email', 'email-block', 'ada@example.com')]);

	expect(viewState.getState()).toEqual({ 'name-block': { name: 'Grace' }, 'email-block': { email: 'ada@example.com' } });
});

it('keeps an edited element without block id under `default` when reseeded', () => {
	const viewState = createUiKitViewState([textInput('nickname', undefined)]);
	viewState.setValue('nickname', { value: 'grace', blockId: 'default' });

	viewState.reseed([textInput('nickname', undefined)]);

	expect(viewState.getState()).toEqual({ default: { nickname: 'grace' } });
});

const whereSelect = (blockId: string): UiKit.InputBlock =>
	({
		type: 'input',
		blockId,
		label: { type: 'plain_text', text: 'Where' },
		element: { type: 'multi_conversations_select', actionId: 'where', blockId, default_to_current_conversation: true },
	}) as UiKit.InputBlock;

it('starts an element that defaults to the current conversation with the room the view was opened from', () => {
	const viewState = createUiKitViewState([whereSelect('where-block')], 'GENERAL');

	expect(viewState.getState()).toEqual({ 'where-block': { where: ['GENERAL'] } });
});

it('starts an element that defaults to the current conversation with that room when an update adds it', () => {
	const viewState = createUiKitViewState([], 'GENERAL');

	viewState.reseed([whereSelect('where-block')]);

	expect(viewState.getState()).toEqual({ 'where-block': { where: ['GENERAL'] } });
});

it('tells its subscribers about changes until they unsubscribe', () => {
	const viewState = createUiKitViewState([]);
	const listener = jest.fn();
	const unsubscribe = viewState.subscribe(listener);

	viewState.setValue('name', { value: 'Ada', blockId: 'name-block' });
	unsubscribe();
	viewState.setValue('name', { value: 'Grace', blockId: 'name-block' });

	expect(listener).toHaveBeenCalledTimes(1);
});

it('is uploading while any file input still has uploads in flight', () => {
	const viewState = createUiKitViewState([]);

	viewState.setUploading('photos', true);
	viewState.setUploading('documents', true);
	viewState.setUploading('photos', false);
	expect(viewState.isUploading()).toBe(true);

	viewState.setUploading('documents', false);
	expect(viewState.isUploading()).toBe(false);
});
