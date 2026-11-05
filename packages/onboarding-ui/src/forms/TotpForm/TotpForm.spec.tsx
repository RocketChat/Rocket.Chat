import { render } from '@testing-library/react';

import TotpForm from './TotpForm.js';

it('renders without crashing', () => {
	const { container } = render(<TotpForm onChangeTotpForm={() => undefined} isBackupCode={false} onSubmit={() => undefined} />);

	expect(container).not.toBeEmptyDOMElement();
});
