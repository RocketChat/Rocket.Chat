const request = require('supertest');
const { expect } = require('chai');
const path = require('path');
const app = require(path.resolve(__dirname, '../../../../app'));  

describe('GET /api/v1/chat.getPinnedMessages', function() {
  it('deve retornar as mensagens fixadas ordenadas corretamente pelo parâmetro sort', async function() {
    const res = await request(app)
      .get('/api/v1/chat.getPinnedMessages?roomId=room123&sort={"ts":-1}') 
      .expect(200);  

    
    const messages = res.body.messages;
    

    expect(messages[0].ts).to.be.greaterThan(messages[1].ts);  
  });
});
