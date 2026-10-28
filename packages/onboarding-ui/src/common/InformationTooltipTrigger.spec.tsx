import { render } from '@testing-library/react';

import InformationTooltipTrigger from './InformationTooltipTrigger';

it('renders without crashing', () => {
	render(<InformationTooltipTrigger text='' />);
});
