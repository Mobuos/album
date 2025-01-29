import supertest from 'supertest';
import server from './backend/server.js';
import fs from 'node:fs'
import path from 'node:path'
import { expect } from "chai";

const __dirname = import.meta.dirname;

const requestWithSupertest = supertest(server);

// Adjust photo file path for the test
const photoFilePath = path.join(__dirname, 'test_tulips.png');

// Use the resolved path in your test
if (!fs.existsSync(photoFilePath)) {
    throw new Error(`Test photo file not found: ${photoFilePath}`);
}

describe('API Routes', () => {
    // TODO: Test errors as well? Only status maybe
    
    // Create test user
    let userId;
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

    describe('/albums', () => {
        
        let albumIds = [];
        const albumData = [
            { title: "Album 1", description: "Description for the first album."},
            { title: "Album 2", description: "Description for the other album."},
        ];

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
        let photoIds = [];
        const photos = [
            {
                title: "Test Photo 1",
                description: "A test photo 1",
                date: "2025-01-27",
                color: "#FFFFFF",
                filePath: path.join(__dirname, 'test_tulips.png'),
            },
            {
                title: "Test Photo 2",
                description: "A test photo 2",
                date: "2025-01-28",
                color: "#000000",
                filePath: path.join(__dirname, 'test_tulips.png'),
            },
        ];
    
        // Create a test album
        before(async () => {
            const albumResponse = await requestWithSupertest
                .post('/albums')
                .send({
                    title: "Test Album",
                    description: "A test album for photos",
                    userId: userId,
                });
    
            expect(albumResponse.status).to.equal(201);
            albumId = albumResponse.body.id;
            expect(albumId).to.not.be.undefined;
        });
    
        it("should POST /albums/:albumId/photos", async () => {
            for (const photo of photos) {
                if (!fs.existsSync(photo.filePath)) {
                    throw new Error(`Test photo file not found: ${photo.filePath}`);
                }
    
                const response = await requestWithSupertest
                    .post(`/albums/${albumId}/photos`)
                    .field('title', photo.title)
                    .field('description', photo.description)
                    .field('date', photo.date)
                    .field('color', photo.color)
                    .attach('photo', photo.filePath);
                
                expect(response.status).to.equal(201);
                expect(response.body).to.have.property('id');
                expect(response.body.title).to.equal(photo.title);
                expect(response.body.description).to.equal(photo.description);
                const expectedDate = new Date(photo.date).toISOString();
                expect(response.body.date).to.equal(expectedDate);
                expect(response.body.color).to.equal(photo.color);
                expect(response.body.filePath).to.include('/uploads/');

                photoIds.push(response.body.id);
            }
        });
    
        it("should GET /albums/:albumId/photos", async () => {
            const response = await requestWithSupertest.get(`/albums/${albumId}/photos`);
            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('array');
            expect(response.body.length).to.equal(photos.length);
    
            photos.forEach((photo, index) => {
                const foundPhoto = response.body.find(p => p.title === photo.title);
                expect(foundPhoto).to.not.be.undefined;
                expect(foundPhoto.description).to.equal(photo.description);
                expect(foundPhoto.date).to.equal(new Date(photo.date).toISOString());
                expect(foundPhoto.color).to.equal(photo.color);
                expect(foundPhoto.filePath).to.include('/uploads/');
            });
    
            const returnedTitles = response.body.map(p => p.title);
            const expectedTitles = photos.map(photo => photo.title);
            expect(returnedTitles).to.have.members(expectedTitles);
        });

        it("should GET /albums/:albumId/photos/:photoId for each photo", async () => {
            for (let i = 0; i < photos.length; i++) {
                const photoId = photoIds[i];
                const expectedPhoto = photos[i];
    
                const response = await requestWithSupertest.get(`/albums/${albumId}/photos/${photoId}`);

                // await new Promise((resolve) => setInterval(resolve, 30000));

                
                console.log(response.body);
                expect(response.status).to.equal(200);
                expect(response.body).to.be.an('object');
                
                // Validate photo data
                expect(response.body.id).to.equal(photoId);
                expect(response.body.title).to.equal(expectedPhoto.title);
                expect(response.body.description).to.equal(expectedPhoto.description);
                expect(response.body.date).to.equal(new Date(expectedPhoto.date).toISOString());
                expect(response.body.color).to.equal(expectedPhoto.color);
                expect(response.body.filePath).to.include('/uploads/');
            }
        });
    });    
});