<script>
    import { createEventDispatcher } from 'svelte'
    import socket from '../../scripts/socket'
    import game from '../stores/game'
    import user from '../stores/user'
    import messages from '../stores/messages'
    import notifications from '../stores/notifications'


    let dispatch = createEventDispatcher()

    socket.on('joinGame', data => {
        user.setStore(data.user)
        game.setStore(data.game)
        setTimeout(() => {
            dispatch('loadingDone')
        }, 1000);

    })

    socket.on('startGame', data => {
        messages.write({
            time: data.message.time,
            user: data.message.user,
            text: data.message.text,
            _id: Math.random() * 10000,
        })
    })

    socket.on('updateGame', data => {
        game.updateStore(data)
    })

    socket.on('disconnect user', message => {
        let mess = message
        mess.id = Math.random() * 10434
        messages.write()
        notifications.addMessage(mess)

        setTimeout(() => {
            notifications.deleteMessage()
        }, 5000);
    })

    //Retrieve info when joining game
    
    socket.on('userJoined', data => {
        let mess = {
            time: data.message.time,
            user: data.message.user,
            text: data.message.text,
            id: Math.random() * 10000,
        }
        messages.write(mess)
        game.setStore(data.game)

        notifications.addMessage(mess)

        setTimeout(() => {
            notifications.deleteMessage()
        }, 5000);
    })

    socket.on('pickWinner', id => {
        //get position in players list of winner and set out coordinates
        dispatch('pickWinner', id)
        setTimeout(() => {
            dispatch('pickWinner', "")
        }, 5000);
    })

    socket.on('gameDone', data => {
        game.updateStore(data.game)
        dispatch('gameDone', {
            winnerIndex: data.winnerIndex,
            winner: data.winner,
            points: data.winnerPoints,
            gameDone: true
        })
    })

    socket.on('replay', data => {
        dispatch('replay', {
            replayId: data.game,
            replayName: data.name
        })
    })

    socket.on('gotoGame', data => {

        window.location.assign(`/games/${data.game}`)
    })


</script>