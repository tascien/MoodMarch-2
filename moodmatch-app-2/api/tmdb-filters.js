// MAPPING ULTRA-PRÉCIS QUIZ → FILTRES TMDB

/**
 * GENRES TMDB (IDs officiels)
 */
export const TMDB_GENRES = {
  // Films
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
  // Séries (quelques différences)
  actionAdventure: 10759, // Action & Adventure (TV)
  kids: 10762, // Kids (TV)
  news: 10763, // News (TV)
  reality: 10764, // Reality (TV)
  scifiFantasy: 10765, // Sci-Fi & Fantasy (TV)
  soap: 10766, // Soap (TV)
  talk: 10767, // Talk (TV)
  warPolitics: 10768, // War & Politics (TV)
}

/**
 * CERTIFICATIONS TMDB par pays
 */
export const TMDB_CERTIFICATIONS = {
  FR: {
    family: ["U", "G"], // Tout public
    teen: ["12", "PG-13"], // Ados
    mature: ["16", "18", "R", "NC-17"], // Adultes
  },
  US: {
    family: ["G", "PG"],
    teen: ["PG-13"],
    mature: ["R", "NC-17"],
  },
}

/**
 * DÉCENNIES → FILTRES DATES TMDB
 */
export const DECADE_TO_DATES = {
  "2020s": { from: "2020-01-01", to: "2030-12-31" },
  "2010s": { from: "2010-01-01", to: "2019-12-31" },
  "2000s": { from: "2000-01-01", to: "2009-12-31" },
  "90s": { from: "1990-01-01", to: "1999-12-31" },
  classic: { from: "1900-01-01", to: "1989-12-31" },
  any: { from: "1900-01-01", to: "2030-12-31" },
}

/**
 * POPULARITÉ → SEUILS TMDB
 */
export const POPULARITY_TO_THRESHOLDS = {
  blockbuster: { min: 2000, max: 100000, votes: 5000 }, // Marvel, Fast & Furious
  popular: { min: 500, max: 2000, votes: 2000 }, // Films très connus
  mixed: { min: 50, max: 500, votes: 500 }, // Mélange
  indie: { min: 10, max: 100, votes: 100 }, // Indépendants
  hidden: { min: 1, max: 50, votes: 20 }, // Pépites cachées
}

/**
 * NOTES → SEUILS TMDB
 */
export const RATING_TO_THRESHOLDS = {
  masterpiece: 8.5,
  excellent: 7.5,
  good: 6.5,
  decent: 5.5,
  any: 0,
}

/**
 * QUIZ GENRE → GENRES TMDB PRIMAIRES
 */
export const QUIZ_GENRE_TO_TMDB = {
  comedy: {
    primary: [TMDB_GENRES.comedy],
    secondary: [TMDB_GENRES.romance, TMDB_GENRES.music],
    exclude: [TMDB_GENRES.horror, TMDB_GENRES.thriller, TMDB_GENRES.war],
  },
  action: {
    primary: [TMDB_GENRES.action, TMDB_GENRES.adventure],
    secondary: [TMDB_GENRES.scifi, TMDB_GENRES.fantasy],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.romance, TMDB_GENRES.family],
  },
  romance: {
    primary: [TMDB_GENRES.romance],
    secondary: [TMDB_GENRES.comedy, TMDB_GENRES.drama],
    exclude: [TMDB_GENRES.horror, TMDB_GENRES.thriller, TMDB_GENRES.action],
  },
  thriller: {
    primary: [TMDB_GENRES.thriller],
    secondary: [TMDB_GENRES.mystery, TMDB_GENRES.crime],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.romance, TMDB_GENRES.family],
  },
  horror: {
    primary: [TMDB_GENRES.horror],
    secondary: [TMDB_GENRES.thriller],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.romance, TMDB_GENRES.family],
  },
  drama: {
    primary: [TMDB_GENRES.drama],
    secondary: [TMDB_GENRES.history, TMDB_GENRES.crime],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.action, TMDB_GENRES.family],
  },
  scifi: {
    primary: [TMDB_GENRES.scifi],
    secondary: [TMDB_GENRES.fantasy, TMDB_GENRES.action],
    exclude: [TMDB_GENRES.romance, TMDB_GENRES.comedy, TMDB_GENRES.family],
  },
  fantasy: {
    primary: [TMDB_GENRES.fantasy],
    secondary: [TMDB_GENRES.adventure, TMDB_GENRES.action],
    exclude: [TMDB_GENRES.horror, TMDB_GENRES.thriller, TMDB_GENRES.crime],
  },
}

/**
 * QUIZ MOOD → MODIFICATION DES GENRES
 */
