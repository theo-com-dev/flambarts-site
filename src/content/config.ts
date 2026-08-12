import { defineCollection, z } from 'astro:content';

// Agenda : les dates de concert à venir (éditables depuis /admin).
const agenda = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.coerce.date(),
    heure: z.string().optional(),
    lieu: z.string(),
    ville: z.string().optional(),
    info: z.string().optional(),
  }),
});

// Actualités : les articles / nouvelles (éditables depuis /admin).
const actualites = defineCollection({
  type: 'content',
  schema: z.object({
    titre: z.string(),
    date: z.coerce.date(),
    tag: z.string().optional(),
    image: z.string().optional(),
  }),
});

// Musique : les extraits audio de la page d'accueil (éditables depuis /admin).
const musique = defineCollection({
  type: 'content',
  schema: z.object({
    titre: z.string(),
    fichier: z.string(),
  }),
});

export const collections = { agenda, actualites, musique };
