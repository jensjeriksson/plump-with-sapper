import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
    name: {type: String, required: true},
    created_at: {type: Date, required: true}
})

export default mongoose.model('user', schema)