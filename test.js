const server = require('./backend/server.js');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);

describe('Teste', () => {
    it('GET /test should have a message', async () => {
        const res = await requestWithSupertest.get('/test');
        expect(res.status).toEqual(200);
        expect(res.type).toEqual(expect.stringContaining('json'));
        expect(res.body).toHaveProperty('message')
    });
});