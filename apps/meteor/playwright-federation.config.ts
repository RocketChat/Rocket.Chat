import type { PlaywrightTestConfig } from '@playwright/test';

export default {
	globalSetup: require.resolve('./tests/e2e/federation/config/global-setup.ts'),
	use: {
		headless: true,
		ignoreHTTPSErrors: true,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		channel: 'chrome',
		launchOptions: {
			// force GPU hardware acceleration
			// (even in headless mode)
			args: [
				'--use-gl=egl',
				'--use-fake-device-for-media-stream',
				'--use-fake-ui-for-media-stream',
				'--use-file-for-fake-video-capture=tests/e2e/federation/files/video_mock_for_webcam.y4m',
				'--use-file-for-fake-audio-capture=tests/e2e/federation/files/audio_mock.wav',
			],
		},
	},
	outputDir: 'tests/e2e/.playwright',
	reporter: 'list',
	testDir: 'tests/e2e/federation',
	workers: 1,
	retries: 2,
	timeout: 60 * 2000,
} as PlaywrightTestConfig;
