import express, { json } from 'express';

const app = express();

// parses json and makes the data available in req.body
// will allow post requests (front) to send json data
app.use(json());

// serve the frontend
app.use(express.static('public'));

function error(err, req, res, next) {
    // if (!test) console.error(err.stack);
    console.error(err.stack);

    res.status(500);
    res.send('Internal Server Error');
}

var counter = 0;

app.get('/counter', (req, res) => {
    res.json({ value: counter });
});

app.post('/counter', (req, res) => {
    counter += 1;
    res.json({ value: counter });
});

app.get('/test', (req, res) => {
    // res.status(201).json({ message: '201!' });
    res.json({ message: 'Hello World!!' });

    // throw new Error('test');
});

// Front-end
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.use(error);

export default app;