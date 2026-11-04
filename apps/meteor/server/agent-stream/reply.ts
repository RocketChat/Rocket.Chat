const CHARS_PER_TOKEN = 4;

const head = `## How the release pipeline works

The pipeline takes a merged change and turns it into a published build. Each stage reads the output of the stage before it, so a failure stops everything that follows.

The stages are:

- **Build**: compile the packages and the server bundle.
- **Test**: run the unit, API and end-to-end suites.
- **Package**: build the Docker images for each architecture.
- **Publish**: push the images and the npm packages.
- **Notify**: post the release notes to the community.

A minimal stage looks like this:

\`\`\`ts
type Stage = {
	name: string;
	run: (input: Artifact) => Promise<Artifact>;
};

export async function runPipeline(stages: Stage[], input: Artifact): Promise<Artifact> {
	let artifact = input;
	for (const stage of stages) {
		console.log(\`starting \${stage.name}\`);
		artifact = await stage.run(artifact);
	}
	return artifact;
}
\`\`\`

`;

const filler =
	'Each stage writes its logs to the job output, and the pipeline keeps the artifacts for seven days so a failed run can be inspected later. ';

/** The fixed reply of the fake producer: markdown with a list and a code block, cut into tokens of four ASCII characters. */
export const replyTokens = (tokenCount: number): string[] => {
	const length = tokenCount * CHARS_PER_TOKEN;
	let text = head;
	while (text.length < length) {
		text += filler;
	}
	text = text.slice(0, length);

	const tokens: string[] = [];
	for (let i = 0; i < length; i += CHARS_PER_TOKEN) {
		tokens.push(text.slice(i, i + CHARS_PER_TOKEN));
	}
	return tokens;
};
