import type { ISetting } from '@rocket.chat/core-typings';
import { SettingEditor } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useSettingDraft } from './useSettingDraft';
import { useEditableSetting } from '../../EditableSettingsContext';
import EditableSettingsProvider from '../EditableSettingsProvider';

const renderDraft = (_id: string, value: ISetting['value'], structure: Partial<ISetting>) =>
	renderHook(() => ({ draft: useSettingDraft(_id), setting: useEditableSetting(_id) }), {
		wrapper: mockAppRoot()
			.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
			.withSetting(_id, value, structure)
			.build(),
	});

describe('useSettingDraft', () => {
	it('should expose the new value right away and flag it as changed', () => {
		const { result } = renderDraft('Site_Name', 'Rocket.Chat', { type: 'string', packageValue: 'Rocket.Chat' });

		act(() => result.current.draft.setValue('Other'));

		expect(result.current.draft.value).toBe('Other');
		expect(result.current.setting).toMatchObject({ value: 'Other', changed: true, invalid: false });
	});

	it('should clear the changed flag when the value goes back to the persisted one', () => {
		const { result } = renderDraft('Site_Name', 'Rocket.Chat', { type: 'string', packageValue: 'Rocket.Chat' });

		act(() => result.current.draft.setValue('Other'));
		act(() => result.current.draft.setValue('Rocket.Chat'));

		expect(result.current.setting).toMatchObject({ value: 'Rocket.Chat', changed: false });
	});

	it('should flag a code setting holding invalid JSON as invalid', () => {
		const { result } = renderDraft('Code_Setting', '{}', { type: 'code', code: 'application/json', packageValue: '{}' });

		act(() => result.current.draft.setValue('{'));

		expect(result.current.setting).toMatchObject({ value: '{', invalid: true });
	});

	it('should keep a color setting unchanged when only the editor is set back to the persisted one', () => {
		const { result } = renderDraft('Color_Setting', '#fff', {
			type: 'color',
			editor: SettingEditor.COLOR,
			packageValue: '#fff',
			packageEditor: SettingEditor.COLOR,
		});

		act(() => result.current.draft.setEditor(SettingEditor.EXPRESSION));
		expect(result.current.draft.editor).toBe(SettingEditor.EXPRESSION);
		expect(result.current.setting).toMatchObject({ changed: true });

		act(() => result.current.draft.setEditor(SettingEditor.COLOR));
		expect(result.current.setting).toMatchObject({ changed: false });
	});

	it('should reset to the package value and editor and return them', () => {
		const { result } = renderDraft('Color_Setting', '#000', {
			type: 'color',
			editor: SettingEditor.EXPRESSION,
			packageValue: '#fff',
			packageEditor: SettingEditor.COLOR,
		});

		let draft;
		act(() => {
			draft = result.current.draft.reset();
		});

		expect(draft).toEqual({ value: '#fff', editor: SettingEditor.COLOR });
		expect(result.current.draft).toMatchObject({ value: '#fff', editor: SettingEditor.COLOR });
		expect(result.current.setting).toMatchObject({ changed: true });
	});
});
