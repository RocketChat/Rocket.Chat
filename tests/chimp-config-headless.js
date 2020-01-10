// import path from 'path';
// import {isCI} from '../lib/ci';

const deepExtend = require('deep-extend');

const baseConfig = require('./chimp-config');

module.exports = deepExtend(baseConfig, {
	webdriverio: {
		desiredCapabilities: {
			executablePath: '/home/allskar/Work/Rocket.Chat/Rocket.Chat/node_modules/chromedriver/bin/chromedriver',
			'goog:chromeOptions': {
				args: ['--headless', '--disable-gpu', '--window-size=1920,1080', '--no-sandbox', '--disable-dev-shm-usage', '--disable-features=VizDisplayCompositor'],
			},
		},
	},
});
