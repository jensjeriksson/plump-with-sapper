<script> 
    import { createEventDispatcher } from 'svelte'
    import Card from './Card.svelte'
    import user from '../stores/user'
    import game from '../stores/game'
    import socket from '../../scripts/socket'
    import { flip } from 'svelte/animate'
    import { fly } from 'svelte/transition'

    let dispatch = createEventDispatcher()
    let myPicks = 0
    let notAllowed = ""

    $: {
        if(myPicks == 0 && $game.notAllowed == 0 && $game.state == "pick" && $game.turnId == $user._id) {
            myPicks = 1
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


    //DND setup and functions
    const flipDurationMs = 300;

    function doubleClick(event) {
        let card = document.getElementById(event.id).getBoundingClientRect()
        let top = card.top
        let left = card.left

        //Check if card is allowed to be played
        if($game.currentRound.length == 0 && $game.turnId == $user._id) {
            //This means that player is first out, all cards are allowed
            //Play card!! 
            dispatch('coordinates', {left, top})
            game.playCard({
                _id: $user._id,
                name: $user.name,
                game: window.location.pathname.split('/')[2],
                card: event
            })
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
                dispatch('coordinates', {left, top})
                //play card
                game.playCard({
                    _id: $user._id,
                    name: $user.name,
                    game: window.location.pathname.split('/')[2],
                    card: event
                })
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
                console.log('Card now Allowed')
                notAllowed = event.id

                setTimeout(() => {
                    if(notAllowed == event.id) return notAllowed = ""
                }, 2000);
            }
            if(event.suit !== cardToMatch.suit && myCards.filter(p => p.suit == cardToMatch.suit).length == 0) {
                dispatch('coordinates', {left, top})
                game.playCard({
                    _id: $user._id,
                    card: event
                })
                socket.emit('playCard', {
                    _id: $user._id,
                    name: $user.name,
                    game: window.location.pathname.split('/')[2],
                    card: event
                })
            }

        }
    }

</script>

<div class={$game.turnId == $user._id  && $game.state == "pick" ? "your_cards inturn" : "your_cards"}>
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
    {#if $game.cards.length > 0}
        <div class="cards_dnd" >
            {#each $game.cards.find(i => i._id == $user._id).cards as card, i (card.id)}
                <div 
                    in:fly={{x: 300, delay: i * 200}}
                    class={notAllowed == card.id ? "card_wrapper notAllowed" : "card_wrapper"}
                    on:dblclick={doubleClick.bind(this, card)}
                    animate:flip="{{duration: flipDurationMs}}"
                    id={card.id}
                >
                    <Card
                        card={card}
                    />
                </div>
            {/each}
        </div>
    {/if}
</div>


<style>
    /*
* Prefixed by https://autoprefixer.github.io
* PostCSS: v7.0.29,
* Autoprefixer: v9.7.6
* Browsers: last 4 version
*/

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
        -webkit-transition: -webkit-transform .3s ease-in-out;
        transition: -webkit-transform .3s ease-in-out;
        -o-transition: transform .3s ease-in-out;
        transition: transform .3s ease-in-out;
        transition: transform .3s ease-in-out, -webkit-transform .3s ease-in-out;
        cursor: -webkit-grab;
        cursor: grab;
    }
    .card_wrapper:first-of-type {
        margin-left: 0;
    }
    .card_wrapper:hover {
        -webkit-transform: scale(1.05);
            -ms-transform: scale(1.05);
                transform: scale(1.05);
    }
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
    .inturn {
        position: relative;
    }
    .inturn::after {
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
        .card_wrapper {
            height: 150px;
            width: 107px;
        }
    }
</style>