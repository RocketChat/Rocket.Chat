import { renderHook } from '@testing-library/react';

import { useHandleMenuAction } from './useHandleMenuAction';
import type { GenericMenuItemProps } from '../GenericMenuItem';

const renderHandler = (items: GenericMenuItemProps[], callbackAction = jest.fn()) => {
	const { result } = renderHook(() => useHandleMenuAction(items, callbackAction));
	return { handle: result.current, callbackAction };
};

it('finds top-level and nested items by id', () => {
	const onEdit = jest.fn();
	const onCopy = jest.fn();
	const { handle, callbackAction } = renderHandler([
		{ id: 'edit', onClick: onEdit },
		{ id: 'share', items: [{ id: 'copy', onClick: onCopy }] },
	]);

	handle('copy');
	expect(onCopy).toHaveBeenCalledTimes(1);
	expect(callbackAction).toHaveBeenCalledTimes(1);

	handle('edit');
	expect(onEdit).toHaveBeenCalledTimes(1);
	expect(callbackAction).toHaveBeenCalledTimes(2);
});

// Choosing a trigger only opens its sub menu, so it must not run an action even when it was given one.
it('ignores a trigger, an unknown id and an item without onClick', () => {
	const onShare = jest.fn();
	const { handle, callbackAction } = renderHandler([
		{ id: 'share', onClick: onShare, items: [{ id: 'copy', onClick: jest.fn() }] },
		{ id: 'label' },
	]);

	handle('share');
	handle('unknown');
	handle('label');

	expect(onShare).not.toHaveBeenCalled();
	expect(callbackAction).not.toHaveBeenCalled();
});

it('still serves a flat list', () => {
	const onEdit = jest.fn();
	const onDelete = jest.fn();
	const { handle, callbackAction } = renderHandler([
		{ id: 'edit', onClick: onEdit },
		{ id: 'delete', onClick: onDelete },
	]);

	handle('delete');

	expect(onDelete).toHaveBeenCalledTimes(1);
	expect(onEdit).not.toHaveBeenCalled();
	expect(callbackAction).toHaveBeenCalledTimes(1);
});
