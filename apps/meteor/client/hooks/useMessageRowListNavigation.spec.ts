import { renderHook, act, fireEvent } from '@testing-library/react';

import { useMessageRowListNavigation } from './useMessageRowListNavigation';

// The hook listens on the document, so each test detaches the lists it attached
const detachers: (() => void)[] = [];

afterEach(() => {
	detachers.splice(0).forEach((detach) => detach());
	document.body.innerHTML = '';
});

const createMessage = (className: string) => {
	const message = document.createElement('div');
	message.className = className;
	message.tabIndex = 0;

	const toolbar = document.createElement('div');
	toolbar.setAttribute('role', 'toolbar');
	const action = document.createElement('button');
	toolbar.appendChild(action);
	message.appendChild(toolbar);

	return { message, action };
};

const setup = () => {
	const list = document.createElement('div');
	const user = createMessage('rcx-message');
	const system = createMessage('rcx-message-system');
	list.append(user.message, system.message);
	document.body.appendChild(list);

	const { result } = renderHook(() => useMessageRowListNavigation());
	act(() => result.current(list));
	detachers.push(() => act(() => result.current(null)));

	return { user, system };
};

it('moves between user and system messages', () => {
	const { user, system } = setup();
	user.message.focus();

	fireEvent.keyDown(user.message, { key: 'ArrowDown' });

	expect(document.activeElement).toBe(system.message);
});

it('reaches the message toolbar with the arrow keys and leaves it with Escape', () => {
	const { user } = setup();
	user.message.focus();

	fireEvent.keyDown(user.message, { key: 'ArrowRight' });
	expect(document.activeElement).toBe(user.action);

	fireEvent.keyDown(user.action, { key: 'Escape' });
	expect(document.activeElement).toBe(user.message);
});
