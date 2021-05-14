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
    
    let myOwnCards = []
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

    function startGame(){
        socket.emit('startGame', {room: window.location.pathname.split('/')[2]})
    }

    $: {
        if($game.cards.find(i => i._id == $user._id)) {
            myOwnCards = $game.cards.find(i => i._id == $user._id).cards
        }
    }

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

    function joinReplay(){
        window.location.assign(`/games/${replayId}`)
    }

    

    function replay(){
        socket.emit('replay', {
            room: window.location.pathname.split('/')[2],
            _id: $user._id
        })
    }

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
            {#if $game.state == "play"}
                {#if $game.currentRound.length > 0}
                    <h1 class="card_to_beat" transition:fade>Suit to match <img src="{$game.currentRound[0].card.suit}.png" alt="Played card"></h1>
                {:else}
                    <h1> </h1>
                {/if}
            {:else}
                <h1>{$game.name}</h1>
            {/if}
            <div class="playzone">
                <div class="played_cards">
                    {#each $game.currentRound as card (card._id)}
                        {#if card._id != $user._id}
                            <div class="played__card">
                                <p class="player_name">{card.name} played</p>
                                <div class={pickWinner == card._id ? "card_wrapper winner_card" : "card_wrapper"} in:fly={{y: - 300}} out:fly={{x: -600}}>
                                    <Card card={card.card}/>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
                <div class="dropzone">
                    {#each $game.currentRound.filter(i => i._id == $user._id) as usr (usr.card.id)}
                        <div
                            in:fly={{y: 300}}
				            out:fly="{{x: -600}}"
                            class={pickWinner == usr._id ? "card_wrapper winner_card" : "card_wrapper"}
                        >
                            <Card card={usr.card} />
                        </div>
                    {:else}
                        {#if $game.state == "play" && $game.turnId == $user._id}
                            <p class="drop_info" in:fade={{delay: 500}}>Your turn,<br>doubleclick to play card!</p>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
        <div class={$game.turnId == $user._id ? "player playerturn" : "player"}>
            {#if $game.round == 0}
                <h4>{$game.owner == $user._id ? 'Waiting for players to join. You can start with a minimun of 2 players.' : 'Waiting for players to join and for game to start.'}</h4>
                {#if $game.owner == $user._id && $game.players.length > 1}
                    <p>You are the administrator of the game. Do you want to start the game<br>with {$game.players.length} players?</p>
                    <button on:click={startGame}>Start game</button>
                {/if}
            {:else}
                <div class={$game.turnId == $user._id  && $game.state == "pick" ? "your_cards inturn_you" : "your_cards"}>
                    <h3>Your cards</h3>
                    {#if $game.state == "pick" && $game.turnId == $user._id}
                        <div class="pick_control" in:fly>
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
                    <div class="cards_dnd" >
                        {#if $game.cards.length > 0}
                            {#each $game.cards.find(i => i._id == $user._id).cards as card, i (card.id)}
                                <div 
                                    in:fly="{{x: 300, delay: i * 200}}"
                                    class={notAllowed == card.id ? "card_wrapper clickable notAllowed" : "card_wrapper clickable"}
                                    on:dblclick={() => doubleClick(card)}
                                    animate:flip="{{duration: flipDurationMs}}"
                                >
                                    <Card
                                        card={card}
                                    />
                                </div>
                            {:else}
                                <p>Waiting for cards...</p>
                            {/each}
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    </div>
    <Info />
</div>


<style>
    /*
* Prefixed by https://autoprefixer.github.io
* PostCSS: v7.0.29,
* Autoprefixer: v9.7.6
* Browsers: last 4 version
*/

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
    .wrapper {
        width: 100%;
        height: 100%;
        display: -webkit-box;
        display: -ms-flexbox;
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
        transition: background .3s ease-in;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
            -ms-flex-direction: column;
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
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        padding: .25rem;
        padding-top: 0;
    }
    .area {
        width: 75%;
        height: 70%;
        background: white;
        float: left;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
            -ms-flex-direction: column;
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
        transition: background .3s ease-in;
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
        -webkit-transform: translate(-50%, -50%);
            -ms-transform: translate(-50%, -50%);
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
        -webkit-transform: translateY(-50%);
            -ms-transform: translateY(-50%);
                transform: translateY(-50%);
    }
    .inturn::before {
        content: 'Waiting for player...';
        position: absolute;
        font-size: 1rem;
        left: 50%;
        top: 50%;
        -webkit-transform: translate(-50%, -50%);
            -ms-transform: translate(-50%, -50%);
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
        padding: 0 2rem;
    }
    .dropzone {
        width: 100%;
        height: 50%;
        border-top: 2px solid #ccc;
        /* background: var(--light-blue); */
        padding: 1rem;
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
    .card_wrapper {
        width: 150px;
        height: 210px;
        border-radius: 10px;
        background: white;
        -webkit-box-shadow: 0 0 5px rgba(0, 0, 0, .3);
                box-shadow: 0 0 5px rgba(0, 0, 0, .3);
        margin: 1rem;
        margin-left: -60px;
        position: relative;
        overflow: hidden;
    }
    .card_wrapper:first-of-type {
        margin-left: 0;
    }
    .clickable {
        -webkit-transition: -webkit-transform .3s ease;
        transition: -webkit-transform .3s ease;
        -o-transition: transform .3s ease;
        transition: transform .3s ease;
        transition: transform .3s ease, 
        -webkit-transform .3s ease;
        cursor: grab;
    }
    .clickable:hover {
        transform: scale(1.05);
    }
    .mini {
        width: 75px;
        height: 105px;
        background: white;
        border-radius: 8px;
        margin-left: -40px;
        -webkit-box-shadow: 0 0 5px rgb(0 0 0 / 26%);
                box-shadow: 0 0 5px rgb(0 0 0 / 26%);
        position: relative;
    }
    .mini:first-of-type {
        margin-left: 0 !important;
    }
    .played__card {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
            -ms-flex-direction: column;
                flex-direction: column;
        width: -webkit-min-content;
        width: -moz-min-content;
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
    .card_to_beat img {
        width: 20px;
        height: auto;
        margin-left: .5rem;
    }
    .winner_card {
        -webkit-transform: scale(1.2);
            -ms-transform: scale(1.2);
                transform: scale(1.2);
        -webkit-box-shadow: 0 0 7px rgba(80, 248, 38, 0.596) !important;
                box-shadow: 0 0 7px rgba(80, 248, 38, 0.596) !important;
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

    /* Player styling */
    .your_cards {
        width: 100%;
        height: -webkit-fit-content;
        height: -moz-fit-content;
        height: fit-content;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        transition: background .3s ease-in;
        -ms-flex-wrap: nowrap;
            flex-wrap: nowrap;
        -webkit-box-align: center;
            -ms-flex-align: center;
                align-items: center;
        display: flex;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
            -ms-flex-direction: column;
                flex-direction: column;
    }
    .inturn_you {
        position: relative;
    }
    .inturn_you::after {
        content: '';
        position: absolute;
        top: -60px;
        z-index: 100;
        left: 48%;
        border-top: 50px solid var(--dark-blue);
        border-left: 25px solid transparent;
        border-right: 25px solid transparent;
    }
    input[type="number"] {
        width: 35px;
        padding: .5rem .25rem;
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
    .pick_control {
        position: absolute;
        bottom: 100%;
        -webkit-transform: translateY(-28%);
            -ms-transform: translateY(-28%);
                transform: translateY(-28%);
        background: #ccc;
        padding: 1rem;
        border-radius: 10px;
        -webkit-box-shadow: 0 0 10px rgb(0 0 0 / 30%);
                box-shadow: 0 0 10px rgb(0 0 0 / 30%)
    }
    .cards_dnd {
        width: 100%;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-align: center;
            -ms-flex-align: center;
                align-items: center;
        -webkit-box-pack: center;
            -ms-flex-pack: center;
                justify-content: center;
        height: 100%;
    }
    .notAllowed {
        background: rgb(252, 132, 132);
    }

    @media screen and (max-width: 1280px)  {
        .notifications {
            display: block;
        }
        .card_wrapper {
            height: 150px;
            width: 107px;
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