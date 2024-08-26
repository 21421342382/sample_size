const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure the 'public' directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

function generateSampleSpace(numOfDice) {
    const sampleSpace = [];
    function roll(currentRoll) {
        if (currentRoll.length === numOfDice) {
            sampleSpace.push([...currentRoll]);
            return;
        }
        for (let i = 1; i <= 6; i++) {
            currentRoll.push(i);
            roll(currentRoll);
            currentRoll.pop();
        }
    }

    roll([]);
    return sampleSpace;
}

function generateSampleSpaceStream(numOfDice, filePath, callback) {
    const sampleSpace = generateSampleSpace(numOfDice);
    const stream = fs.createWriteStream(filePath);
    const header = Array.from({ length: numOfDice }, (_, i) => `Dice ${i + 1}`).join(',') + '\n';
    stream.write(header);

    sampleSpace.forEach(row => {
        stream.write(row.join(',') + '\n');
    });

    stream.end();
    stream.on('finish', () => {
        console.log('Sample space generation complete.');
        callback(null, sampleSpace); // Pass sampleSpace back to the callback
    });
    stream.on('error', (err) => {
        console.error('Error writing to CSV file:', err);
        callback(err, null);
    });
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/generate-sample', (req, res) => {
    const { numOfDice } = req.body;
    console.log('Received number of dice:', numOfDice); // Log received data

    const numOfDiceNumber = parseInt(numOfDice);

    if (isNaN(numOfDiceNumber) || numOfDiceNumber < 1 || numOfDiceNumber > 6) {
        return res.status(400).send('Invalid number of dice. Please enter a number between 1 and 8.');
    }

    const filePath = path.join(__dirname, 'public', 'dice_sample.csv');

    generateSampleSpaceStream(numOfDiceNumber, filePath, (err, sampleSpace) => {
        if (err) {
            console.error('Error generating sample space:', err);
            return res.status(500).send('Error generating or downloading the CSV file.');
        }
        // Send sampleSpace as JSON
        res.json({ sampleSpace, filePath: '/dice_sample.csv' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