export const QUIZ_MOOD_MODIFIERS = {
  feelgood: {
    boost: [TMDB_GENRES.comedy, TMDB_GENRES.romance, TMDB_GENRES.music, TMDB_GENRES.animation],
    exclude: [TMDB_GENRES.horror, TMDB_GENRES.thriller, TMDB_GENRES.war, TMDB_GENRES.crime],
    keywords: [9840, 1701, 4344, 10683], // feel-good, friendship, summer, happiness
  },
  intense: {
    boost: [TMDB_GENRES.action, TMDB_GENRES.adventure, TMDB_GENRES.war, TMDB_GENRES.thriller],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.romance, TMDB_GENRES.family],
    keywords: [9715, 4565, 10364], // action, intense, epic
  },
  dark: {
    boost: [TMDB_GENRES.thriller, TMDB_GENRES.horror, TMDB_GENRES.crime, TMDB_GENRES.mystery],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.romance, TMDB_GENRES.family, TMDB_GENRES.music],
    keywords: [9663, 12554, 10364], // dark, psychological, mystery
  },
  emotional: {
    boost: [TMDB_GENRES.drama, TMDB_GENRES.romance, TMDB_GENRES.history],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.action, TMDB_GENRES.horror],
    keywords: [1701, 10683, 4344], // emotional, love, drama
  },
  fun: {
    boost: [TMDB_GENRES.comedy, TMDB_GENRES.animation, TMDB_GENRES.adventure],
    exclude: [TMDB_GENRES.horror, TMDB_GENRES.thriller, TMDB_GENRES.drama],
    keywords: [9716, 10683, 1701], // fun, entertainment, friendship
  },
  scary: {
    boost: [TMDB_GENRES.horror, TMDB_GENRES.thriller],
    exclude: [TMDB_GENRES.comedy, TMDB_GENRES.romance, TMDB_GENRES.family, TMDB_GENRES.music],
    keywords: [9663, 12554], // scary, psychological
  },
}

/**
 * COMPANY → MODIFICATIONS FILTRES
 */
export const COMPANY_MODIFIERS = {
  alone: {
    // Seul = plus de liberté, contenu mature OK
    certificationBoost: ["mature"],
    genreBoost: [TMDB_GENRES.thriller, TMDB_GENRES.drama, TMDB_GENRES.documentary],
  },
  couple: {
    // Couple = romance, pas trop violent
    genreBoost: [TMDB_GENRES.romance, TMDB_GENRES.comedy, TMDB_GENRES.drama],
    exclude: [TMDB_GENRES.horror, TMDB_GENRES.war],
  },
  family: {
    // Famille = contenu familial obligatoire
    certificationForce: ["family", "teen"],
    genreBoost: [TMDB_GENRES.family, TMDB_GENRES.animation, TMDB_GENRES.adventure],
    exclude: [TMDB_GENRES.horror, TMDB_GENRES.thriller, TMDB_GENRES.crime],
  },
  friends: {
    // Amis = fun, divertissant
    genreBoost: [TMDB_GENRES.comedy, TMDB_GENRES.action, TMDB_GENRES.adventure],
    exclude: [TMDB_GENRES.romance], // Éviter romance entre amis
  },
}

/**
 * FONCTION PRINCIPALE : CONVERTIT RÉPONSES QUIZ → PARAMÈTRES TMDB
 */
