const mongoose = require('mongoose');
const express = require('express')
const cors = require('cors');
const app = express()
const port = 3000

const BLOCKS_PER_SIZE = 7;

const coords = [40.7128, 74.0060]

process.env.MONGO_USER = "lemelgib"
process.env.MONGO_PASSWORD = "sTrG95Peqb8JCdF1"

const CONNECTION_STRING = "mongodb+srv://"+process.env.MONGO_USER+":"+process.env.MONGO_PASSWORD+"@cluster0.92ribul.mongodb.net/?retryWrites=true&w=majority"

const NAMES = ["Villa", "Bungalow", "Condo"]

const houseSchema = new mongoose.Schema({
    name: String,
    size: Number,
    colors: [Number],
    gridPieces: [[Number]],
    coordinates: [Number]
});
const House = mongoose.model('House', houseSchema);

function randomHouse() {
    var size = Math.ceil(Math.random()*3)
    var colors = []
    for (var i = 0; i < size*3; i++) {
        colors.push(Math.floor(Math.random()*255))
    }

    var gridPieces = [[0,0,0]];
    while (gridPieces.length < size*BLOCKS_PER_SIZE) {
        var start = gridPieces[Math.floor(Math.random()*gridPieces.length)]
        var offset = [[0,0,1], [0,0,-1], [1,0,0], [-1,0,0], [0,1,0]][Math.floor(Math.random()*5)]
        
        var newPiece = [start[0]+offset[0], start[1]+offset[1], start[2]+offset[2]]
        if (gridPieces.findIndex(x => 
            x[0] == newPiece[0] && 
            x[1] == newPiece[1] &&
            x[2] == newPiece[2]) != -1
        ) continue

        gridPieces.push(newPiece)
    }


    return new House({
        name: NAMES[size-1], 
        size: size, 
        colors: colors, 
        gridPieces: gridPieces,
        coordinates: [
            coords[0]+(Math.random()-0.5)*0.6,
            coords[1]+(Math.random()-0.5)*0.6
        ]
    })
}
function similarity(h1, h2) {
    var sum = 0
    for (var i = 0; i < h1.gridPieces.length; i++) {
        var p = h1.gridPieces[i]
        if (h2.gridPieces.findIndex(x => x[0] == p[0] && x[1] == p[1] && x[2] == p[2]) == -1)
            sum--;
        else
            sum += 0.5; 
    }
    for (var i = 0; i < h2.gridPieces.length; i++) {
        var p = h2.gridPieces[i]
        if (h1.gridPieces.findIndex(x => x[0] == p[0] && x[1] == p[1] && x[2] == p[2]) == -1)
            sum--;
        else
            sum += 0.5; 
    }
    // no exact matches
    if (sum == h1.gridPieces.length && sum == h2.gridPieces.length) sum -= 200;
    return sum
}
async function similarHouses(h) {
    const houses = await House.find();
    if (h.gridPieces == undefined) h = houses[Math.floor(Math.random()*houses.length)]
    houses.sort((h1,h2) => similarity(h1, h)-similarity(h2, h))
    return [houses[0], houses[1], houses[2]]
}

async function main() {

    await mongoose.connect(CONNECTION_STRING);


    app.use(express.static('static'))
    app.use(express.json())
    app.use(cors())
    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.get('/num-houses', async (req, res) => {
        const houses = await House.find();
        res.send(houses.length + "")
    })

    app.get('/random-house', async (req, res) => {
        const houses = await House.find();
        res.send(JSON.stringify(houses[Math.floor(Math.random()*houses.length)]))
    })

    app.get('/populate', (req, res) => {
        var houses = []
        for (var i = 0; i < 10; i++) {
            var h = randomHouse()
            h.save();
            houses.push(h)
        }
        res.send(JSON.stringify(houses))
    })
    
    app.post('/similar-houses', async (req, res) => {
        if (req.body == undefined) req.body = {}
        var houses = await similarHouses(req.body)
        res.send(JSON.stringify(houses));
    })

    app.listen(port)
}
main().catch(err => console.log(err));
