import { render } from '@testing-library/react';

import TotpForm from './TotpForm';

it('renders without crashing', () => {
	render(<TotpForm onChangeTotpForm={() => undefined} isBackupCode={false} onSubmit={() => undefined} />);
});
