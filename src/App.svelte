<script>
  import Game from './lib/Game.svelte';
</script>

<main>
  <Game />
</main>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: #000;
    overflow: hidden;
  }

  :global(html, body, #app) {
    width: 100%;
    height: 100%;
  }

  main {
    width: 100vw;
    height: 100dvh;
  }
</style>
