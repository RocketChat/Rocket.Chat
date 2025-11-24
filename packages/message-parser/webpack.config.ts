import { resolve } from 'node:path';

export default [
	{
		entry: './src/index.ts',
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: {
						loader: 'ts-loader',
						options: {
							configFile: resolve('./tsconfig.build.json'),
						},
					},
					include: [resolve('./src')],
					exclude: [resolve('./tests')],
				},
				{
					test: /\.pegjs$/,
					use: ['@rocket.chat/peggy-loader'],
				},
			],
		},
		resolve: {
			extensions: ['.ts', '.js', '.pegjs'],
		},
		mode: 'production',
		experiments: {
			outputModule: true,
		},
		output: {
			path: resolve('./dist'),
			filename: 'messageParser.js',
			library: {
				type: 'module',
			},
		},
	},
];
