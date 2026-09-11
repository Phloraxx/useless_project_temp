export type MovieCameo = {
  line: string
  movie: string
  year: number
  originalIntent: string
  gameUseOnlyWhen: string
}

// Very short text-only quotation candidates. No film audio/video is bundled.
// These are deliberately NOT wired to generic success events: context must match the scene intent.
export const MOVIE_CAMEOS = {
  swaggerOneUpmanship: {
    line: "സവാരി ഗിരിഗിരി",
    movie: "Ravanaprabhu",
    year: 2001,
    originalIntent: "swagger / one-upmanship; the character imposes himself after putting someone in their place",
    gameUseOnlyWhen: "a recurring rival bus/driver challenges the player and the player wins that specific social contest; never for ordinary driving",
  },
  dismissNamedNuisance: {
    line: "നീ പോ മോനേ ദിനേശാ",
    movie: "Narasimham",
    year: 2000,
    originalIntent: "a dismissive punch line aimed at Dineshan, asserting dominance over a specific person",
    gameUseOnlyWhen: "a named recurring nuisance character is actually being dismissed from a scene; never for cones, autos, or random traffic",
  },
  confrontReturningFace: {
    line: "ഓർമ്മയുണ്ടോ ഈ മുഖം?",
    movie: "Commissioner",
    year: 1994,
    originalIntent: "confrontational recognition between characters with history",
    gameUseOnlyWhen: "a previously established recurring rival/person reappears and recognizes the player; not a generic retry line",
  },
  grandPlanCollapsed: {
    line: "അങ്ങനെ പവനായി ശവമായി!",
    movie: "Nadodikkaattu",
    year: 1987,
    originalIntent: "a grand, heavily hyped plan/person has ended in spectacular failure",
    gameUseOnlyWhen: "a non-injury elaborate scheme or prop fails after being overhyped; never after a real collision or injury",
  },
  shutDownIrrelevantArgument: {
    line: "പോളണ്ടിനെപ്പറ്റി നീ ഒരക്ഷരം മിണ്ടരുത്.",
    movie: "Sandesam",
    year: 1991,
    originalIntent: "shutting down an inconvenient political counterargument during an ideological quarrel",
    gameUseOnlyWhen: "two NPCs are already in a ridiculous irrelevant argument and one abruptly bans the topic; never as a random examiner bark",
  },
} as const satisfies Record<string, MovieCameo>
