import { Controls, Description, Heading, Markdown, Primary, Stories, Subtitle, Title, useOf } from '@storybook/addon-docs/blocks';

/**
 * Storybook's default docs page, with the component's usage guidance (the `docs.usage` parameter, in Markdown)
 * between its description and its primary story.
 */
const DocsPage = () => {
	const {
		csfFile: { stories },
		preparedMeta: { parameters },
	} = useOf('meta', ['meta']);
	const isSingleStory = Object.keys(stories).length === 1;
	const usage: string | undefined = parameters.docs?.usage;

	return (
		<>
			<Title />
			<Subtitle />
			<Description of='meta' />
			{usage && (
				<>
					<Heading>Usage</Heading>
					<Markdown>{usage}</Markdown>
				</>
			)}
			{isSingleStory && <Description of='story' />}
			<Primary />
			<Controls />
			{!isSingleStory && <Stories />}
		</>
	);
};

export default DocsPage;
