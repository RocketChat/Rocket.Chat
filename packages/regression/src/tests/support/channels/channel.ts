import type { APIRequestContext, Page } from '@playwright/test';

export async function deleteChannel(page: Page, channelName: string) {
	await page.getByRole('link', { name: `${channelName}` }).click();
	await page.getByRole('button', { name: 'Room Information' }).click();
	await page.getByRole('button', { name: 'Delete' }).click();
	await page.getByRole('button', { name: 'Yes, delete it!' }).click();
}

export async function createChannelAPI(request: APIRequestContext, channel: string) {
	await request.post(`/api/v1/channels.create`, {
		headers: {
			'X-Auth-Token': `${process.env.API_TOKEN}`,
			'X-User-Id': `${process.env.USERID}`,
		},
		data: {
			name: `${channel}`,
		},
	});
}
export async function deleteChannelAPI(request: APIRequestContext, channel: string) {
	await request.post(`/api/v1/channels.delete`, {
		headers: {
			'X-Auth-Token': `${process.env.API_TOKEN}`,
			'X-User-Id': `${process.env.USERID}`,
		},
		data: {
			roomName: `${channel}`,
		},
	});
}
