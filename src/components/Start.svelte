<script>
    import { onMount } from 'svelte'
    import Button from './Button.svelte'
    import socket from '../../scripts/socket'


    let whattodo = 'create'
    let name, game, link
    let length = 5
    let opengames = []
    let loading = false

    let currentName, currentId

    function readData(){
        currentName = window.sessionStorage.getItem('name')
        currentId = window.sessionStorage.getItem('_id')
    }

    socket.on('error', data => {
        alert(data.message)
    })

    socket.on('newGame', game => {
        opengames.push(game)
    })

    //When creating game or joining game
    socket.on('gotoGame', data => {
        window.sessionStorage.setItem('name', data.user.name)
        window.sessionStorage.setItem('_id', data.user._id)

        window.location.assign(`/games/${data.game}`)
    })

    socket.on('updateGameData', data => {
        let gameIndex = opengames.findIndex(i => i._id == data._id)
        opengames[gameIndex].players = data.players
    })


    onMount(async () => {
        let games = await fetch('/api/games')

        opengames = await games.json()
    });

    const createGame = async () => {
        loading = true
        let _id = window.sessionStorage.getItem('_id')
        let setName = currentName ||name

        socket.emit('createGame', {
            name: setName,
            game,
            length,
             _id
        })
        
    }

    const joinGame = async () => {
        loading = true
        let oldname = window.sessionStorage.getItem('name')
        let oldid = window.sessionStorage.getItem('_id')
        if(oldid && oldname) {
            socket.emit('gotoGame', {
                name: oldname,
                _id: oldid,
                game: link
            })
        } else {
            socket.emit('gotoGame', {
                name: name,
                game: link
            })
        }
    }
</script>

<h1>Welcome to Plump</h1>
<div class="main_box" use:readData>
    <div class="main_box__header">
        <div class={whattodo == 'create' ? "startmenu_btn active" : "startmenu_btn"} on:click={() => whattodo = 'create'}>Create</div>
        <div class={whattodo == 'join' ? "startmenu_btn active" : "startmenu_btn"} on:click={() => whattodo = 'join'}>Join</div>
    </div>
    <div class="main_box__body">
        {#if whattodo == 'create'}
            <h2>Create game</h2>
            <form on:submit|preventDefault={createGame}>
                {#if currentName}
                    <label>Your name:<br>
                        <input type="text" value={currentName} disabled>
                    </label>
                {:else}
                    <label>Your name:<br>
                        <input type="text" bind:value={name} required>
                    </label>
                {/if}
                <label>Game name:<br>
                    <input type="text" bind:value={game} required>
                </label>
                <label>Game length:<br>
                    <input type="number" step="1" min="5" max="10" bind:value={length} required>
                </label>
                <Button {loading}>Create</Button>
            </form>
        {:else}
            <h2>Join game</h2>
            <form on:submit|preventDefault={joinGame}>
                {#if currentName}
                    <label>Your name:<br>
                        <input type="text" value={currentName} disabled>
                    </label>
                {:else}
                    <label>Your name:<br>
                        <input type="text" bind:value={name} required>
                    </label>
                {/if}
                <label>
                    Select game:<br>
                    <select bind:value={link} required>
                        {#each opengames as gm (gm._id)}
                            <option value={gm._id}>{gm.name} ({gm.players.length}/4 : {gm['length']})</option>
                        {/each}
                    </select>
                </label>
                <Button {loading}>Join</Button>
            </form>
        {/if}
    </div>
</div>

<style>
    .main_box {
        margin-top: 50px;
        width: 300px;
        background: var(--light-blue);
        height: 400px;
        box-shadow: 0 0 35px rgba(0, 0, 0, .3);
    }
    .main_box__header {
        display: flex;
    }
    .startmenu_btn {
        width: 50%;
        padding: 1rem;
        text-align: center;
        cursor: pointer;
        background: white;
        color: var(--dark-blue);
        font-weight: 600;
        letter-spacing: 1.5px;
    }
    .active {
        background: var(--light-blue) !important;
        color: white !important;
    }
    .main_box__body {
        width: 100%;
        min-height: 100%;
        padding: 1rem;
    }
</style>