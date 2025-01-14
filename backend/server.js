const express = require('express');

const app = express();

// parses json and makes the data available in req.body
// will allow post requests (front) to send json data
app.use(express.json());

function error(err, req, res, next) {
    // if (!test) console.error(err.stack);
    console.error(err.stack);

    res.status(500);
    res.send('Internal Server Error');
}

app.get('/test', (req, res, next) => {
    // res.status(201).json({ message: '201!' });
    res.json({ message: 'Hello World!!' });

    // throw new Error('test');
});

app.use(error);

module.exports = app;