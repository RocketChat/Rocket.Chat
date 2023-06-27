import { APIRequestContext, Page } from '@playwright/test';

export async function deleteDiscussion(page: Page, discussionName: string) {
  await page.getByRole('link', { name: `${discussionName}` }).click();
  await page.getByRole('button', { name: 'Room Information' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Yes, delete it!' }).click();
}

export async function deleteDiscussionAPI(request: APIRequestContext, channel: string) {
  await request.post(`/api/v1/groups.delete`, {
    headers: {
      'X-Auth-Token': `${process.env.API_TOKEN}`,
      'X-User-Id': `${process.env.USERID}`,
    },
    data: {
      'roomName': `${channel}`
    }
  });
}