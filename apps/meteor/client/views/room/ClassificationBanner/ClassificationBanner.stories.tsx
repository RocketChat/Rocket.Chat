import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import ClassificationBanner from './ClassificationBanner';
import type { ClassificationBannersConfig } from './lib/types';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';

const config: ClassificationBannersConfig = {
	version: 1,
	enabled: true,
	banner: {
		style: 'classic',
		uppercase: true,
		monospace: false,
		delimiter: ' // ',
		colorMode: 'highest',
		fallbackText: 'NO CLASSIFICATION DATA',
		fallbackColor: '#6C727A',
	},
	attributes: [
		{
			id: 'classification',
			source: 'clearance.level',
			label: 'Classification level',
			showInBanner: true,
			showLabel: false,
			bannerLabel: '',
			labelSeparator: '',
			valueSeparator: '/',
			sortAlpha: false,
			groupThreshold: 0,
			multipleLabel: '',
			drivesColor: true,
			values: [
				{ source: 'TS-SCI', label: 'TOP SECRET//SCI', color: '#fce100' },
				{ source: 'TS', label: 'TOP SECRET', color: '#ff8c00' },
				{ source: 'S', label: 'SECRET', color: '#c8102e' },
				{ source: 'C', label: 'CONFIDENTIAL', color: '#0033a0' },
				{ source: 'CUI', label: 'CUI', color: '#502b85' },
				{ source: 'U', label: 'UNCLASSIFIED', color: '#007a33' },
			],
		},
		{
			id: 'sar',
			source: 'access.programs',
			label: 'Special access programs',
			showInBanner: true,
			showLabel: true,
			bannerLabel: 'SAR',
			labelSeparator: '-',
			valueSeparator: '/',
			sortAlpha: true,
			groupThreshold: 4,
			multipleLabel: 'MULTIPLE PROGRAMS',
			drivesColor: false,
			values: [
				{ source: 'SAP-1042', label: 'APPLES', color: '#c8102e' },
				{ source: 'SAP-2271', label: 'BANANAS', color: '#ff8c00' },
				{ source: 'SAP-3380', label: 'ORANGES', color: '#0033a0' },
				{ source: 'SAP-4419', label: 'PEACHES', color: '#007a33' },
				{ source: 'SAP-5567', label: 'GRAPES', color: '#502b85' },
			],
		},
		{
			id: 'relto',
			source: 'dissem.relto',
			label: 'Releasable to',
			showInBanner: true,
			showLabel: true,
			bannerLabel: 'RELTO',
			labelSeparator: ' ',
			valueSeparator: '/',
			sortAlpha: false,
			groupThreshold: 0,
			multipleLabel: '',
			drivesColor: false,
			values: [
				{ source: 'USA', label: 'USA', color: '#0033a0' },
				{ source: 'FVEY', label: 'FVEY', color: '#007a33' },
				{ source: 'NATO', label: 'NATO', color: '#502b85' },
			],
		},
	],
};

const roomAttributes = [
	{ key: 'clearance.level', values: ['TS'] },
	{ key: 'access.programs', values: ['SAP-1042', 'SAP-2271', 'SAP-3380'] },
	{ key: 'dissem.relto', values: ['USA'] },
];

const roomArgs: Partial<IRoom> = {
	_id: 'classifiedRoom',
	t: 'p' as RoomType,
	name: 'operation-nightingale',
	fname: 'operation-nightingale',
	abacAttributes: roomAttributes,
};

const withBanner = (bannerConfig: ClassificationBannersConfig, room: Partial<IRoom> = roomArgs) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('ABAC_Enabled', true)
		.withSetting('ABAC_Classification_Banners_Enabled', true)
		.withSetting('ABAC_Classification_Banners_Config', JSON.stringify(bannerConfig))
		.withEndpoint('GET', '/v1/licenses.info', () => ({
			license: createFakeLicenseInfo({ activeModules: ['abac'] }),
		}))
		.wrap((children) => <FakeRoomProvider roomOverrides={room}>{children}</FakeRoomProvider>)
		.buildStoryDecorator();

export default {
	component: ClassificationBanner,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [withBanner(config)],
} satisfies Meta<typeof ClassificationBanner>;

export const Classic: StoryObj<typeof ClassificationBanner> = {};

export const TopSecret: StoryObj<typeof ClassificationBanner> = {
	decorators: [withBanner(config, { ...roomArgs, abacAttributes: [{ key: 'clearance.level', values: ['TS-SCI'] }] })],
};

export const Unclassified: StoryObj<typeof ClassificationBanner> = {
	decorators: [withBanner(config, { ...roomArgs, abacAttributes: [{ key: 'clearance.level', values: ['U'] }] })],
};

export const GroupedPrograms: StoryObj<typeof ClassificationBanner> = {
	decorators: [
		withBanner(config, {
			...roomArgs,
			abacAttributes: [
				{ key: 'clearance.level', values: ['S'] },
				{ key: 'access.programs', values: ['SAP-1042', 'SAP-2271', 'SAP-3380', 'SAP-4419', 'SAP-5567'] },
			],
		}),
	],
};

export const Fallback: StoryObj<typeof ClassificationBanner> = {
	decorators: [withBanner(config, { ...roomArgs, abacAttributes: [{ key: 'unmapped.attribute', values: ['whatever'] }] })],
};
