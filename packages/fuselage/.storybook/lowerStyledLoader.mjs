// Runs `lowerStyled` in Storybook's webpack build, which compiles `src` rather than the library bundle
export default function lowerStyledLoader(source) {
	const callback = this.async();
	import('../lowerStyled.ts')
		.then(({ lowerModule }) => lowerModule(source, this.resourcePath))
		.then((result) => callback(null, result ? result.code : source))
		.catch(callback);
}
