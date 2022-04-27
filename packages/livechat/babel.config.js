module.exports = {
	presets: [
		['@babel/preset-env', {
			useBuiltIns: 'entry',
			corejs: 3,
		}],
	],
	plugins: [
		'@babel/plugin-proposal-class-properties',
		'@babel/plugin-proposal-object-rest-spread',
		['@babel/plugin-transform-react-jsx', { pragma: 'h', pragmaFrag: 'Fragment' }],
		['babel-plugin-jsx-pragmatic', {
			module: 'preact',
			import: 'h',
			export: 'h',
		}],
	],
	assumptions: {
		setPublicClassFields: true,
	},
};
