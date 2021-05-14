import { writable } from 'svelte/store'


const store = writable([])


const editStore = {
    subscribe: store.subscribe,
    addMessage: newMessage => {
        store.update(items => {
            return [newMessage, ...items]
        })
    },
    deleteMessage: () => {
        store.update(items => {
            let arr = [...items]
            arr.pop()
            return arr
        })
    }
}


export default editStore