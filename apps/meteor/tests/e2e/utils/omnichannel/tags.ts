import { BaseTest } from '../test';

export const createTag = async (api: BaseTest['api'], name: string) =>
	api.post('/method.call/livechat:saveTag', {
		message: JSON.stringify({ msg: 'method', id: '33', method: 'livechat:saveTag', params: [null, { name, description: '' }, []] }),
	});
