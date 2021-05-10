import Games from '../../models/games'
import User from '../../models/user'

export async function get(req, res, next) {
    try {
        let games = await Games.find({active: true, round: 0})
        
        res.status(200).send(games)
        
    } catch (error) {
        res.stauts(500).send(error)
    }
}

export async function post(req, res, next) {
    try {
        console.log(req.body)
        let newGame = await Games.create({
            name: data.game,
            owner: data.name,
            length: data.length,
            players: [data.name],
            active: true,
            round: 0,
            created_at: new Date()
        })

        res.status(200).send(newGame)

    } catch (error) {
        res.status(500).send(error)
    }
}


export async function put(req, res, next) {
    try {
        //Create new User
        console.log(req.body)

        res.status(204).send

    } catch (error) {
        res.status(500).send(error)
    }
}