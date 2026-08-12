import { defineConfig } from 'astro/config';

// https://astro.build
export default defineConfig({
  site: 'https://lesflambarts.fr',
  // Pages statiques : sortie 100% HTML, hébergement gratuit sur Vercel.
  output: 'static',
});
