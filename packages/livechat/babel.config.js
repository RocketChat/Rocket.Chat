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
		['@babel/plugin-transform-react-jsx', {
			pragma: 'h',
			pragmaFrag: 'Fragment',
		}],
	],
	assumptions: {
		setPublicClassFields: true,
	},
};
