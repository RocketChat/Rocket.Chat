import type { Meta, StoryObj } from '@storybook/react';

import LocalSearchIndexStatus from './LocalSearchIndexStatus';

const meta = {
	component: LocalSearchIndexStatus,
	args: { encryptedAtRest: true },
} satisfies Meta<typeof LocalSearchIndexStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Locked: Story = { args: { status: 'locked' } };
export const Unavailable: Story = { args: { status: 'unavailable' } };
export const MemoryOnly: Story = { args: { encryptedAtRest: false } };
const progress = { status: 'indexing', rooms: 40, roomsDone: 12, roomsSkipped: 0, indexed: 300, pendingDecrypt: 0 } as const;
export const Indexing: Story = { args: { progress } };
export const BackingOff: Story = { args: { progress: { ...progress, status: 'backing-off' } } };
export const MemoryOnlyWhileIndexing: Story = { args: { progress, encryptedAtRest: false } };
export const Complete: Story = { args: { progress: { ...progress, status: 'done', roomsDone: 40 } } };
export const Stopped: Story = { args: { progress: { ...progress, status: 'stopped' } } };
