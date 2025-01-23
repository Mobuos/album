import supertest from 'supertest';
import server from './backend/server.js';
import { expect } from "chai";

const requestWithSupertest = supertest(server);

describe('API Routes', () => {
    describe('/albums', () => {
        let userId;

        let albumIds = [];
        const albumData = [
            { title: "Album 1", description: "Description for the first album."},
            { title: "Album 2", description: "Description for the other album."},
        ];

        before(async () => {
            try { 
                const userResponse = await requestWithSupertest.post('/users').send({
                    email: "testuser@example.com",
                    password: "batatá24*!@#"
                });

                expect(userResponse.status).to.equal(201);
                userId = userResponse.body.id;
            } catch (error) {
                console.log("Reminder: Check that you are resetting the data base between tests!")
                console.log("(e.g: docker compose -f docker-compose.test.yml rm -fsv)")
                throw error
            }
        });

        it("should POST /albums", async () => {
            for (const album of albumData) {
                const response = await requestWithSupertest.post('/albums').send({
                    title: album.title,
                    description: album.description,
                    userId,
                });

                expect(response.status).to.equal(201);
                expect(response.body).to.have.property('id');
                expect(response.body.title).to.equal(album.title);

                albumIds.push(response.body.id);
            }
        });

        it("should GET /albums", async () => {
            const getResponse = await requestWithSupertest.get('/albums').query({
                userId,
            });

            expect(getResponse.status).to.equal(200);
            expect(getResponse.body).to.be.an("array");
            expect(getResponse.body.length).to.equal(albumData.length);

            albumData.forEach((album, index) => {
                const found = getResponse.body.find(a => a.title === album.title);
                expect(found).to.not.be.undefined;
                expect(found.description).to.equal(album.description);
                expect(found.id).to.equal(albumIds[index]);
            })

            const returnedIds = getResponse.body.map(a => a.id);
            expect(returnedIds).to.have.members(albumIds);
        });

        it("should GET /album/:id", async () => {
            for (let i = 0; i < albumIds.length; i++) {
                const response = await requestWithSupertest.get(`/albums/${albumIds[i]}`);
    
                expect(response.status).to.equal(200);
                expect(response.body).to.have.property('id', albumIds[i]);
                expect(response.body.title).to.equal(albumData[i].title);
                expect(response.body.description).to.equal(albumData[i].description);
            }
        });
    });
});

// describe('Simple API Test', () => {
//     it('GET /test should return a hello message', async () => {
//         const res = await requestWithSupertest.get('/test');
//         expect(res.status).to.equal(200);
//         expect(res.type).to.include('json');
//         expect(res.body).to.have.property('message');
//         expect(res.body.message).to.include('Hello');
//         console.debug(res.body);
//     });
// });

// describe('Test Counter API', () => {
//     it('GET /counter should return initial value of 0', async () => {
//         const res = await requestWithSupertest.get('/counter');
//         expect(res.status).to.equal(200);
//         expect(res.type).to.include('json');
//         expect(res.body).to.have.property('value', 0);
//     });
//     it('POST /counter should increase value of counter by one', async () => {
//         const res = await requestWithSupertest.post('/counter');
//         expect(res.status).to.equal(200);
//         expect(res.type).to.include('json');
//         expect(res.body).to.have.property('value', 1);
//     });
//     it('multiple POST /counter should increase the counter accordingly', async () => {
//         const initialres = await requestWithSupertest.get('/counter');
//         var initialCounter = initialres.body.value;

//         const numRequests = 3;

//         for (let i = 0; i < numRequests; i++) {
//             await requestWithSupertest.post('/counter');
//         }

//         const res = await requestWithSupertest.get('/counter');
//         expect(res.status).to.equal(200);
//         expect(res.type).to.include('json');
//         expect(res.body).to.have.property('value', initialCounter + numRequests);
//     });
// });