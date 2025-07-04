import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WizardNextButton from './WizardNextButton';
import StepNode from './lib/StepNode';
import { createMockWizardApi } from './mocks/createMockWizardApi';
import { useWizardContext } from './useWizardContext';

jest.mock('./useWizardContext');
const mockedUseWizardContext = jest.mocked(useWizardContext);

const mockWizardApi = createMockWizardApi();
mockedUseWizardContext.mockReturnValue(mockWizardApi);

const appRoot = mockAppRoot().build();

describe('WizardNextButton', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render with default "Next" text', () => {
		render(<WizardNextButton />, { wrapper: appRoot });
		expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
	});

	it('should render with custom children', () => {
		render(<WizardNextButton>Go Next</WizardNextButton>);
		expect(screen.getByRole('button', { name: 'Go Next' })).toBeInTheDocument();
	});

	it('should be disabled if there is no previous step', () => {
		mockedUseWizardContext.mockReturnValueOnce({
			...mockWizardApi,
			currentStep: new StepNode({ id: 'step1', title: 'Step 1' }),
		});

		render(<WizardNextButton />);
		expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
	});

	it('should be disabled if the disabled prop is true', () => {
		render(<WizardNextButton disabled />);
		expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
	});

	it('should be enabled if there is a next step and disabled prop is false', () => {
		const currentStep = new StepNode({ id: 'step2', title: 'Step 2' });
		const nextStep = new StepNode({ id: 'step1', title: 'Step 1' });
		currentStep.next = nextStep;

		mockedUseWizardContext.mockReturnValueOnce({ ...mockWizardApi, currentStep });

		render(<WizardNextButton />);
		expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
	});

	it('should call next() on click', async () => {
		render(<WizardNextButton />);
		const button = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(button);

		expect(mockWizardApi.next).toHaveBeenCalledTimes(1);
	});

	it('should call the onClick prop when clicked', async () => {
		const mockOnClick = jest.fn();

		render(<WizardNextButton onClick={mockOnClick} />);
		const button = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(button);

		expect(mockOnClick).toHaveBeenCalledTimes(1);
		expect(mockWizardApi.next).toHaveBeenCalledTimes(1);
	});

	it('should not call next() if onClick prevents default', async () => {
		const mockOnClick = jest.fn((e) => e.preventDefault());

		render(<WizardNextButton onClick={mockOnClick} />);
		const button = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(button);

		expect(mockOnClick).toHaveBeenCalledTimes(1);
		expect(mockWizardApi.next).not.toHaveBeenCalled();
	});
});
