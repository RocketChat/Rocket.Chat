import { render } from '@testing-library/react';

import OrganizationInfoForm from './OrganizationInfoForm';

it('renders without crashing', () => {
	const { container } = render(
		<OrganizationInfoForm
			currentStep={1}
			stepCount={1}
			organizationIndustryOptions={[]}
			organizationSizeOptions={[]}
			countryOptions={[]}
			onSubmit={() => undefined}
			onBackButtonClick={() => undefined}
		/>,
	);

	expect(container.firstChild).not.toBeNull();
});