export function convertQuizToTMDBFilters(answers) {
  const filters = {
    // Paramètres de base
    with_genres: [],
    without_genres: [],
    with_keywords: [],
    "vote_average.gte": 0,
    "vote_count.gte": 0,
    "primary_release_date.gte": "1900-01-01",
    "primary_release_date.lte": "2030-12-31",
    "first_air_date.gte": "1900-01-01", // Pour les séries
    "first_air_date.lte": "2030-12-31",
    certification_country: "FR",
    certification: "",
    sort_by: "popularity.desc",
    page: 1,
  }

  // 1. GENRE PRINCIPAL
  if (answers.genre && QUIZ_GENRE_TO_TMDB[answers.genre]) {
    const genreConfig = QUIZ_GENRE_TO_TMDB[answers.genre]
    filters.with_genres.push(...genreConfig.primary)
    filters.without_genres.push(...genreConfig.exclude)
  }

  // 2. MOOD MODIFIER
  if (answers.mood && QUIZ_MOOD_MODIFIERS[answers.mood]) {
    const moodConfig = QUIZ_MOOD_MODIFIERS[answers.mood]
    
    // Ajouter genres boostés par le mood
    filters.with_genres.push(...moodConfig.boost)
    filters.without_genres.push(...moodConfig.exclude)
    
    // Ajouter mots-clés
    if (moodConfig.keywords) {
      filters.with_keywords.push(...moodConfig.keywords)
    }
  }

  // 3. DÉCENNIE
  if (answers.decade && DECADE_TO_DATES[answers.decade]) {
    const dates = DECADE_TO_DATES[answers.decade]
    filters["primary_release_date.gte"] = dates.from
    filters["primary_release_date.lte"] = dates.to
    filters["first_air_date.gte"] = dates.from
    filters["first_air_date.lte"] = dates.to
  }

  // 4. POPULARITÉ
  if (answers.popularity && POPULARITY_TO_THRESHOLDS[answers.popularity]) {
    const popConfig = POPULARITY_TO_THRESHOLDS[answers.popularity]
    filters["vote_count.gte"] = popConfig.votes
    
    // Modifier le tri selon la popularité
    if (answers.popularity === "blockbuster" || answers.popularity === "popular") {
      filters.sort_by = "popularity.desc"
    } else if (answers.popularity === "hidden") {
      filters.sort_by = "vote_count.asc"
    } else {
      filters.sort_by = "vote_average.desc"
    }
  }

  // 5. NOTE MINIMUM (CORRECTION CRITIQUE)
  if (answers.rating && RATING_TO_THRESHOLDS[answers.rating] !== undefined) {
    const minRating = RATING_TO_THRESHOLDS[answers.rating]
    filters["vote_average.gte"] = minRating
    console.log(`🎯 NOTE MINIMUM APPLIQUÉE: ${minRating} (demandé: ${answers.rating})`)
  }

  // 6. CERTIFICATION
  if (answers.certification && answers.certification !== "any") {
    const certifications = TMDB_CERTIFICATIONS.FR[answers.certification] || []
    if (certifications.length > 0) {
      filters.certification = certifications.join(",")
    }
  }

  // 7. COMPANY MODIFIERS
  if (answers.company && COMPANY_MODIFIERS[answers.company]) {
    const companyConfig = COMPANY_MODIFIERS[answers.company]
    
    if (companyConfig.genreBoost) {
      filters.with_genres.push(...companyConfig.genreBoost)
    }
    
    if (companyConfig.exclude) {
      filters.without_genres.push(...companyConfig.exclude)
    }
    
    if (companyConfig.certificationForce) {
      const certs = companyConfig.certificationForce.flatMap(cert => 
        TMDB_CERTIFICATIONS.FR[cert] || []
      )
      if (certs.length > 0) {
        filters.certification = certs.join(",")
      }
    }
  }

  // 8. NETTOYER LES DOUBLONS
  filters.with_genres = [...new Set(filters.with_genres)]
  filters.without_genres = [...new Set(filters.without_genres)]
  filters.with_keywords = [...new Set(filters.with_keywords)]

  // 9. CONVERTIR EN STRINGS POUR TMDB
  if (filters.with_genres.length > 0) {
    filters.with_genres = filters.with_genres.join(",")
  } else {
    delete filters.with_genres
  }

  if (filters.without_genres.length > 0) {
    filters.without_genres = filters.without_genres.join(",")
  } else {
    delete filters.without_genres
  }

  if (filters.with_keywords.length > 0) {
    filters.with_keywords = filters.with_keywords.join("|") // OR pour les mots-clés
  } else {
    delete filters.with_keywords
  }

  // DEBUG FINAL - VÉRIFICATION CRITIQUE
  console.log("🔍 FILTRES FINAUX AVANT ENVOI TMDB:")
  console.log("- Note minimum:", filters["vote_average.gte"])
  console.log("- Votes minimum:", filters["vote_count.gte"])
  console.log("- Genres inclus:", filters.with_genres)
  console.log("- Genres exclus:", filters.without_genres)

  console.log("🎯 FILTRES TMDB GÉNÉRÉS:", filters)
  
  return filters
}

/**
 * FONCTION POUR DÉBUGGER LES FILTRES
 */
export function debugFilters(answers) {
  console.log("📝 RÉPONSES QUIZ:", answers)
  
  const filters = convertQuizToTMDBFilters(answers)
  
  console.log("🔍 ANALYSE DES FILTRES:")
  console.log("- Genres inclus:", filters.with_genres)
  console.log("- Genres exclus:", filters.without_genres)
  console.log("- Mots-clés:", filters.with_keywords)
  console.log("- Note minimum:", filters["vote_average.gte"])
  console.log("- Votes minimum:", filters["vote_count.gte"])
  console.log("- Période:", filters["primary_release_date.gte"], "→", filters["primary_release_date.lte"])
  console.log("- Certification:", filters.certification)
  console.log("- Tri:", filters.sort_by)
  
  return filters
}
