// include express module
const express = require('express');
// include fs module and utils module to 'promise-ify' fs
const fs = require('fs');
const util = require('util');
// include path
const path = require('path');
// include UUID for unique IDs
const { v4: uuidv4 } = require('uuid');

// initialize app and open the port
const app = express();
const PORT = process.env.PORT || 3001;

// middleware for parsing JSON 
app.use(express.json());
// middleware for urlencoded form data
app.use(express.urlencoded({ extended: true }));
// middleware for static folder
app.use(express.static('public'));

// add 'promise' to fs.readFile
const readFile = util.promisify(fs.readFile);

// file read function (using fs 'promise' version)
// returns parsed JSON data
const dbFileRead = async () => {
    try {
    //read file
    const parsedJson = JSON.parse(await readFile('./db/db.json'));
    return parsedJson;
    }
    catch (error) {console.log(error);}
};// end dbFileRead

// file write function
// takes in JSON data and writes to disk
const dbFileWrite = (data) => {
    // make a string value to write to file
    stringJson = JSON.stringify(data, null, 4);
    fs.writeFile('./db/db.json', stringJson, (err) => {
        if (err) {
        console.log(err);
        } else {
        console.log("File written successfully");
        }
    });//end fs.writeFile
};//end dbFileWrite

// the list of required routes for this app:
// '/api/notes' GET
// '/api/notes' POST
// '/api/notes' DELETE

// base GET Route for homepage - index.html
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/index.html'))
);

// GET Route for 'notes' file - notes.html
app.get('/notes', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/notes.html'))
);

// GET route for notes API
app.get('/api/notes', (req, res) => {
    //read file data, returns parsed JSON
    dbFileRead().then((parsedData) => {
        console.log(parsedData);
        console.log('Success Reading File!');
        res.json(parsedData);
    }).catch(err => console.log(err));//catch any errors
});//end GET route for api

// POST route for notes API
app.post('/api/notes', (req, res) => {
    // read from existing file
    dbFileRead().then((parsedData) => {
        // new note is in request body
        // needs destructuring first
        const { title, text } = req.body;
        // validate that note is correct format
        // then created a new note object,
        // including a unique ID
        if (title && text) {
        const newNote = { id:uuidv4(), title, text };
        // append new data
        parsedData.push(newNote);
        // write out file with new data added
        dbFileWrite(parsedData);
        // return request response
        res.json(parsedData);
        } else {res.status(500).json('Error posting this note!');}
    }).catch(err => console.log(err));
});//end POST route for api

// DELETE route for notes API
app.delete('/api/notes/:id', (req, res) => {
    // strip out the ID of the desired note
    const noteId = req.params.id;
    // read the stored note file
    dbFileRead().then((readResults) => {
        // make new object array
        // for holding data that was read
        const data = readResults;
        // make a new array of all notes
        //EXCEPT the one with the ID provided in the URL
        const result = data.filter((note) => note.id !== noteId);
        // Save that array to the filesystem
        dbFileWrite(result);
        // Respond to the DELETE request
        res.json(`Item ${noteId} has been deleted`);
    }).catch(err => console.log(err));
});//end DELETE route for api

// this route will handle all the requests that are
// not handled by any other route handler
app.all('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'))
    //res.status(404).send('<h1>404! Page not found</h1>');
});//end catch-all route

// start app listener on PORT
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
