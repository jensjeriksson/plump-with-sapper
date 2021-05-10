import { writable } from 'svelte/store'


const store = writable({})


const editStore = {
    subscribe: store.subscribe,
    setStore: data => {
        return store.set(data)
    },
    updateStore: data => {
        store.update(items => {
            return {...items, data}
        })
    }
}


export default editStore