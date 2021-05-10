<script>
    import { onDestroy, onMount } from 'svelte'
    import Card from '../../components/Card.svelte'
    import Info from '../../components/Info.svelte'
    import Player from '../../components/Player.svelte'
    import Plump from '../../components/Plump.svelte'

    import user from '../../stores/user'
    import game from '../../stores/game'
    import messages from '../../stores/messages'
    import socket from '../../../scripts/socket'
    import { fly, fade } from 'svelte/transition'
    import {dndzone} from "svelte-dnd-action";
    let items = []
    
    let loadingPage = true
    let exitPlan = {}

    //Game has finished
    let gameDone = false
    let winner
    let winnerIndex
    let points
    let replayName = ""
    let replayId = undefined
    
    onDestroy(() => {
        socket.emit('disconnect user', exitPlan)
    })

    function startGame(){
        socket.emit('startGame', {room: window.location.pathname.split('/')[2]})
    }


    //Sockets

    function joinGame(){
        socket.emit('joinGame', {
            name: window.sessionStorage.getItem('name'),
            _id: window.sessionStorage.getItem('_id'),
            game: window.location.pathname.split('/')[2]
        })
        exitPlan.user = $user.name,
        exitPlan.room = window.location.pathname.split('/')[2]
    }

    socket.on('joinGame', data => {
        user.setStore(data.user)
        game.setStore(data.game)
        setTimeout(() => {
            loadingPage = false
            
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
        messages.write(message)
    })

    //Retrieve info when joining game
    
    socket.on('userJoined', data => {
        messages.write({
            time: data.message.time,
            user: data.message.user,
            text: data.message.text,
            _id: Math.random() * 10000,
        })
        game.setStore(data.game)
    })

    socket.on('pickWinner', id => {
        //get position in players list of winner and set out coordinates
        pickWinner = id
        setTimeout(() => {
            pickWinner = ""
            items = []
        }, 5000);
    })

    socket.on('gameDone', data => {
        game.updateStore(data.game)
        winnerIndex = data.winnerIndex
        winner = data.winner
        points = data.winnerPoints
        gameDone = true
    })

    socket.on('replay', data => {
        replayId = data.game
        replayName = data.name
    })

    function joinReplay(){
        window.location.assign(`/games/${replayId}`)
    }

    //DND setup and functions
    const flipDurationMs = 300
    let dragDisabled = true
    let dropFromOthersDisabled = false
    let pickWinner

    function handleDndConsider(e) {
        items = e.detail.items;
    }
    function handleDndFinalize(e) {
        items = e.detail.items;

        //Play card
        let myCards = $game.cards.find(i => i._id == $user._id).cards
        let playedCard = myCards.find(j => j.id == e.detail.info.id)

        socket.emit('playCard', {
            _id: $user._id,
            name: $user.name,
            card: playedCard,
            game: window.location.pathname.split('/')[2]
        })
    }

    function enableDropzone() {
        dropFromOthersDisabled = false
    }

    function disableDropzone() {
        dropFromOthersDisabled = true
    }

    function replay(){
        socket.emit('replay', {
            room: window.location.pathname.split('/')[2],
            _id: $user._id
        })
    }

    socket.on('gotoGame', data => {

        window.location.assign(`/games/${data.game}`)
    })

    function goHome() {
        window.location.assign('/')
    }

</script>

{#if loadingPage}
    <div class="loader">
        <h1>Loading game content</h1><br>
    </div>
{/if}

{#if gameDone}
    <div class="backdrop" in:fade>
        <div class="modal" in:fly={{y: -500}}>
            <h2>Game is finished</h2>
            <p class="congrats">Congratulations {winner}, wins with {points} points!</p>
            <table>
                <tr>
                    <th>#</th>
                    {#each $game.players as plr}
                        <th>{plr.name}</th>
                    {/each}
                </tr>
                {#each $game.stats as stat, i}
                    <tr>
                        <th>{i + 1}</th>
                        {#each stat.score as score}
                            {#if score['value'] == -1}
                                <td><Plump /></td>
                            {:else}
                                <td>{score['value']}</td>
                            {/if}
                        {/each}
                    </tr>
                {/each}
                <tr>
                    <th style="margin-top: 1px solid #444;">Total:</th>
                    {#each $game.points as point}
                        <th style="margin-top: 1px solid #444;">{point}</th>
                    {/each}
                </tr>
            </table>
            <div class="newGame">
                {#if replayId}
                    <h3>{replayName} wants to play again!</h3>
                    <button on:click={joinReplay}>Join game</button>
                {:else}
                    <h3>Play again...?</h3>
                    <button on:click={replay}>Play again</button>
                {/if}
                <button on:click={goHome}>Back to Home</button>
            </div>
        </div>
    </div>
{/if}

<div class="wrapper" use:joinGame>
    <div class="left">
        <div class="opponents">
            <h4>Players <span class="promise">Picks</span></h4>
            {#each $game.players as player (player._id)}
                <div class={pickWinner == player._id ?  "opponent pickWinner" : $game.turnId == player._id ? "opponent inturn" : "opponent"}>
                    {#if $game.round > 0 && $game.state == "play"}
                        <h4>{player._id == $user._id ? 'You' : player.name} <span class="promise">[ {$game.stats[$game.round - 1].picks.find(i => i._id == player._id)['value']}/{$game.stats[$game.round - 1].promises.find(i => i._id == player._id)['value']} ]</span></h4>
                    {:else}
                        <h4>{player._id == $user._id ? 'You' : player.name}</h4>
                    {/if}
                    {#if $game.round > 0}
                        <div class="opponent_cards">
                            {#each $game.cards.find(i => i._id == player._id).cards as card (card.id)}
                                <div class="mini" style="margin-left: {-40 - 2 * $game.cards.find(i => i._id == player._id).cards.length}px">
                                    <Card mini=true/>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {:else}
                <p>No players has joined the game...</p>
            {/each}
        </div>
        <div class="area" >
            <h1>{$game.name}</h1>
            <div class="playzone">
                <div class="played_cards">
                    {#each $game.currentRound as card, i (card._id)}
                        {#if card._id != $user._id}
                            <div class="played__card">
                                <p class="player_name">{card.name} played</p>
                                <div class={pickWinner == card._id ? "card_wrapper winner_card" : "card_wrapper"} in:fly={{y: - 300}} out:fly={{x: -600}}>
                                    <Card card={card.card}/>
                                </div>
                                {#if i == 0}
                                    <p class="card_to_beat">Suit to match <img src="{card.card.suit}.png" alt="Played card"></p>
                                {/if}
                            </div>
                        {/if}
                    {/each}
                </div>
                <div class="dropzone" use:dndzone="{{items, flipDurationMs, dragDisabled, dropFromOthersDisabled}}" on:consider="{handleDndConsider}" on:finalize="{handleDndFinalize}">
                    {#each items as item (item.id)}
                        <div class={pickWinner == item._id ? "card_wrapper winner_card" : "card_wrapper"} out:fly={{x: -600}}>
                            <Card card={item} />
                        </div>
                    {:else}
                        {#if $game.state == "play" && $game.turnId == $user._id}
                            <p class="drop_info">Your turn,<br>drop your card here!</p>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
        <div class={$game.turnId == $user._id ? "player playerturn" : "player"}>
            {#if $game.round == 0}
                <h4>{$game.owner == $user._id ? 'Waiting for players to join. You can start with a minimun of 2 players.' : 'Waiting for players to join and for game to start.'}</h4>
                {#if $game.owner == $user._id && $game.players.length > 1}
                    <p>You are the owner of the game. Do you want to start the game<br>with {$game.players.length} players?</p>
                    <button on:click={startGame}>Start game</button>
                {/if}
            {:else}
                <Player 
                    on:enableDropzone={enableDropzone} 
                    on:disableDropzone={disableDropzone}    
                />
            {/if}
        </div>
    </div>
    <Info />
</div>


<style>
    .loader, .backdrop {
        position: absolute;
        z-index: 9000;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background: #444;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .backdrop {
        background: rgba(0, 0, 0, .7) !important;
    }
    .modal {
        width: 50%;
        height: auto;
        border-radius: 10px;
        padding: 2rem;
        background: white;
        color: #444;
        text-align: center;
        min-width: 500px;
    }
    .modal p {
        margin-bottom: 3rem;
    }
    .modal .newGame {
        padding: 2rem;
    }
    .wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        overflow: hidden;
        position: relative;
    }
    .opponents {
        width: 25%;
        height: 70%;
        background: #ccc;
        float: left;
        position: relative;
        display: flex;
        flex-direction: column;
    }
    .opponent {
        width: 100%;
        height: calc((100% - 30px) / 4);
    }
    .opponent h4, .opponents h4 {
        position: relative;
        padding: .25rem;
    }
    .promise {
        position: absolute;
        right: 1rem;
    }
    .opponent_cards {
        display: flex;
        padding: .25rem;
        padding-top: 0;
    }
    .area {
        width: 75%;
        height: 70%;
        background: white;
        float: left;
        display: flex;
        flex-direction: column;
    }
    .area h1 {
        width: 100%;
        height: auto;
        padding: 1rem 0;
        text-align: center;
    }
    .left {
        width: 70%;
        height: 100%;
        float: left;
        position: relative;
    }
    .player {
        width: 100%;
        height: 30%;
        background: #ccc;
        padding: 1rem;
        display: inline-block;
        text-align: center;
    }
    button {
        margin-top: 1rem;
    }
    .inturn, .playerturn {
        position: relative;
        background: var(--light-blue);
    }
    .pickWinner {
        position: relative;
        background: rgb(134, 216, 113);
    }
    .pickWinner::after {
        content: 'Wins the pick!';
        position: absolute;
        font-size: 1rem;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: .5rem;
        border-radius: 5px;
        background: var(--dark-blue);
        color: white;
        z-index: 1000;
        width: auto;
        white-space: nowrap;
    }
    .inturn::after {
        content: '';
        width: 0;
        height: 0;
        border-right: 50px solid var(--dark-blue);
        border-top: 25px solid transparent;
        border-bottom: 25px solid transparent;
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
    }
    .inturn::before {
        content: 'Waiting for player...';
        position: absolute;
        font-size: 1rem;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: .5rem;
        border-radius: 5px;
        background: var(--dark-blue);
        color: white;
        z-index: 1000;
        width: auto;
        white-space: nowrap;
    }
    .playzone {
        width: 100%;
        height: 100%;
    }
    .played_cards {
        width: 100%;
        height: 50%;
    }
    .dropzone {
        width: 100%;
        height: 50%;
        border-top: 2px solid #ccc;
        /* background: var(--light-blue); */
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .card_wrapper {
        width: 150px;
        height: 210px;
        border-radius: 10px;
        background: white;
        box-shadow: 0 0 5px rgba(0, 0, 0, .3);
        margin: 1rem;
        position: relative;
        overflow: hidden;
        transition: transform .3s ease;
    }
    .mini {
        width: 75px;
        height: 105px;
        background: white;
        border-radius: 8px;
        margin-left: -40px;
        box-shadow: 0 0 5px rgb(0 0 0 / 26%);
        position: relative;
    }
    .mini:first-of-type {
        margin-left: 0 !important;
    }
    .played__card {
        display: flex;
        flex-direction: column;
        width: min-content;
        float: left;
        height: auto;
    }
    .player_name {
        width: 100%;
        height: 30%;
        padding: .5rem;
        display: inline-block;
        text-align: center;
    }
    .card_to_beat {
        text-align: center;
        color: var(--dark-blue);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .card_to_beat img {
        width: 20px;
        height: auto;
        margin-left: .5rem;
    }
    .winner_card {
        transform: scale(1.2);
        box-shadow: 0 0 7px rgba(80, 248, 38, 0.596) !important;
    }


    @media screen and (max-width: 1281px)  {
        .card_wrapper {
            width: 114px;
            height: 162px;
        }
        .left {
            width: 100%;
            height: 100%;
        }
        .opponents {
            height: 100%;
        }
        .area {
            width: 75%;
        }
        .area h1 {
            font-size: 1.1rem;
            padding: .5rem 0;
        }
        .player {
            width: 75%;
            float: left;
            padding: .5rem;
        }
    }
</style>