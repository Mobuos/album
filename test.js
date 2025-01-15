import supertest from 'supertest';
import server from './backend/server.js';
import { expect } from "chai";

const requestWithSupertest = supertest(server);

describe('Simple API Test', () => {
    it('GET /test should return a hello message', async () => {
        const res = await requestWithSupertest.get('/test');
        expect(res.status).to.equal(200);
        expect(res.type).to.include('json');
        expect(res.body).to.have.property('message');
        expect(res.body.message).to.include('Hello');
        console.debug(res.body);
    });
});

describe('Test Counter API', () => {
    it('GET /counter should return initial value of 0', async () => {
        const res = await requestWithSupertest.get('/counter');
        expect(res.status).to.equal(200);
        expect(res.type).to.include('json');
        expect(res.body).to.have.property('value', 0);
    });
    it('POST /counter should increase value of counter by one', async () => {
        const res = await requestWithSupertest.post('/counter');
        expect(res.status).to.equal(200);
        expect(res.type).to.include('json');
        expect(res.body).to.have.property('value', 1);
    });
    it('multiple POST /counter should increase the counter accordingly', async () => {
        const initialres = await requestWithSupertest.get('/counter');
        var initialCounter = initialres.body.value;

        const numRequests = 3;

        for (let i = 0; i < numRequests; i++) {
            await requestWithSupertest.post('/counter');
        }

        const res = await requestWithSupertest.get('/counter');
        expect(res.status).to.equal(200);
        expect(res.type).to.include('json');
        expect(res.body).to.have.property('value', initialCounter + numRequests);
    });
});