<script>
    export let mini = ""
    export let card = ""



</script>

<div class:mini class="card_wrapper">
    {#if !mini}
        <div class="card__outer {card.suit}">
            <span class="number">{card.text}</span>
            <img src="{card.suit}.png" alt="Playing card suit">
        </div>
        <img src="{card.suit}.png" alt="Playing card suit" class="card__inner">
    {:else}
        <div class="inner_background"></div>
    {/if}
</div>


<style>
    .card_wrapper {
        width: 100%;
        height: 100%;
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        transition: transform .3s ease-in-out;
    }
    .card__outer {
        position: absolute;
        top: 5px;
        left: 5px;
        height: 50px;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: 1.5rem;
    }
    .card__outer img {
        width: 20px;
    }
    .card__inner {
        width: 66%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        font-size: 4rem;
    }
    .chosen {
        background: rgb(180, 202, 243)
    }
    .mini {
        width: 100%;
        height: 100%;
        padding: 10px;
    }
    .inner_background {
        width: 100%;
        height: 100%;
        background: rgb(180, 202, 243);
        border-radius: 8px;
    }
    .chosen {
        background: rgb(180, 202, 243)
    }

    @media screen and (max-width: 1280px)  {
        
    }
</style>