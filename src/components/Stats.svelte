<script>
    import Plump from './Plump.svelte'
    import game from '../stores/game'
    import user from '../stores/user'

</script>

<div class="stats">
    <h3>Stats</h3>
    <table>
        <tr>
            <th>#</th>
            <th>Cards</th>
            {#each $game.players as player (player._id)}
                {#if player._id == $user._id}
                    <th>You</th>
                {:else}
                    <th>{player.name}</th>
                {/if}
            {/each}
        </tr>
        {#if $game.round > 0}
            {#each $game.stats as stat (stat.round)}
                <tr class={$game.round == stat.round ? "activeround" : ""}>
                    <th>{stat.round}</th>
                    <th>{stat.cards}</th>
                    {#if $game.round <= stat.round}
                        {#each stat.promises as promise (promise._id)}
                            {#if promise.value != -1}
                                <td>({promise['value']})</td>
                            {:else}
                                <td></td>
                            {/if}
                        {/each}
                    {:else}
                        {#each stat.score as score (score._id)}
                            {#if score['value'] == -1}
                                <td><Plump /></td>
                            {:else}
                                <td>{score['value']}</td>
                            {/if}
                        {/each}
                    {/if}
                </tr>
            {/each}
        {/if}
        <tr class="total">
            <th>Total</th>
            <th>points</th>
            {#each $game.points as point}
                <th>{point}</th>
            {/each}
        </tr>
    </table>
</div>

<style>
    .stats {
        width: 100%;
        height: auto;
        max-height: 60%;
        background: #ccc;
        padding: 1rem;
        position: relative;
        z-index: 1500;
    }
    .total {
        border-top: 1px solid #444;
    }
</style>