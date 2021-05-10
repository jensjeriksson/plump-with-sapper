const nums = [
	{
		val: 2,
		text: '2',
	},
	{
		val: 3,
		text: '3',
	},
	{
		val: 4,
		text: '4',
	},
	{
		val: 5,
		text: '5',
	},
	{
		val: 6,
		text: '6',
	},
	{
		val: 7,
		text: '7',
	},
	{
		val: 8,
		text: '8',
	},
	{
		val: 9,
		text: '9',
	},
	{
		val: 10,
		text: '10',
	},
	{
		val: 11,
		text: 'J',
	},
	{
		val: 12,
		text: 'Q',
	},
	{
		val: 13,
		text: 'K',
	},
	{
		val: 14,
		text: 'A',
	},
]
const suits = ['hearts', 'diamonds', 'clubs', 'spades']

const cards = []

//Generate cards
suits.forEach(suit => {
    nums.forEach(num => {
        let newCard = {
            val: num.val,
            text: num.text,
            suit: suit
        }
        cards.push(newCard)
    })
})

//Shuffle deck
for(let i = 0; i < 7; i++) {
    cards.sort(() => {return .5 - Math.random()})
}

export default cards;