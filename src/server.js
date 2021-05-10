import sirv from 'sirv';
import express from 'express';
import compression from 'compression';
import * as sapper from '@sapper/server';
import socketio from 'socket.io'
import http from 'http'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cards from '../scripts/cards'
import randomstring from 'randomstring'
dotenv.config()


const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

const app = express()
const server = http.createServer(app)
const io = socketio(server)


mongoose.connect(process.env.MONGODB, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}, () => {
	console.log('Connected to MongoDB')
})

//Mongo models
import Games from './models/games'
import Users from './models/user'


//Run when client connects
io.on('connection', (socket) => {
	//Create game
	socket.on('createGame', async data => {
		try {
			let currentUser = undefined
			if(data._id) {
				currentUser = await Users.findById(data._id)
			}

			if(!currentUser) {
				//Create new user
				currentUser = await newUser({
					name: data.name
				})
			}
	
			let createGame = await Games.create({
				name: data.game,
				owner: currentUser._id,
				length: data.length,
				players: [{...currentUser}],
				round: 0,
				active: true,
				turn: undefined,
				state: undefined,
				notAllowed: -1,
				stats: [],
				created_at: new Date()
			})
	
			socket.broadcast.emit('newGame', {
				_id: createGame._id,
				players: createGame.players,
				name: createGame.name,
				length: createGame['length']
			})

			socket.emit('gotoGame', {
				user: currentUser,
				game: createGame._id
			})
		} catch (error) {
			socket.emit('error', error)
		}
	})

	socket.on('gotoGame', async data => {
		try {
			//Create new user
		let checkGame = await Games.findById(data.game)

		if(!checkGame) {
			return socket.emit('error', {
				message: `Game id ${data.link} is invalid. Could not join game`
			})
		}

		//Check for user
		let currentUser
		if(data._id) {
			currentUser = await Users.findById(data._id)
		}

		if(!currentUser) {
			currentUser = await newUser({
				name: data.name
			})
		}

		socket.emit('gotoGame', {
			user: currentUser,
			game: data.game
		})

		} catch (error) {
			socket.emit('error', {
				message: `Game id ${data.link} is invalig. Could not join game`
			})
		}
	})

	socket.on('joinGame', async data => {
		try {
			socket.join(data.game)
			let user = await Users.findById(data._id)
			let game = await Games.findById(data.game)

			if(!user || !game) {
				return io.emit('error', {message: 'Could not fint user or game with given id`s'})
			}
			let addplayer = true

			for(let i = 0; i < game.players.length; i++) {
				if(game.players[i]._id.toString() == user._id.toString()) {
					addplayer = false
				}
			}
			if(addplayer) {
				console.log('Adding player to game')
				game.players.push(user)
				game.save()

				//Broadast to other players that new user joined
				socket.broadcast.to(data.game).emit('userJoined', {
					message: {
						time: new Date(),
						text: `${user.name} joined the game!`,
						user: 'Gamebot'
					},
					game: game
				})
			}
			else {
				socket.broadcast.to(data.game).emit('userJoined', {
					message: {
						time: new Date(),
						text: `${user.name} re-joined the game!`,
						user: 'Gamebot'
					},
					game: game
				})
			}
			socket.emit('joinGame', {
				user, game
			})
			socket.emit('updateGameData', {
				_id: game._id,
				players: game.players
			})
		} catch (error) {
			socket.emit('error', error)
		}
	})

	socket.on('chat', data => {
		socket.broadcast.to(data.room).emit('chat', data.message)
	})

	//Games sockets
	socket.on('startGame', async data => {
		io.to(data.room).emit('startGame', {
			message: {
				time: new Date(),
				text: 'Game started by admin. Cards will be dealt now!',
				user: 'Gamebot'
			}
		})
		let game = await Games.findByIdAndUpdate(data.room)
		let promise = [];
		let stats = []

		for(let j = 0; j < game.players.length; j++){
			let newPromise = {
				_id: game.players[j]._id,
				value: -1
			}
			promise.push(newPromise)
			let newStat = {
				_id: game.players[j]._id,
				value: 0
			}
			stats.push(newStat)
		}
		//Create player profiles
		let roundStats = []
		for(let i = 0; i < game['length']; i++) {
			let dataFile = {
				round: i + 1,
				cards: i + 1,
				promises: promise,
				picks: stats,
				score: stats
			}
			roundStats.push(dataFile)
		}

		for(let s = game['length']; s > 0; s--) {
			let dataFile = {
				round: 2 * game['length'] - (s - 1),
				cards: s,
				promises: promise,
				picks: stats,
				score: stats
			}
			roundStats.push(dataFile)
		}

		game.stats = roundStats
		game.round = 1
		game.state = "pick"
		game.cards = []
		game.started_at = new Date()

		//Shuffle Cards
		let cardsCopy = [...cards]
		for(let p = 0; p < 7; p++) {
			cardsCopy.sort(() => {return .5 - Math.random()})
		}

		for(let o = 0; o < game.players.length; o++) {
			let playersCards = {
				_id: game.players[o]._id,
				cards: []
			}
			for(let u = 0; u < game.stats[game.round - 1].cards; u++) {
				let newCard = cardsCopy.pop()
				newCard.id = randomstring.generate(10)
				playersCards.cards.push(newCard)
			}
			
			game.cards.push(playersCards)
		}

		//Set turn
		let turn = Math.floor(Math.random() * game.players.length) % game.players.length
		game.turn = turn
		game.turnId = game.players[turn]._id

		let points = []
		for(let k = 0; k < game.players.length; k++) {
			points.push(0)
		}
		game.points = points

		

		game.save()

		

		io.to(data.room).emit('updateGame', game)
	})

	socket.on('pick', async pick => {
		try {
			let game = await Games.findById(pick.game)
			let gameCopy = {...game._doc}
			let gameLength = gameCopy.players.length

			let index = gameCopy.players.findIndex(i => i._id  == pick._id)
			let cards = gameCopy.stats[pick.round - 1].cards
			
			//Check that picks is allowed. Not under 0, not over maximum cards and isNan
			if(pick.picks > cards || isNaN(pick.picks) || pick.picks < 0) {
				console.log('Picks not allowed. Sending error message...')
				return sendCardError()
			}

			//Update player picks for round
			gameCopy.stats[pick.round - 1].promises[index]['value'] = pick.picks

			//Check if all picks are set and set amount of picks not allowed if last player is in turn
			let checkForLastTurn = gameCopy.stats[pick.round - 1].promises.filter(i => i['value'] == -1).length

			//Set next player in turn and update game to front-end
			if(checkForLastTurn > 0) {
				//Check for legal picks if last player in turn
				if(checkForLastTurn == 1) {
					//Last player is up next. Set notAllowed value to other than -1
					let allPromises = gameCopy.stats[pick.round - 1].promises
					let totalCards = gameCopy.stats[pick.round - 1].cards
					let totalPromises = 0
					for(let p = 0; p < allPromises.length; p++) {
						if(allPromises[p]['value'] != -1) {
							totalPromises += allPromises[p]['value']
						}
					}
	
					if(totalPromises == totalCards) gameCopy.notAllowed = 0
					else if(totalPromises < totalCards)  gameCopy.notAllowed = totalCards - totalPromises
				}

				let userIndex = gameCopy.players.findIndex(i => i._id == gameCopy.turnId)
				let turnIndex =  (userIndex + 1) % gameLength
				gameCopy.turnId = gameCopy.players[turnIndex]._id
				await Games.findByIdAndUpdate(pick.game, gameCopy)

				//Broadcast updated game to whole room
				io.to(pick.game).emit('updateGame', gameCopy)
			} else {
				//Change state to play and reset notAllowed for next round picks
				gameCopy.state = "play"
				gameCopy.notAllowed = -1
				
				//Check for most picks
				let promisesThisRound = gameCopy.stats[gameCopy.round - 1].promises
				let indexForHighest = gameCopy.players.findIndex(i => i._id == gameCopy.turnId) + 1
				indexForHighest = indexForHighest % gameLength
				let highestPromise = promisesThisRound[indexForHighest]['value']
				
				for(let h = 1; h < gameLength; h++) {
					let currentIndex = (indexForHighest + h) % gameLength
					if(promisesThisRound[currentIndex]['value'] > highestPromise) {
						indexForHighest = currentIndex
					}
				}
				//Get next player in turn
				gameCopy.turnId = gameCopy.players[indexForHighest]._id
				gameCopy.currentRound = []

				await Games.findByIdAndUpdate(pick.game, gameCopy)

				io.to(pick.game).emit('updateGame', gameCopy)

			}



		} catch (error) {
			io.to(pick.game).emit('error', error)
		}
	})

	socket.on('playCard', async data => {
		try {
			let game = await Games.findById(data.game)
			let gameCopy = {...game._doc}
			let gameLength = gameCopy.players.length

			//Push played card to currentRound
			let playedCard = {
				_id: data._id,
				name: data.name,
				card: data.card
			}
			gameCopy.currentRound.push(playedCard)

			//Remove played card from users cards
			let playerCardsIndex = gameCopy.cards.findIndex(s => s._id == data._id)
			gameCopy.cards[playerCardsIndex].cards = gameCopy.cards[playerCardsIndex].cards.filter(p => p.id != playedCard.card.id)
			
			
			//Normal turn, player plays card and game continues
			if(gameCopy.currentRound.length < gameLength) {
				//Set turnId to next player
				let userIndex = gameCopy.players.findIndex(i => i._id == gameCopy.turnId)
				let turnIndex =  (userIndex + 1) % gameLength
				gameCopy.turnId = gameCopy.players[turnIndex]._id

				//Update front end with played cards
				io.to(data.game).emit('updateGame', gameCopy)
				return await Games.findByIdAndUpdate(data.game, gameCopy)
			}

			//Update front end with recently played card
			gameCopy.turnId = ""
			io.to(data.game).emit('updateGame', gameCopy)

			//Runs only if round ends
			//Check who won pick
			let pickWinner = gameCopy.currentRound[0]._id
			let winningCard = gameCopy.currentRound[0].card
			gameCopy.turnId = pickWinner
			for(let s = 1; s < gameLength; s++) {
				if(gameCopy.currentRound[s].card.suit == winningCard.suit && gameCopy.currentRound[s].card['val'] > winningCard['val']) {
					winningCard = gameCopy.currentRound[s].card
					pickWinner = gameCopy.currentRound[s]._id
					gameCopy.turnId = pickWinner //Set next turn to pick winner
				}
			}
			//Message to front end
			io.to(data.game).emit('pickWinner', pickWinner)

			//Update picks for winner
			gameCopy.stats[gameCopy.round - 1].picks.find(m => m._id == pickWinner)['value'] += 1

			
			let checkRemainingCards = gameCopy.cards.filter(b => b.cards.length > 0)
			
			//If current pick round ends, currentRound.length == gameLength and there are cards left to play
			if(gameCopy.currentRound.length == gameLength && checkRemainingCards.length > 0) {
				
				setTimeout(async () => {
					try {
						//Clear currentRound 
						gameCopy.currentRound = []
	
						io.to(data.game).emit('updateGame', gameCopy)
						return await Games.findByIdAndUpdate(data.game, gameCopy)
						
					} catch (error) {
						return io.to(data.game).emit('error', error)
					}
				}, 5000);

			} 

			//Set round scores and plumps
			for(let r = 0; r < gameLength; r++) {
				console.log('Checking player %s picks and promises', r)
				if(gameCopy.stats[gameCopy.round - 1].promises[r]['value'] == gameCopy.stats[gameCopy.round - 1].picks[r]['value']) {
					let setNewScore = 10 + parseInt(gameCopy.stats[gameCopy.round - 1].promises[r]['value'])
					gameCopy.stats[gameCopy.round - 1].score[r]['value'] = setNewScore

				} else {
					console.log(`Player ${gameCopy.players[r].name} plumps this round`)
					gameCopy.stats[gameCopy.round - 1].score[r]['value'] = -1
				}
				//Recalculate player total
				let playerTotal = 0
				for(let all = 0; all < gameCopy.round; all++) {
					if(gameCopy.stats[all].score[r]['value'] != -1) playerTotal += gameCopy.stats[all].score[r]['value']
				}
				//Update gameCopy.score array
				gameCopy.points[r] = playerTotal
			}

			//Round has ended. 
			if(gameCopy.currentRound.length == gameLength && checkRemainingCards.length == 0 && gameCopy.round < gameCopy['length'] * 2) {

				setTimeout(async () => {

					try {
						//Set new turnId to gameCopy.turn++ % gameLength
						gameCopy.turn = (gameCopy.turn + 1) % gameLength
						gameCopy.turnId = gameCopy.players[gameCopy.turn]._id
						gameCopy.state = "pick"
						gameCopy.currentRound = []
						gameCopy.round += 1
		
						//Shuffle and deal cards 
						let createCards = [...cards]
						for(let shuffle = 0; shuffle < 7; shuffle++) {
							createCards.sort(() => {return .5 - Math.random()})
						}
						
						for(let plr = 0; plr < gameLength; plr++) {
							let playersCards = []
							for(let u = 0; u < gameCopy.stats[gameCopy.round - 1].cards; u++) {
								let newCard = createCards.pop()
								newCard.id = randomstring.generate(10)
								playersCards.push(newCard)
							}
							//Sort player cards
							playersCards.sort(function(a, b) {
								if(b.suit == a.suit) return a.val - b.val
								return b.suit < a.suit ? 1 : -1
							})
							gameCopy.cards[plr].cards = playersCards
						}
		

						io.to(data.game).emit('updateGame', gameCopy)
						return await Games.findByIdAndUpdate(data.game, gameCopy)

						} catch (error) {
							return io.to(data.game).emit('error', error)
						}
				}, 5000);


			}

			//Game is finished
			if(gameCopy.currentRound.length == gameLength && checkRemainingCards.length == 0 && gameCopy.round == gameCopy['length'] * 2) {
				setTimeout(async () => {
					gameCopy.finished_at = new Date()
					game.state = "done"
					game.active = false
					io.to(data.game).emit('gameDone', gameCopy)
					await Games.findByIdAndUpdate(data.game, gameCopy)
				}, 5000);
			}

		} catch (error) {
			socket.emit('error', error)
		}
	})

	//Disconneting user
	socket.on('disconnect user', async data => {
		socket.leave(data.room)
		io.to(data.room).emit('disconnect user', {
			message: {
				time: new Date(),
				text: `${data.user} disconnected`,
				user: 'Gamebot'
			}
		})
	})

	//Carderror
	function sendCardError(){
		socket.emit('card error', {
			message: 'Picks not allowed. Please choose another amount.',
			game
		})
	}
})



//Create new User
function newUser(data) {
	return new Promise(async (resolve, reject) => {
		try {
			let newUser = await Users.create({
				name: data.name,
				created_at: new Date()
			})
	
			resolve(newUser)
		} catch (error) {
			reject(error)
		}
	})
}

app.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware(),
	)
	
server.listen(PORT, err => {
	if (err) console.log('error', err);
});