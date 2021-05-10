<script>
    import messages from '../stores/messages'
    import Stats from './Stats.svelte'
    import socket from '../../scripts/socket'
    import game from '../stores/game'
    import { fade, fly } from 'svelte/transition'


    let message
    let toggleInfo = false

    function toggleMenu() {
        if(window.innerWidth <= 1280) toggleInfo = !toggleInfo
    }

    function chat(){
        let output = {
            message: {
                time: new Date(),
                user: window.sessionStorage.getItem('name'),
                text: message,
                _id: Math.random() * 10000
            },
            room: window.location.pathname.split('/')[2]
        }
        messages.write({
                time: new Date(),
                user: 'You',
                text: message,
                _id: Math.random() * 10000
            })
        socket.emit('chat', output)
        message = ""
        document.querySelector('.chat').scrollTop = document.querySelector('.chat').scrollHeight
    }

    socket.on('chat', message => {
        messages.write(message)
        document.querySelector('.chat').scrollTop = document.querySelector('.chat').scrollHeight
    })
    
</script>


<div class="info" class:toggleInfo>
    {#if toggleInfo}
        <div class="cover" transition:fade|local on:click={() => toggleInfo = false}></div>
    {/if}
    <div class="openinfo" on:click={toggleMenu}>
        <div class="center"></div>
    </div>
    {#if $game.round > 0 && $game.state}
        <Stats />
    {/if}
    <div class="chat">
        <div class="messages">
            <div class="message">
                <p class="time">{new Date().toLocaleTimeString()} - Welcome message</p>
                <p class="text">Welcome to a game of plump. Feel free to chat with your opponents</p>
            </div>
            {#each $messages as mess}
            <div class="message" in:fly={{x: 300}}>
                <p class="time">{new Date(mess.time).toLocaleTimeString()} - {mess.user} wrote</p>
                <p class="text">{mess.text}</p>
            </div>
            {:else}
            <div class="message">
                <p>Be the first one to say something</p>
            </div>
            {/each}
        </div>
    </div>
    <form on:submit|preventDefault={chat}>
        <input type="text" bind:value={message} placeholder="Chat with opponents" required>
        <input type="submit" value="Send">
    </form>
</div>


<style>
    .info {
        width: 30%;
        height: 100%;
        display: flex;
        flex-direction: column;
        float: left;
        justify-content: space-between;
    }
    .chat {
        width: 100%;
        height: 40%;
        background: #fafafa;
        padding: 1rem;
        position: relative;
        bottom: 0;
        display: flex;
        flex-direction: column;
        z-index: 1500;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: 0;
    }
    .chat::-webkit-scrollbar {
        display: none;
    }
    .message {
        font-size: 12px;
        background: var(--light-blue);
        color: white;
        padding: .5rem;
        border-radius: 10px;
        margin-bottom: 1rem;
    }
    form {
        width: 100%;
        height: auto;
        overflow: hidden;
        background: #fafafa;
        flex-direction: row;
        margin: 0;
        padding: 1rem;
    }
    input[type="text"] {
        width: 70%;
        margin-right: 1rem;
        border: 2px solid var(--light-blue);
        border-radius: 5px;
    }
    input[type="text"]::placeholder {
        color: var(--dark-blue)
    }
    input[type="submit"] {
        width: calc(30% - 1rem);
        cursor: pointer;
        background: var(--dark-blue);
        color: white;
        border-radius: 5px;
        outline: none;
        border: none;
    }
    .messages {
        width: 100%;
        height: auto;
    }
    .openinfo {
        width: 35px;
        height: 35px;
        position: absolute;
        right: 102%;
        z-index: 1000;
        top: 15px;
        background: var(--dark-blue);
        color: white;
        border-radius: 50%;
        padding: 7px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
    .center, .center::before, .center::after {
        width: 21px;
        height: 4px;
        background: white;
        border-radius: 100px;
    }
    .center::before {
        content: '';
        position: absolute;
        bottom: 8px;
    }
    .center::after {
        content: '';
        position: absolute;
        top: 9px;
    }
    .toggleInfo {
        left: 60% !important;
    }
    .cover {
        width: 100%;
        height: 100%;
        position: fixed;
        top: 0;
        left: 0;
        background: rgba(0, 0, 0, .7);
        z-index: 1000;
    }

    @media screen and (max-width: 1280px) {
        .info {
            width: 40vw;
            position: absolute;
            left: 100%;
            top: 0;
            transition: left .5s ease;
            z-index: 1500;
        }
    }
</style>