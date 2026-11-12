import type { TestRunnerConfig } from '@storybook/test-runner';

// Browsers report a ResizeObserver callback that resizes what it observes as an error, though nothing is lost
const BENIGN_ERRORS = ['ResizeObserver loop completed with undelivered notifications', 'ResizeObserver loop limit exceeded'];

const config: TestRunnerConfig = {
	async preVisit(page) {
		await page.addInitScript((benign: string[]) => {
			window.addEventListener('error', (event) => {
				if (benign.some((message) => event.message?.includes(message))) {
					event.stopImmediatePropagation();
					event.preventDefault();
				}
			});
		}, BENIGN_ERRORS);
	},
};

export default config;
