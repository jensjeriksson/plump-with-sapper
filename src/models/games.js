import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
    name: {type: String, required: true},
    players: [{type: Object}],
    length: {type: Number, required: true},
    owner: {type: String, required: true},
    active: {type: Boolean, required: true, default: true},
    round: {type: Number, required: true},
    turn: {type: Number},
    turnId: {type: String},
    state: {type: String},
    cards: [{type: Object}],
    points: [{type: Number}],
    stats: [{type: Object}],
    notAllowed: {type: Number},
    currentRound: [{type: Object}],
    started_at: {type: Date},
    finished_at: {type: Date},
    created_at: {type: Date, required: true}
})

export default mongoose.model('game', schema)