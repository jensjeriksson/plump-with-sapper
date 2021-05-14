<script>
    //Import Components
    import Card from '../../components/Card.svelte'
    import Info from '../../components/Info.svelte'
    import Plump from '../../components/Plump.svelte'
    import Sockets from '../../components/Sockets.svelte'
    
    //Import stores and effects
    import socket from '../../../scripts/socket'
    import user from '../../stores/user'
    import game from '../../stores/game'
    import notifications from '../../stores/notifications'
    import { fly, fade } from 'svelte/transition'
    import { flip } from 'svelte/animate'

    //Variables
    let myCards = []
    let loadingPage = true
    let exitPlan = {}
    let gameDone = false
    let winner
    let winnerIndex
    let points
    let replayName = ""
    let replayId = undefined
    let height = ""
    let pickWinner
    const flipDurationMs = 300

    $: {
        if($game.cards.find(i => i._id == $user._id)) {
            myCards = $game.cards.find(i => i._id == $user._id).cards
        }
    }

    //Runs when user enters
    function joinGame(){
        socket.emit('joinGame', {
            name: window.sessionStorage.getItem('name'),
            _id: window.sessionStorage.getItem('_id'),
            game: window.location.pathname.split('/')[2]
        })
        exitPlan.user = $user.name,
        exitPlan.room = window.location.pathname.split('/')[2]

        checkScreenSize()
        return {
            destroy() {
                socket.emit('disconnect user', exitPlan)
            }
        }
    }
    
    
    //Start game with minimum of 2 players
    function startGame(){
        socket.emit('startGame', {room: window.location.pathname.split('/')[2]})
    }

    //Updates screen size to fix iOS bug
    function checkScreenSize(){
        height = window.innerHeight
        document.body.style.height = height +'px'
        window.addEventListener('resize', () => {
            setTimeout(() => {
                let getHeight = window.innerHeight
                document.body.style.height = getHeight +'px'
            }, 100);
        })
    }

    //Join rematch
    function joinReplay(){
        window.location.assign(`/games/${replayId}`)
    }

    //Create rematch with opponents
    function replay(){
        socket.emit('replay', {
            room: window.location.pathname.split('/')[2],
            _id: $user._id
        })
    }

    //After game in stats screen, go back to start
    function goHome() {
        window.location.assign('/')
    }

    //Player functions
    let myPicks = 0
    let notAllowed = ""

    $: {
        if(myPicks == 0 && $game.notAllowed == 0 && $game.state == "pick" && $game.turnId == $user._id) {
            myPicks = 1
        }
    }

    function doubleClick(event) {
        //Check if card is allowed to be played
        if($game.currentRound.length == 0 && $game.turnId == $user._id) {
            //This means that player is first out, all cards are allowed
            //Play card!! 
            socket.emit('playCard', {
                _id: $user._id,
                name: $user.name,
                game: window.location.pathname.split('/')[2],
                card: event
            })
        } 
        else if($game.turnId == $user._id) {
            let cardToMatch = $game.currentRound[0].card
            let myCards = $game.cards.find(i => i._id == $user._id).cards


            //If suit of played card matches suit of first card played
            if(event.suit == cardToMatch.suit) {
                //play card
                socket.emit('playCard', {
                    _id: $user._id,
                    name: $user.name,
                    game: window.location.pathname.split('/')[2],
                    card: event
                })
                return
            }

            if(event.suit !== cardToMatch.suit && myCards.filter(p => p.suit == cardToMatch.suit).length > 0) {
                //Make card red for 2 seconds
                notAllowed = event.id

                setTimeout(() => {
                    if(notAllowed == event.id) return notAllowed = ""
                }, 2000);
            }
            if(event.suit !== cardToMatch.suit && myCards.filter(p => p.suit == cardToMatch.suit).length == 0) {
                socket.emit('playCard', {
                    _id: $user._id,
                    name: $user.name,
                    game: window.location.pathname.split('/')[2],
                    card: event
                })
            }

        }
    }

    //Player picksfunctions
    function addPicks(){
        if(myPicks < $game.stats[$game.round -1].cards) myPicks++

        //If picks are equal to notAllowed
        if(myPicks == $game.notAllowed) {

            //and equal to maximum cards, subtract one
            if(myPicks == $game.stats[$game.round - 1].cards) return myPicks--

            //and less than maximum cards, add one
            if(myPicks < $game.stats[$game.round - 1].cards) return myPicks++
        }

    }

    function subPicks(){
        if(myPicks > 0) myPicks--

        //If picks are equal to notAllowed
        if(myPicks == $game.notAllowed) {

            //and larger than 0
            if(myPicks > 0) return myPicks--

            //and equal to zero
            if(myPicks == 0) return myPicks++
        }
    }

    function selectPicks(){
        let sendPicks = {
            _id: $user._id,
            picks: myPicks,
            round: $game.round,
            game: window.location.pathname.split('/')[2]
        }
        game.updateStore({turnId: ''})

        socket.emit('pick', sendPicks)
        myPicks = 0
    }

    function setWinner(event) {
        pickWinner = event.detail
    }

    function setGameDone(data) {
        winnerIndex = data.winnerIndex
        winner = data.winner
        points = data.winnerPoints
        gameDone = true
    }

    function setReplay(data) {
        replayId = data.game
        replayName = data.name
    }

