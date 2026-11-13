import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

import { composeStories } from '@storybook/react';
import type { ComponentType } from 'react';

const SRC = join(__dirname, '..');

type ComposedStory = ComponentType & { play?: unknown; tags: string[]; run: () => Promise<void> };

const storyFiles = (directory: string): string[] =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		if (entry.isDirectory()) return storyFiles(join(directory, entry.name));
		return entry.name.endsWith('.stories.tsx') ? [join(directory, entry.name)] : [];
	});

/** Every story of every `*.stories.tsx` in the package, composed with its meta and ready to render or `run()`. */
export const loadStories = () =>
	storyFiles(SRC).flatMap((file) =>
		// oxlint-disable-next-line import/no-dynamic-require -- the story files are discovered on disk
		Object.entries(composeStories(require(file)) as Record<string, ComposedStory>).map(([name, Story]) => ({
			title: `${relative(SRC, file)} ${name}`,
			Story,
		})),
	);
