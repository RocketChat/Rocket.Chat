import { getCredentials, api, request, credentials } from '../api-data';

export const changeAgentStatus = async (agentId: string, status: string) => {
    await request
        .post(api('livechat/agent.status'))
        .set(credentials)
        .send({ status, agentId })
        .expect(200);
};
