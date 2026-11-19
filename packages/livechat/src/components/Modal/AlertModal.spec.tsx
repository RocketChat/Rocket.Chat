import { render } from 'preact';

import AlertModal from './AlertModal';
import ConfirmationModal from './ConfirmationModal';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

let root: HTMLElement;

beforeEach(() => {
	root = document.body.appendChild(document.createElement('div'));
});

afterEach(() => {
	render(null, root);
	root.remove();
});

describe.each([
	['AlertModal', () => <AlertModal text='Message' onConfirm={() => undefined} />],
	['ConfirmationModal', () => <ConfirmationModal text='Message' onConfirm={() => undefined} onCancel={() => undefined} />],
])('%s', (_, modal) => {
	it('is an alert dialog named by its message', () => {
		render(modal(), root);

		const dialog = root.querySelector('[role=alertdialog]');
		expect(dialog?.getAttribute('aria-label')).toBe('Message');
	});
});