</script>

<Sockets 
    on:loadingDone={() => loadingPage = false}
    on:pickWinner={setWinner}
    on:gameDone={setGameDone}
    on:replay={setReplay}
/>

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
                <tr style="border-top: 1px solid #444;">
                    <th >Total:</th>
                    {#each $game.points as point}
                        <th>{point}</th>
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

<div class="notifications">
    {#each $notifications as notice (notice.id)}
        <div class="message" animate:flip transition:fly={{x: 300}}>
            <p class="time">{new Date(notice.time).toLocaleTimeString()} - {notice.user} wrote</p>
            <p class="text">{notice.text}</p>
        </div>
    {/each}
</div>

<div class="container" use:joinGame>
    <!-- TABLE BEHIND PLAYERS -->
    <div class="table"> 
    </div>
    <div class="players">
        <div class="top">
            {#each $game.players.filter(i => i._id !== $user._id) as player}
                <div class="opponent">
                    <span class="player">&#9876; {player.name}</span>
                    <div class="small_cards_row">
                        {#if $game.round > 0}
                            {#each $game.cards.find(i => i._id == player._id).cards as card, i}
                                <div style="margin-left: {-30 - 3 * myCards.length}px" class="mini_card">
                                    <Card mini=true />
                                </div>
                            {/each}
                        {/if}
                    </div>
                    {#if $game.round > 0 && $game.state == "play"}
                        <p class="picks" transition:fade|local>Picks: {$game.stats[$game.round - 1].picks.find(i => i._id == player._id)['value']} / {$game.stats[$game.round - 1].promises.find(i => i._id == player._id)['value']}</p>
                    {/if}
                    {#if $game.turnId == player._id}
                        <div class="inturn">Waiting for player...</div>
                    {/if}
                </div>
            {:else}
                <h4>Waiting for players to join the game...</h4>
            {/each}
        </div>
        <div class="middle">
            {#if $game.state == "pick"}
                <h2>Time to choose your picks!</h2>
            {:else if $game.currentRound.length > 0}
                <h2>Suit to match <img src="{$game.currentRound[0].card.suit}.png" alt="Card to match"></h2>
            {/if}
            <div class="opponents_play">
                {#each $game.players.filter(p => p._id !== $user._id) as user, i (user._id)}
                    <div class="player_box">
                        {#each $game.currentRound.filter(j => j._id == user._id) as usr (usr._id)}
                            <div 
                                class={pickWinner == usr._id ? "mini_card winner_card" : "mini_card"}
                                in:fly={{y: -300}}
                                out:fly={{x: -600}}
                            >
                                <Card card={usr.card} played=true/>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
            {#each $game.currentRound.filter(g => g._id == $user._id) as usr (usr.card.id)}
                <div 
                    in:fly={{y: 300}}
                    out:fly={{x: -600}}
                    class={pickWinner == usr._id ? "mini_card winner_card" : "mini_card"}
                >
                    <Card played=true card={usr.card} />
                </div>
            {:else}
                {#if $game.state == "play" && $game.turnId == $user._id}
                    <p class="drop_info" in:fade={{delay: 500}}>Your turn,<br>doubleclick to play card!</p>
                {/if}
            {/each}
        </div>
        <div class="bottom">
            {#if $game.round > 0 && $game.state == "play"}
                <p class="myPicks" transition:fade|local>Picks: {$game.stats[$game.round - 1].picks.find(i => i._id == $user._id)['value']} / {$game.stats[$game.round - 1].promises.find(i => i._id == $user._id)['value']}</p>
            {/if}
            {#if $game.round == 0}
                <div class="start_notice">
                    <h4>{$game.owner == $user._id ? 'Waiting for players to join. You can start with a minimun of 2 players.' : 'Waiting for players to join and for game to start.'}</h4>
                    {#if $game.owner == $user._id && $game.players.length > 1}
                        <p>You are the administrator of the game. Do you want to start the game<br>with {$game.players.length} players?</p>
                        <button on:click={startGame}>Start game</button>
                    {/if}
                </div>
            {:else}
                {#if $game.state == "pick" && $game.turnId == $user._id}
                    <div class="pick_control" in:fly={{y: 300}}>
                        <form on:submit|preventDefault={selectPicks}>
                            <label>
                                Your turn.<br>
                                Select amount of picks for this round<br>
                                {#if $game.notAllowed >= 0}
                                    <span class="notAllowed">{$game.notAllowed}-picks is not allowed.</span><br>
                                {/if}
                                <span class="notAllowed"></span>
                                <input type="number" hidden>
                                <div class="row">
                                    <div class="my_picks">{myPicks}</div>
                                    <span class="mini_btn" on:click={addPicks}>+</span>
                                    <span class="mini_btn" on:click={subPicks}>-</span>
                                </div>
                            </label>
                            <button>Submit promise</button>
                        </form>
                    </div>
                {/if}
                {#if $game.cards.length > 0}
                    {#each myCards as card, i (card.id)}
                        <div 
                            style="margin-left: {-40 - 3 * myCards.length}px"
                            class={notAllowed == card.id ? "card notAllowed" : "card"}
                            in:fly={{x: 300, delay: i * 200}}
                            on:dblclick={() => doubleClick(card)}
                            animate:flip="{{duration: flipDurationMs}}"
                        >
                            <Card {card} />
                        </div>
                    {/each}
                {/if}
            {/if}
        </div>
    </div>
</div>
<Info />

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
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-align: center;
            -ms-flex-align: center;
                align-items: center;
        -webkit-box-pack: center;
            -ms-flex-pack: center;
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
    .container {
        width: 70%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        float: left;
        position: relative;
    }
    .table {
        width: 80%;
        height: 500px;
        border-radius: 50%;
        border: 20px solid #444;
        background: green;
        z-index: 1;
    }
    .players {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 20;
    }
    .opponent {
        width: 100%;
        height: 100%;
        padding: 1rem;
        text-align: center;
        position: relative;
    }
    .players > div {
        width: 100%;
        display: flex;
        align-items: center;
        height: 37.5%;
        position: relative;
    }
    .top {
        justify-content: space-around;
    }
    .players > div:first-of-type {
        height: 25%;
    }
    .middle {
        flex-direction: column !important;
        justify-content: space-between !important;
    }
    .middle h2 {
        padding: .5rem 1rem;
        background: white;
        border-radius: 100px;
        font-weight: 100;
        letter-spacing: -1px;
    }
    .opponents_play {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-around;
        position: relative;
    }
    .inturn {
        position: absolute;
        top: 50%;
        left: 50%;
        background: var(--light-blue);
        color: #444;
        padding: .5rem;
        transform: translateX(-50%);
        z-index: 50;
        box-shadow: 0 0 5px rgb(0 0 0 / 50%);
        border-radius: 5px;
    }
    .bottom {
        padding: 1rem;
        align-items: flex-end !important;
    }
    .player {
        text-decoration: underline;
    }
    .middle, .bottom {
        justify-content: center;
        flex-direction: row;
    }
    .card {
        width: 110px;
        height: 154px;
        border-radius: 5px;
        background: white;
        margin-left: -40px;
        position: relative;
        z-index: 10;
        box-shadow: 0 0 5px rgba(0, 0, 0, .5);
        cursor: pointer;
        transition: transform .3s ease;
    }
    .card:hover {
        transform: scale(1.05);
    }
    .card:first-of-type, .mini_card:first-of-type {
        margin-left: 0 !important;
    }
    .mini_card {
        width: 65px;
        height: 91px;
        background: white;
        border-radius: 10px;
        margin-left: -30px;
        position: relative;
        z-index: 2;
    }
    .small_cards_row {
        width: 100%;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        height: auto;
        position: relative;
    }
    h2 img {
        height: 25px;
        transform: translateY(7px);
    }
    .drop_info {
        text-align: center;
    }
    .pick_control {
        position: absolute;
        bottom: 50%;
        -webkit-transform: translateY(-28%);
            -ms-transform: translateY(-28%);
                transform: translateY(-28%);
        background: #ccc;
        padding: 1rem;
        border-radius: 10px;
        -webkit-box-shadow: 0 0 10px rgb(0 0 0 / 30%);
                box-shadow: 0 0 10px rgb(0 0 0 / 30%);
        z-index: 50;
    }
    .row {
        margin-top: 1rem;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
    }
    .my_picks {
        padding: .25rem;
        background: white;
        -webkit-box-shadow: 0 0 4px rgb(0 0 0 / 30%);
                box-shadow: 0 0 4px rgb(0 0 0 / 30%);
        border-radius: 5px;
        margin-right: 1rem;
        font-size: 1.5rem;
    }
    .mini_btn {
        padding: .25rem 1rem;
        margin-right: 1rem;
        background: var(--dark-blue);
        color: white;
        font-size: 1.5rem;
        border-radius: 5px;
        cursor: pointer;
    }
    .notAllowed {
        background: rgb(252, 132, 132);
    }
    input[type="number"] {
        width: 35px;
        padding: .5rem .25rem;
    }
    .notifications {
        display: none;
        position: absolute;
        top: 0;
        right: 0;
        padding: 1rem .5rem;
        z-index: 3500;
    }
    .message {
        font-size: 12px;
        background: var(--light-blue);
        color: white;
        padding: .5rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        border: 1px solid #444;
    }
    .text {
        max-width: 350px;
        white-space: pre-wrap;
    }
    .start_notice {
        width: 100%;
        height: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .myPicks {
        position: absolute;
        top: 40%;
        display: inline;
        padding: .5rem;
        background: var(--dark-blue);
        color: white;
        border-radius: 100px;
        font-size: .8rem;
    }
    .picks {
        display: inline;
        padding: .5rem;
        background: var(--dark-blue);
        color: white;
        border-radius: 100px;
        font-size: .8rem;
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
    }

    @media screen and (max-width: 1280px) {
        .container {
            width: 100%;
        }
        .table {
            height: 400px;
        }
        .notifications {
            display: block;
        }
        .myPicks {
            top: 18%;
        }
    }
</style>