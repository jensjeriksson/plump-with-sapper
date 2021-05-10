<script>
    import { createEventDispatcher } from 'svelte'
    import Card from './Card.svelte'
    import user from '../stores/user'
    import game from '../stores/game'
    import socket from '../../scripts/socket'
    import { flip } from 'svelte/animate'
    import { fly } from 'svelte/transition'
    import {dndzone} from "svelte-dnd-action";

    let dispatch = createEventDispatcher()
    let myPicks = 0
    let items = [];
    let dragDisabled = true

    $: {
        if(myPicks == 0 && $game.notAllowed == 0 && $game.state == "pick" && $game.turnId == $user._id) {
            myPicks = 1
        }
    }

    $: {
        if($game.state == "play") {
            dragDisabled = false
        }
    }

    $: {
        if($game.cards.length > 0){
            items = $game.cards.find(i => i._id == $user._id).cards
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

    function handleDndConsider(e) {
        items = e.detail.items;

        //Check if card is allowed to be played
        if($game.currentRound.length == 0) {
            //This means that player is first out, all cards are allowed
            dispatch('enableDropzone')
        } else {
            let cardToMatch = $game.currentRound[0].card
            let myCards = $game.cards.find(i => i._id == $user._id).cards
            let playedCard = myCards.find(j => j.id == e.detail.info.id)
    

    
            if(playedCard.suit == cardToMatch.suit) return dispatch('enableDropzone')
            if(playedCard.suit !== cardToMatch.suit && myCards.filter(p => p.suit == cardToMatch.suit).length > 0) return dispatch('disableDropzone')
            if(playedCard.suit !== cardToMatch.suit && myCards.filter(p => p.suit == cardToMatch.suit).length == -1) return dispatch('enableDropzone')

        }
    }
    function handleDndFinalize(e) {
        items = e.detail.items;
    }
</script>

<div class={$game.turnId == $user._id  && $game.state == "pick" ? "your_cards inturn" : "your_cards"}>
    <h3>Your hand</h3>
    {#if $game.state == "pick" && $game.turnId == $user._id}
        <div class="pick_control">
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
                <button>Submit picks</button>
            </form>
        </div>
    {/if}
    {#if $game.cards.length > 0}
        <div class="cards_dnd" use:dndzone="{{items, flipDurationMs, dragDisabled}}" on:consider="{handleDndConsider}" on:finalize="{handleDndFinalize}">
            {#each items as item, i (item.id)}
                <div class="card_wrapper"  animate:flip="{{duration: flipDurationMs}}" in:fly={{x: 300, delay: 200 * i}}>
                    <Card
                        card={item}
                    />
                </div>
            {/each}
        </div>
    {/if}
</div>


<style>
    .card_wrapper {
        width: 150px;
        height: 210px;
        border-radius: 10px;
        background: white;
        box-shadow: 0 0 5px rgba(0, 0, 0, .3);
        margin: 1rem;
        margin-left: -60px;
        position: relative;
        overflow: hidden;
        transition: transform .3s ease-in-out;
        cursor: grab;
    }
    .card_wrapper:first-of-type {
        margin-left: 0;
    }
    .card_wrapper:hover {
        transform: scale(1.05);
    }
    .your_cards {
        width: 100%;
        height: fit-content;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        display: flex;
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
        display: flex;
    }
    .my_picks {
        padding: .25rem;
        background: white;
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
        transform: translateY(-28%);
        background: #ccc;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 0 10px rgb(0 0 0 / 30%)
    }
    .cards_dnd {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
    .notAllowed {
        font-size: .9rem;
        color: red;
    }

    @media screen and (max-width: 1281px)  {
        .card_wrapper {
            width: 114px;
            height: 162px;
        }
    }
</style>