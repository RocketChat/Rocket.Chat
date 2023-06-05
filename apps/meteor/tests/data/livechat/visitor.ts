import { ILivechatVisitor } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { api, credentials, request } from '../api-data';

export const getLivechatVisitorByToken = async (token: string): Promise<ILivechatVisitor> => {
    const response = await request.get(api(`livechat/visitor/${token}`)).set(credentials).expect(200);
    expect(response.body).to.have.property('visitor');
    return response.body.visitor;
}
