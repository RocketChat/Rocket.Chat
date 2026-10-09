import type { ClassificationBannerPayload, IRoom, RoomType } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import ClassificationBanner from './ClassificationBanner';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';

const roomArgs: Partial<IRoom> = {
	_id: 'classifiedRoom',
	t: 'p' as RoomType,
	name: 'operation-nightingale',
	fname: 'operation-nightingale',
	abacAttributes: [{ key: 'clearance.level', values: ['TS'] }],
};

const createBanner = (text: string, backgroundColor: string, color: string): ClassificationBannerPayload => ({
	text,
	segments: [],
	backgroundColor,
	color,
	style: 'classic',
	uppercase: true,
	monospace: false,
});

const withBanner = (classificationBanner: ClassificationBannerPayload) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('ABAC_Enabled', true)
		.withEndpoint('GET', '/v1/licenses.info', () => ({
			license: createFakeLicenseInfo({ activeModules: ['abac'] }),
		}))
		.withEndpoint('GET', '/v1/rooms.info', () => ({ room: undefined, classificationBanner }))
		.wrap((children) => <FakeRoomProvider roomOverrides={roomArgs}>{children}</FakeRoomProvider>)
		.buildStoryDecorator();

export default {
	component: ClassificationBanner,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [withBanner(createBanner('TOP SECRET // SAR-APPLES/BANANAS/ORANGES // RELTO USA', '#ff8c00', '#1F2329'))],
} satisfies Meta<typeof ClassificationBanner>;

export const Classic: StoryObj<typeof ClassificationBanner> = {};

export const TopSecret: StoryObj<typeof ClassificationBanner> = {
	decorators: [withBanner(createBanner('TOP SECRET//SCI', '#fce100', '#1F2329'))],
};

export const Unclassified: StoryObj<typeof ClassificationBanner> = {
	decorators: [withBanner(createBanner('UNCLASSIFIED', '#007a33', '#FFFFFF'))],
};

export const GroupedPrograms: StoryObj<typeof ClassificationBanner> = {
	decorators: [withBanner(createBanner('SECRET // SAR-MULTIPLE PROGRAMS', '#c8102e', '#FFFFFF'))],
};

export const Fallback: StoryObj<typeof ClassificationBanner> = {
	decorators: [withBanner(createBanner('NO CLASSIFICATION DATA', '#6C727A', '#FFFFFF'))],
};
