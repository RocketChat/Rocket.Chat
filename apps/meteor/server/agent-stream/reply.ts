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

const thinking =
	'Let me read the code around the login handler and compare it with the report. The token check looks like the place to start. ';

// cuts `lead`, then `repeat` as often as needed, into `tokenCount` tokens of four ASCII characters
const slice = (lead: string, repeat: string, tokenCount: number): string[] => {
	const length = tokenCount * CHARS_PER_TOKEN;
	let text = lead;
	while (text.length < length) {
		text += repeat;
	}
	return Array.from({ length: tokenCount }, (_, i) => text.slice(i * CHARS_PER_TOKEN, (i + 1) * CHARS_PER_TOKEN));
};

export type ReplyStep =
	{ kind: 'thinking'; text: string; first: boolean } | { kind: 'tool'; title: string } | { kind: 'output'; text: string; first: boolean };

/** The fixed reply of the fake producer: 15% thinking, a tool call, 15% thinking, then markdown with a list and a code block. */
export const replyScript = (tokenCount: number): ReplyStep[] => {
	const thinkingTokens = Math.round(tokenCount * 0.15);
	const think = (): ReplyStep[] => slice('', thinking, thinkingTokens).map((text, i) => ({ kind: 'thinking', text, first: i === 0 }));
	const output = slice(head, filler, tokenCount - 2 * thinkingTokens).map((text, i): ReplyStep => ({
		kind: 'output',
		text,
		first: i === 0,
	}));
	return [...think(), { kind: 'tool', title: 'Search the codebase for the login handler' }, ...think(), ...output];
};
