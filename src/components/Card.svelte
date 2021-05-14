<script>
    export let mini = false
    export let card = {}
    export let played = false


</script>

<div class:mini class:played class="card_wrapper">
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
    /*
* Prefixed by https://autoprefixer.github.io
* PostCSS: v7.0.29,
* Autoprefixer: v9.7.6
* Browsers: last 4 version
*/

    .card_wrapper {
        width: 100%;
        height: 100%;
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        -webkit-transition: -webkit-transform .3s ease-in-out;
        transition: -webkit-transform .3s ease-in-out;
        -o-transition: transform .3s ease-in-out;
        transition: transform .3s ease-in-out;
        transition: transform .3s ease-in-out, -webkit-transform .3s ease-in-out;
    }
    .card__outer {
        position: absolute;
        top: 5px;
        left: 5px;
        height: 50px;
        z-index: 1;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
            -ms-flex-direction: column;
                flex-direction: column;
        -webkit-box-align: center;
            -ms-flex-align: center;
                align-items: center;
        -webkit-box-pack: start;
            -ms-flex-pack: start;
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
        -webkit-transform: translate(-50%, -50%);
            -ms-transform: translate(-50%, -50%);
                transform: translate(-50%, -50%);
        border-radius: 10px;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-align: center;
            -ms-flex-align: center;
                align-items: center;
        -webkit-box-pack: center;
            -ms-flex-pack: center;
                justify-content: center;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
            -ms-flex-direction: column;
                flex-direction: column;
        font-size: 4rem;
    }
    .chosen {
        background: rgb(180, 202, 243)
    }
    .mini {
        width: 100%;
        height: 100%;
        padding: 4px;
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
    .played .card__outer img{
        width: 10px;
    }
    .played .number {
        font-size: 1rem;
    }
    .played .card__inner {
        width: 50% !important;
    }
</style>