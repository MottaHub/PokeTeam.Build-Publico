(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('support-share');
    if (!button) return;

    button.addEventListener('click', async () => {
      const url = `${window.location.origin}${window.location.pathname}#teambuilder`;
      const text = 'Conheça o PokéBuild: monte seu time, crie tier lists e descubra qual Pokémon combina com você.';
      const original = '↗ Compartilhar projeto';

      try {
        if (navigator.share) {
          await navigator.share({ title: 'PokéBuild', text, url });
          return;
        }
        await navigator.clipboard.writeText(`${text}\n${url}`);
        button.textContent = 'Link copiado!';
      } catch (error) {
        if (error.name === 'AbortError') return;
        window.prompt('Copie o link do PokéBuild:', url);
      }

      setTimeout(() => {
        if (button.isConnected) button.textContent = original;
      }, 2500);
    });
  });
})();
