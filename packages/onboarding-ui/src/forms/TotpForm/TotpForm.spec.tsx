import { render } from '@testing-library/react';

import TotpForm from './TotpForm';

it('renders without crashing', () => {
	const { container } = render(<TotpForm onChangeTotpForm={() => undefined} isBackupCode={false} onSubmit={() => undefined} />);

	expect(container.firstChild).not.toBeNull();
});
