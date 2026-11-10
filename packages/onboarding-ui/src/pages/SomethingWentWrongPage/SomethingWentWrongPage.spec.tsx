import { render } from '@testing-library/react';

import SomethingWentWrongPage from './SomethingWentWrongPage';

it('renders without crashing', () => {
	render(<SomethingWentWrongPage />);
});
