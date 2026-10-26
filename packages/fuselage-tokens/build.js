import { kebabCase } from 'change-case';
import StyleDictionary from 'style-dictionary';
import { minifyDictionary } from 'style-dictionary/utils';

StyleDictionary.registerTransformGroup({
	name: 'json/rocketchat',
	transforms: ['attribute/cti', 'name/pascal', 'color/hex'],
});

StyleDictionary.registerFormat({
	name: 'json/rocketchat',
	async format({ dictionary }) {
		const tokens = dictionary.tokens[Object.keys(dictionary.tokens)[0]];
		return `${JSON.stringify(minifyDictionary(tokens, false), null, 2)}\n`;
	},
});

StyleDictionary.registerTransform({
	name: 'name/kebab/rocketchat',
	type: 'name',
	transform: (token) => kebabCase(token.path.slice(1).join(' ')),
});

StyleDictionary.registerTransform({
	name: 'size/borderWidth/rocketchat',
	type: 'value',
	filter: (token) => token.type === 'borderWidth',
	transform: (token) => {
		if (token.original.value === 0) return token.value;
		return `${token.value}px`;
	},
});

StyleDictionary.registerTransform({
	name: 'size/spacing/rocketchat',
	type: 'value',
	filter: (token) => token.type === 'spacing',
	transform: (token) => `${token.value}px`,
});

StyleDictionary.registerTransform({
	name: 'fontFamily/css/rocketchat',
	type: 'value',
	filter: (token) => token.attributes.type === 'fontFamily',
	transform: (token) => {
		if (Array.isArray(token.value)) {
			return `(${token.value.map((font) => (font.match(/\s/) ? `'${font}'` : font)).join(', ')})`;
		}

		return token.value;
	},
});

StyleDictionary.registerTransformGroup({
	name: 'scss/rocketchat',
	transforms: [
		'attribute/cti',
		'name/kebab/rocketchat',
		'time/seconds',
		'html/icon',
		'size/pxToRem',
		'size/borderWidth/rocketchat',
		'size/spacing/rocketchat',
		'color/css',
		'asset/url',
		'fontFamily/css/rocketchat',
		'cubicBezier/css',
		'strokeStyle/css/shorthand',
		'border/css/shorthand',
		'typography/css/shorthand',
		'transition/css/shorthand',
		'shadow/css/shorthand',
	],
});

StyleDictionary.registerFormat({
	name: 'dts/rocketchat',
	async format({ dictionary }) {
		const moduleName = Object.keys(dictionary.tokens)[0];
		const tokens = minifyDictionary(dictionary.tokens[moduleName], false);

		return `export default ${moduleName};\ndeclare const ${moduleName}: ${JSON.stringify(tokens, null, 2)};`;
	},
});

console.log('Build started...');
console.log('\n==============================================');

// APPLY THE CONFIGURATION
// needs to be done _before_ applying the configuration
const StyleDictionaryExtended = new StyleDictionary('./config.js', {
	verbosity: 'verbose',
});

await StyleDictionaryExtended.hasInitialized;

// Build all platforms
await StyleDictionaryExtended.buildAllPlatforms();

console.log('\n==============================================');
console.log('\nBuild completed!');
