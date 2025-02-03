import express, { application, json } from 'express';
import usersRouter from './routes/users.js';
import albumsRouter from './routes/albums.js';
import photosRouter from './routes/photos.js';

const app = express();

// parses json and makes the data available in req.body
// will allow post requests (front) to send json data
app.use(json());

app.use(express.urlencoded({ extended: true }));

function error(err, req, res, next) {
    // if (!test) console.error(err.stack);
    console.error(err.stack);

    res.status(500);
    res.send('Internal Server Error');
}

// Routes
app.use(usersRouter);
app.use(albumsRouter);
app.use(photosRouter);

// Front-end
app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.use(error);

export default app;