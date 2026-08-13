import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build
export default defineConfig({
  // URL publique du site (à passer sur le vrai domaine quand il sera acheté).
  site: 'https://flambarts.vercel.app',
  output: 'static',
  integrations: [
    sitemap({
      // On n'indexe pas la page de remerciement.
      filter: (page) => !page.includes('/merci'),
    }),
  ],
});
