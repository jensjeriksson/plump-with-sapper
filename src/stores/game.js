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
    updateCards: data => {
        store.update(items => {
            let storeCopy = {...store}
            storeCopy.cards.find(i => i._id == data._id).cards == data.cards
            return storeCopy
        })
    }
}


export default editStore