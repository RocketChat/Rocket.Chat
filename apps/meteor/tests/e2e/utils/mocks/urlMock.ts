export const LOCALHOST = 'localhost:3000';

export const BASE_API_URL = `http://${process.env.TEST_API_URL ?? LOCALHOST}/api/v1`;

export const setupWizardStepRegex = {
	_1: /.*\/setup-wizard\/1/,
	_2: /.*\/setup-wizard\/2/,
	_3: /.*\/setup-wizard\/3/,
};
