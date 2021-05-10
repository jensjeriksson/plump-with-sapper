import { writable } from 'svelte/store'


const store = writable([])


const editStore = {
    subscribe: store.subscribe,
    write: data => {
        store.update(items => {
            return [...items, data]
        })
    }
}


export default editStore