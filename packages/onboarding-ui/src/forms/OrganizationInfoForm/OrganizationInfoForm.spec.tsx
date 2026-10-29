import { render } from '@testing-library/react';

import OrganizationInfoForm from './OrganizationInfoForm';

it('renders without crashing', () => {
	render(
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
});
