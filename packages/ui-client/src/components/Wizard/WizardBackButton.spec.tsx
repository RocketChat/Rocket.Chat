import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WizardBackButton from './WizardBackButton';
import StepNode from './lib/StepNode';
import { createMockWizardApi } from './mocks/createMockWizardApi';
import { useWizardContext } from './useWizardContext';

jest.mock('./useWizardContext');
const mockedUseWizardContext = jest.mocked(useWizardContext);

const mockWizardApi = createMockWizardApi();
mockedUseWizardContext.mockReturnValue(mockWizardApi);

const appRoot = mockAppRoot().build();

describe('WizardBackButton', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render with default "Back" text', () => {
		render(<WizardBackButton />, { wrapper: appRoot });
		expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
	});

	it('should render with custom children', () => {
		render(<WizardBackButton>Go Back</WizardBackButton>);
		expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
	});

	it('should be disabled if there is no previous step', () => {
		mockedUseWizardContext.mockReturnValueOnce({
			...mockWizardApi,
			currentStep: new StepNode({ id: 'step1', title: 'Step 1' }),
		});

		render(<WizardBackButton />);
		expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
	});

	it('should be disabled if the disabled prop is true', () => {
		render(<WizardBackButton disabled />);
		expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
	});

	it('should be enabled if there is a previous step and disabled prop is false', () => {
		const currentStep = new StepNode({ id: 'step2', title: 'Step 2' });
		const prevStep = new StepNode({ id: 'step1', title: 'Step 1' });
		currentStep.prev = prevStep;

		mockedUseWizardContext.mockReturnValueOnce({ ...mockWizardApi, currentStep });

		render(<WizardBackButton />);
		expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
	});

	it('should call previous() on click', async () => {
		render(<WizardBackButton />);
		const button = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(button);

		expect(mockWizardApi.previous).toHaveBeenCalledTimes(1);
	});

	it('should call the onClick prop when clicked', async () => {
		const mockOnClick = jest.fn();

		render(<WizardBackButton onClick={mockOnClick} />);
		const button = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(button);

		expect(mockOnClick).toHaveBeenCalledTimes(1);
		expect(mockWizardApi.previous).toHaveBeenCalledTimes(1);
	});

	it('should not call previous() if onClick prevents default', async () => {
		const mockOnClick = jest.fn((e) => e.preventDefault());

		render(<WizardBackButton onClick={mockOnClick} />);
		const button = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(button);

		expect(mockOnClick).toHaveBeenCalledTimes(1);
		expect(mockWizardApi.previous).not.toHaveBeenCalled();
	});
});
