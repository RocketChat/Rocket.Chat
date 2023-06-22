module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				useBuiltIns: 'entry',
				corejs: 3,
				include: [
					'@babel/plugin-proposal-class-properties',
					'@babel/plugin-proposal-optional-chaining',
					'@babel/plugin-proposal-nullish-coalescing-operator',
				],
			},
		],
		'@babel/preset-typescript',
	],
	plugins: [
		['@babel/plugin-transform-react-jsx', { pragma: 'h', pragmaFrag: 'Fragment' }],
		[
			'babel-plugin-jsx-pragmatic',
			{
				module: 'preact',
				import: 'h',
				export: 'h',
			},
		],
	],
	assumptions: {
		setPublicClassFields: true,
		privateFieldsAsProperties: true,
	},
};
