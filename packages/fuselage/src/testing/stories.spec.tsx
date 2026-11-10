import { loadStories } from './loadStories';

// The G0 characterization specs are `play` functions in stories tagged `g0`, so one source runs here in jsdom (runtime build)
// and in the browser against the compiled zero-runtime Storybook (`yarn test:stories`). Demo plays, such as the Slider one,
// are not specs and stay out.
const specs = loadStories().filter(({ Story }) => Story.play && Story.tags.includes('g0'));

describe('[Story play functions]', () => {
	const flag = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };

	beforeAll(() => {
		// The play functions drive userEvent themselves and wait for what they assert
		flag.IS_REACT_ACT_ENVIRONMENT = false;
	});

	afterAll(() => {
		flag.IS_REACT_ACT_ENVIRONMENT = true;
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('finds the specs', () => {
		expect(specs.length).toBeGreaterThan(0);
	});

	test.each(specs.map(({ title, Story }) => [title, Story] as const))('%s', async (_title, Story) => {
		await Story.run();
	});
});
