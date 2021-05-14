import { writable } from 'svelte/store'


const store = writable({players: [], points:[], stats: [], cards: [],currentRound: []})


const editStore = {
    subscribe: store.subscribe,
    setStore: data => {
        return store.set(data)
    },
    updateStore: data => {
        store.update(items => {
            return {...items, ...data}
        })
    },
    playCard: card => {
        store.update(items => {
            let copyItems = {...items}
            copyItems.currentRound.push(card)
            return copyItems
        })
    },
    updateCards: data => {
        store.update(items => {
            let storeCopy = {...store}
            let index = storeCopy.cards.findIndex(i => i._id == data._id)
            storeCopy.cards[index].cards = storeCopy.cards[index].cards.filter(j => j.id !== data.id)
            storeCopy.cards.find(i => i._id == data._id).cards == data.cards
            return storeCopy
        })
    }
}


export default editStore