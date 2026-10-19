import { render } from '@testing-library/react';

import AdminInfoForm from './AdminInfoForm';

it('renders without crashing', () => {
	const { container } = render(
		<AdminInfoForm
			currentStep={1}
			stepCount={1}
			passwordRulesHint=''
			validateEmail={() => true}
			validatePassword={() => true}
			validateUsername={() => true}
			onSubmit={() => undefined}
		/>,
	);

	expect(container.firstChild).not.toBeNull();
});
