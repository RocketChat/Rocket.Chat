import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	preset: client.preset,
	testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}'],
	setupFilesAfterEnv: [...client.setupFilesAfterEnv, '<rootDir>/jest-setup.ts'],
	transform: {
		'\\.css\\.ts$': '@vanilla-extract/jest-transform',
	},
	moduleNameMapper: {
		// `./X.css` is a vanilla-extract module unless it is the stylesheet entry; the preset stubs every `.css`
		'^(\\.{1,2}/(?:.*/)?(?!index\\b)\\w+)\\.css$': '$1.css.ts',
	},
} satisfies Config;
