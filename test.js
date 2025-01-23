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

        it("should PATCH /albums/:id", async () => {
            const updatedAlbumData = [
                { title: "Updated Album 1", description: "Updated description for the first album." },
                { title: "Updated Album 2", description: "Updated description for the other album." }
            ];
        
            // Update every album using PATCH
            for (let i = 0; i < albumIds.length; i++) {
                const albumId = albumIds[i];
                const updateData = updatedAlbumData[i];
        
                const patchResponse = await requestWithSupertest.patch(`/albums/${albumId}`).send(updateData);
                expect(patchResponse.status).to.equal(200);
        
                // Update internal representation
                albumData[i].title = updateData.title;
                albumData[i].description = updateData.description;
        
                // Check return
                expect(patchResponse.body).to.have.property('id', albumId);
                expect(patchResponse.body.title).to.equal(updateData.title);
                expect(patchResponse.body.description).to.equal(updateData.description);
            }
        
            // Check if GET returns updated albums
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