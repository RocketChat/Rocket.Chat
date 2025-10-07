import { render } from '@testing-library/react';

import InfoPanelLabel from './InfoPanelLabel';

describe('InfoPanelLabel', () => {
	it('should match snapshot for default label', () => {
		const { baseElement } = render(
			<InfoPanelLabel>
				<span>Default label content</span>
			</InfoPanelLabel>,
		);
		expect(baseElement).toMatchSnapshot();
	});

	it('should match snapshot for label with title', () => {
		const { baseElement } = render(
			<InfoPanelLabel title='This is helpful information about the label'>
				<span>Label with info icon</span>
			</InfoPanelLabel>,
		);
		expect(baseElement).toMatchSnapshot();
	});
});
