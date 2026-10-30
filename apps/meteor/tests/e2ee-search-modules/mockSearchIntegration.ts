if (/[/\\]client[/\\]lib[/\\]e2ee[/\\]rocketchat\.e2e(?:\.[^.]+)?\.spec\.ts$/.test(expect.getState().testPath ?? '')) {
	jest.doMock('../../client/lib/e2eeSearch/createE2EESearchIntegration', () => ({
		createE2EESearchIntegration: () => ({
			session: {},
			writer: { index: jest.fn(), bindToOpenIndex: () => jest.fn() },
			runtime: { onDecryptFailed: jest.fn() },
		}),
	}));
}
