module.exports = {
	presets: [['@babel/preset-env', { loose: true }], '@babel/preset-typescript'],
	plugins: [
		['@babel/plugin-transform-class-properties', { loose: true }],
		['@babel/plugin-transform-private-methods', { loose: true }],
		['@babel/plugin-transform-private-property-in-object', { loose: true }],
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
};
