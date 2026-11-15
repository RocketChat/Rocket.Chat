import { render } from '@testing-library/react';

import CreateFirstMemberPage from './CreateFirstMemberPage';

const onSubmit = jest.fn();
const onBackButtonClick = jest.fn();
const validateUsername = jest.fn();
const validatePassword = jest.fn();

const props = {
	currentStep: 1,
	stepCount: 1,
	organizationName: 'Kapai',
	onSubmit,
	onBackButtonClick,
	validateUsername,
	validatePassword,
};

it('renders without crashing', () => {
	render(<CreateFirstMemberPage {...props} />);
});
