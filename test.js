import supertest from 'supertest';
import server from './backend/server.js';
import fs from 'node:fs'
import path from 'node:path'
import { expect } from "chai";

import { fileURLToPath } from 'node:url';
const __dirname = import.meta.dirname;

const requestWithSupertest = supertest(server);

// Adjust photo file path for the test
const photoFilePath = path.join(__dirname, 'test_tulips.png');
console.log(`[Test] Resolved photo file path: ${photoFilePath}`);

// Use the resolved path in your test
if (!fs.existsSync(photoFilePath)) {
    throw new Error(`Test photo file not found: ${photoFilePath}`);
}

console.log(`[Execution Context] dirname: ${__dirname}`);
console.log(`[Execution Context] process.cwd(): ${process.cwd()}`);

describe('API Routes', () => {
    // TODO: Test errors as well? Only status maybe
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

        it("should GET /album/:albumId", async () => {
            for (let i = 0; i < albumIds.length; i++) {
                const response = await requestWithSupertest.get(`/albums/${albumIds[i]}`);
    
                expect(response.status).to.equal(200);
                expect(response.body).to.have.property('id', albumIds[i]);
                expect(response.body.title).to.equal(albumData[i].title);
                expect(response.body.description).to.equal(albumData[i].description);
            }
        });

        it("should PATCH /albums/:albumId", async () => {
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

        it("should DELETE /albums/:albumId", async () => {
            for (let i = 0; i < albumIds.length; i++) {
                const albumId = albumIds[i];
        
                const deleteResponse = await requestWithSupertest.delete(`/albums/${albumId}`);
                expect(deleteResponse.status).to.equal(200);
                expect(deleteResponse.body.message).to.equal('Album successfully deleted');
        
                // Check album is gone with GET /albums/:albumId
                const getResponse = await requestWithSupertest.get(`/albums/${albumId}`);
                expect(getResponse.status).to.equal(404);
                expect(getResponse.body.error).to.equal('Album not found');
            }
        
            // Check that user has no albums with GET /albums
            const getAlbumsResponse = await requestWithSupertest.get('/albums').query({ userId });
            expect(getAlbumsResponse.status).to.equal(200);
            expect(getAlbumsResponse.body).to.be.an("array").that.is.empty;

            albumData.length = 0;
            albumIds.length = 0;
        });
    });

    describe('/albums/:albumId/photos', () => {
        let albumId;

        before(async () => {
            // Create an album dynamically before testing photo upload
            const albumResponse = await requestWithSupertest
                .post('/albums')
                .send({
                    title: "Test Album",
                    description: "A test album for photos",
                    userId: 1, // Replace with a valid user ID
                });
    
            expect(albumResponse.status).to.equal(201);
            albumId = albumResponse.body.id; // Save the created album's ID
            expect(albumId).to.not.be.undefined;
        });

        it("should POST /albums/:albumId/photos", async () => {
            const photoFilePath = path.join(__dirname, 'test_tulips.png');
            const photoTitle = "Test Photo";
            const photoDescription = "A test photo";
            const photoDate = "2025-01-27"; // Valid ISO 8601 date
            const photoColor = "#FFFFFF"; // Valid HEX color
    
            if (!fs.existsSync(photoFilePath)) {
                throw new Error(`Test photo file not found: ${photoFilePath}`);
            }
                
            const response = await requestWithSupertest
                .post(`/albums/${albumId}/photos`)
                .field('title', photoTitle)
                .field('description', photoDescription)
                .field('date', photoDate)
                .field('color', photoColor)
                .attach('photo', photoFilePath);

            expect(response.status).to.equal(201);
            expect(response.body).to.have.property('id');
            expect(response.body.title).to.equal(photoTitle);
            expect(response.body.description).to.equal(photoDescription);
            const expectedDate = new Date(photoDate).toISOString(); // Convert to ISO 8601 format
            expect(response.body.date).to.equal(expectedDate);
            expect(response.body.color).to.equal(photoColor);
            expect(response.body.filePath).to.include('/uploads/');
        })
    })
});