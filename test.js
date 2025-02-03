import supertest from 'supertest';
import server from './backend/server.js';
import fs from 'node:fs'
import path from 'node:path'
import { expect } from "chai";

const __dirname = import.meta.dirname;

const request = supertest(server);

// Adjust photo file path for the test
const photoFilePath = path.join(__dirname, 'test_tulips.png');

// Use the resolved path in your test
if (!fs.existsSync(photoFilePath)) {
    throw new Error(`Test photo file not found: ${photoFilePath}`);
}

describe('API Routes', () => {
    // Create test user
    let userId;
    let token;

    before(async () => {
        try { 
            const user = {
                email: "testuser@example.com",
                password: "batatá24*!@#"
            }

            const userResponse = await request.post('/users').send(user);

            expect(userResponse.status).to.equal(201);
            userId = userResponse.body.id;

            const loginResponse = await request.post('/login').send(user);
            expect(loginResponse.status).to.equal(200);
            expect(loginResponse.body).to.have.property('token');
            token = loginResponse.body.token;
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
                const response = await request.post('/albums')
                    .set('Authorization', 'Bearer ' + token)
                    .send({
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
            const getResponse = await request.get('/albums').set('Authorization', 'Bearer ' + token);

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
                const response = await request.get(`/albums/${albumIds[i]}`).set('Authorization', 'Bearer ' + token);
    
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
        
                const patchResponse = await request.patch(`/albums/${albumId}`).send(updateData);
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
                const response = await request.get(`/albums/${albumIds[i]}`).set('Authorization', 'Bearer ' + token);
        
                expect(response.status).to.equal(200);
                expect(response.body).to.have.property('id', albumIds[i]);
                expect(response.body.title).to.equal(albumData[i].title);
                expect(response.body.description).to.equal(albumData[i].description);
            }
        });

        it("should DELETE /albums/:albumId", async () => {
            for (let i = 0; i < albumIds.length; i++) {
                const albumId = albumIds[i];
        
                const deleteResponse = await request.delete(`/albums/${albumId}`);
                expect(deleteResponse.status).to.equal(200);
        
                // Check album is gone with GET /albums/:albumId
                const getResponse = await request.get(`/albums/${albumId}`).set('Authorization', 'Bearer ' + token);
                expect(getResponse.status).to.equal(404);
            }
        
            // Check that user has no albums with GET /albums
            const getAlbumsResponse = await request.get('/albums').set('Authorization', 'Bearer ' + token);
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
            const albumResponse = await request
                .post('/albums')
                .set('Authorization', 'Bearer ' + token)
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
    
                const response = await request
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
            const response = await request.get(`/albums/${albumId}/photos`);
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
    
                const response = await request.get(`/albums/${albumId}/photos/${photoId}`);

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

        // TODO: Adicionar testes semelhantes a esses para os outros casos
        describe('PATCH /albums/:albumId/photos/:photoId', () => {
            let albumId;
            let photoId;
            const testPhoto = {
                title: "Another Title",
                description: "Initial description",
                date: "2025-01-27",
                color: "#123456",
                filePath: path.join(__dirname, 'test_tulips.png'),
            };
        
            before(async () => {
                // Create test album
                const albumResponse = await request
                    .post('/albums')
                    .set('Authorization', 'Bearer ' + token)
                    .send({ title: "Test Album 2", description: "For PATCH tests", userId });
        
                expect(albumResponse.status).to.equal(201);
                albumId = albumResponse.body.id;
        
                // Upload a test photo
                const photoResponse = await request
                    .post(`/albums/${albumId}/photos`)
                    .field('title', testPhoto.title)
                    .field('description', testPhoto.description)
                    .field('date', testPhoto.date)
                    .field('color', testPhoto.color)
                    .attach('photo', testPhoto.filePath);
        
                expect(photoResponse.status).to.equal(201);
                photoId = photoResponse.body.id;
            });
        
            it("should PATCH /albums/:albumId/photos/:photoId and update title only", async () => {
                const newTitle = "Updated Title";
        
                const response = await request
                    .patch(`/albums/${albumId}/photos/${photoId}`)
                    .send({ title: newTitle });
                
                testPhoto.title = newTitle
        
                expect(response.status).to.equal(200);
                expect(response.body.id).to.equal(photoId);
                expect(response.body.title).to.equal(testPhoto.title);
                expect(response.body.description).to.equal(testPhoto.description);
                expect(response.body.date).to.equal(new Date(testPhoto.date).toISOString());
                expect(response.body.color).to.equal(testPhoto.color);
                expect(response.body.filePath).to.include('/uploads/');
            });
        
            it("should PATCH /albums/:albumId/photos/:photoId and update multiple fields", async () => {
                const updates = {
                    title: "New Title",
                    description: "Updated description",
                    date: "2025-02-01",
                    color: "#FFAA00",
                };
        
                const response = await request
                    .patch(`/albums/${albumId}/photos/${photoId}`)
                    .send(updates);

                testPhoto.title = updates.title
                testPhoto.description = updates.description
                testPhoto.date = updates.date
                testPhoto.color = updates.color
        
                expect(response.status).to.equal(200);
                expect(response.body.id).to.equal(photoId);
                expect(response.body.title).to.equal(testPhoto.title);
                expect(response.body.description).to.equal(testPhoto.description);
                expect(response.body.date).to.equal(new Date(testPhoto.date).toISOString());
                expect(response.body.color).to.equal(testPhoto.color);
                expect(response.body.filePath).to.include('/uploads/');
            });
        
            it("should return 400 for invalid date format", async () => {
                const response = await request
                    .patch(`/albums/${albumId}/photos/${photoId}`)
                    .send({ date: "invalid-date" });
        
                expect(response.status).to.equal(400);
            });
        
            it("should return 400 for invalid color format", async () => {
                const response = await request
                    .patch(`/albums/${albumId}/photos/${photoId}`)
                    .send({ color: "invalid-color" });
        
                expect(response.status).to.equal(400);
            });
        
            it("should return 404 if photo does not exist", async () => {
                const nonExistentId = 99999;
        
                const response = await request
                    .patch(`/albums/${albumId}/photos/${nonExistentId}`)
                    .send({ title: "New Title" });
        
                expect(response.status).to.equal(404);
            });
        });   
        
        it("should DELETE /albums/:albumId/photos/:photoId", async () => {
            for (let i = 0; i < photoIds.length; i++) {
                const photoId = photoIds[i];

                const deleteResponse = await request.delete(`/albums/${albumId}/photos/${photoId}`);
                expect(deleteResponse.status).to.equal(200);
                
                // Check photo is gone with GET
                const getResponse = await request.get(`/albums/${albumId}/photos/${photoId}`);
                expect(getResponse.status).to.equal(404);
            }

            // Check that album has no photos with GET /albums/:albumId/photos
            const getAlbumsResponse = await request.get(`/albums/${albumId}/photos`);
            expect(getAlbumsResponse.status).to.equal(200);
            expect(getAlbumsResponse.body).to.be.an("array").that.is.empty;

            photos.length = 0;
            photoIds = 0;
        })
    });    
});