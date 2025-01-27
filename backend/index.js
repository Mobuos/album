import server from './server.js'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = import.meta.dirname;

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});