import { render } from '@testing-library/react';

import InformationTooltipTrigger from './InformationTooltipTrigger';

it('renders without crashing', () => {
	const { container } = render(<InformationTooltipTrigger text='' />);

	expect(container.firstChild).not.toBeNull();
});
