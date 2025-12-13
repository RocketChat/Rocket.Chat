module.exports = {
  diffingEngine: 'pixelmatch',
  configurations: {
    'chrome.laptop': {
      target: 'chrome.docker',
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    },
    'chrome.iphone': {
      target: 'chrome.docker',
      preset: 'iPhone 7',
    },
  },
  dockerWithSudo: false,
  chromeSelector: '#storybook-root > *',
  skipStories: [
    '**/playground/**',
    '**/test/**',
    '**/examples/**'
  ],
  // Turbo integration
  turbo: {
    enabled: true,
    filter: '**/*.stories.@(js|jsx|ts|tsx)',
    cacheKey: (filePath) => {
      const fs = require('fs');
      return fs.statSync(filePath).mtimeMs;
    }
  }
};
