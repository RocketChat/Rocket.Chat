import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import request from 'supertest';
import { LivechatRooms } from '@rocket.chat/models';
import '../../../../../../app/livechat/imports/server/rest/rooms';
import { setupServer, createTestUser } from '../helpers/testhelpers';
type UserStatus = 'online' | 'offline' | 'away' | 'busy';

describe('GET /api/v1/livechat/rooms', () => {
  let server: any;
  let testUserToken: string;
  let testUserId: string;

  before(async () => {
    server = await setupServer();
    const testUser = await createTestUser({
      permissions: ['view-livechat-rooms', 'view-l-room'],
    });
    testUserToken = testUser.authToken;
    testUserId = testUser.userId;
    await LivechatRooms.insertMany([
      {
        _id: 'room1',
        t: 'l',
        fname: 'Test Room',
        customFields: { customField: 'valor1' },
        msgs: 0,
        u: { _id: testUserId, username: `test_user_${testUserId}` },
        usersCount: 1,
        ts: new Date(),
        _updatedAt: new Date(),
        open: true,
        v: {
          _id: 'visitor1',
          name: 'Visitor 1',
          status: 'offline' as UserStatus,
          username: 'visitor1',
          token: 'visitorToken1',
          activity: [] as string[],
        },
      },
      {
        _id: 'room2',
        t: 'l',
        fname: 'Outra Sala',
        customFields: { customField: 'valor2' },
        msgs: 0,
        u: { _id: testUserId, username: `test_user_${testUserId}` },
        usersCount: 1,
        ts: new Date(),
        _updatedAt: new Date(),
        open: true,
        v: {
          _id: 'visitor2',
          name: 'Visitor 2',
          status: 'offline' as UserStatus,
          username: 'visitor2',
          token: 'visitorToken2',
          activity: [] as string[],
        },
      },
    ]);
  });

  after(async () => {
    await LivechatRooms.deleteMany({});
    await server.close();
  });

  // Primeiro Ciclo: Filtragem e seleção de campos
  describe('Filtro e seleção de campos', () => {
    it('deve retornar apenas a sala que corresponde ao filtro de query e somente os campos especificados', async () => {
      const queryFilter = JSON.stringify({ roomName: 'Test Room' });
      const fieldsFilter = JSON.stringify({ roomName: 1 });
      const response = await request(server)
        .get('/api/v1/livechat/rooms')
        .set('X-Auth-Token', testUserToken)
        .set('X-User-Id', testUserId)
        .query({ query: queryFilter, fields: fieldsFilter });
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('rooms').that.is.an('array');
      expect(response.body.rooms).to.have.lengthOf(1);
      const room = response.body.rooms[0];
      expect(room).to.have.property('roomName', 'Test Room');
      expect(Object.keys(room)).to.deep.equal(['roomName']);
    });
  });

  // Segundo Ciclo: Validação de customFields
  describe('Validação de customFields', () => {
    it('deve retornar erro 400 se customFields não for um JSON válido', async () => {
      const invalidCustomFields = "{ invalid json }";
      const response = await request(server)
        .get('/api/v1/livechat/rooms')
        .set('X-Auth-Token', testUserToken)
        .set('X-User-Id', testUserId)
        .query({ customFields: invalidCustomFields });
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.match(/customFields/);
    });
  });
});
