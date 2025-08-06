// Ajouter cet import en haut du fichier
import { convertQuizToTMDBFilters, debugFilters } from './tmdb-filters.js'

const TMDB_API_KEY = process.env.TMDB_API_KEY || "d8537543f30d3f70da040b6fe3e4eddc"
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500"

// Mapping ULTRA-PRÉCIS pour chaque mood avec genres primaires et secondaires
const MOOD_TO_GENRES = {
  // Feel-good = Comédie + Romance + Musique (PAS d'action)
  feelgood: {
    primary: [35, 10749, 10402], // Comedy, Romance, Music
    secondary: [16], // Animation (Pixar uniquement)
    exclude: [28, 12, 53, 27, 80, 9648, 18], // EXCLURE Action, Adventure, Thriller, Horror, Crime, Mystery, Drama
  },
  // Light = Lumineux et drôle (similaire à feel-good)
  light: {
    primary: [35, 10749, 10402], // Comedy, Romance, Music
    secondary: [16], // Animation
    exclude: [28, 12, 53, 27, 80, 9648, 18], // EXCLURE tout ce qui est sombre
  },
  // Humor = Comédie PURE
  humor: {
    primary: [35], // Comedy UNIQUEMENT
    secondary: [],
    exclude: [28, 12, 53, 27, 80, 9648, 18], // EXCLURE tout sauf comédie
  },
  // Action = Action/Adventure UNIQUEMENT
  action: {
    primary: [28, 12], // Action, Adventure
    secondary: [878, 14], // Sci-Fi, Fantasy (pour action épique)
    exclude: [35, 10749, 10402], // EXCLURE comédie, romance, musique
  },
  // Thriller = Suspense
  thrill: {
    primary: [53], // Thriller
    secondary: [27, 9648], // Horror, Mystery
    exclude: [35, 10749, 10402], // EXCLURE léger
  },
  // Romance = Romance PURE
  love: {
    primary: [10749], // Romance
    secondary: [35, 18], // Comedy, Drama (pour rom-com et drame romantique)
    exclude: [28, 12, 53, 27, 80], // EXCLURE action, thriller, etc.
  },
  // Horror = Horreur PURE
  horror: {
    primary: [27], // Horror
    secondary: [53], // Thriller
    exclude: [35, 10749, 10402], // EXCLURE léger
  },
  // Drama = Drame
  drama: {
    primary: [18], // Drama
    secondary: [36, 10752], // History, War
    exclude: [35, 28, 12], // EXCLURE comédie et action
  },
  // Documentaire
  think: {
    primary: [99], // Documentary
    secondary: [18], // Drama
    exclude: [35, 28, 12, 53, 27], // EXCLURE divertissement
  },
  // Sombre et mystérieux
  dark: {
    primary: [53, 27, 80, 9648], // Thriller, Horror, Crime, Mystery
    secondary: [18], // Drama
    exclude: [35, 10749, 10402], // EXCLURE léger
  },
  // Nostalgique
  nostalgic: {
    primary: [36, 10402, 10749], // History, Music, Romance
    secondary: [18], // Drama
    exclude: [28, 53, 27], // EXCLURE moderne/intense
  },
  // Épique et intense
  epic: {
    primary: [28, 12, 14, 878], // Action, Adventure, Fantasy, Sci-Fi
    secondary: [10752, 36], // War, History
    exclude: [35, 10749], // EXCLURE léger
  },
}

// Mots-clés TMDB pour affiner encore plus (IDs réels TMDB)
const MOOD_TO_KEYWORDS = {
  feelgood: [9840, 1701, 4344, 10683], // feel-good, friendship, summer, happiness
  light: [9840, 1701, 4344], // feel-good, friendship, summer
  humor: [9716, 10683, 1701], // comedy, happiness, friendship
  action: [9715, 1701, 4565], // action, adventure, chase
  love: [9673, 1701, 10683], // romance, love, relationship
  dark: [9663, 12554, 10364], // dark, psychological, mystery
  nostalgic: [1701, 4344, 10683], // nostalgia, past, memories
}

// Seuils de popularité ULTRA-STRICTS pour films vraiment connus
const POPULARITY_THRESHOLDS = {
  popular: { min: 1000, max: 100000 }, // FILMS TRÈS CONNUS (Marvel, Fast & Furious, etc.)
  mixed: { min: 50, max: 2000 }, // Mélange
  hidden: { min: 1, max: 200 }, // Pépites cachées
}

// Mapping des plateformes
const PLATFORM_MAPPING = {
  netflix: 8,
  prime: 119,
  disney: 337,
  canal: 381,
  apple: 350,
  paramount: 531,
}

/**
 * Fonction utilitaire pour faire des appels à l'API TMDB
 */
async function tmdbRequest(endpoint, params = {}) {
  try {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.append("api_key", TMDB_API_KEY)
    url.searchParams.append("language", "fr-FR")

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("TMDB Request Error:", error)
    throw error
  }
}

/**
 * Récupère les plateformes de streaming
 */
async function getMovieProviders(movieId, countryCode = "FR") {
  try {
    const data = await tmdbRequest(`/movie/${movieId}/watch/providers`)
    const countryData = data.results[countryCode]

    if (!countryData) return []

    const providers = []

    if (countryData.flatrate) {
      providers.push(...countryData.flatrate)
    }

    if (providers.length === 0 && countryData.rent) {
      providers.push(...countryData.rent.slice(0, 3))
    }

    return providers.map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logo: `${TMDB_IMAGE_BASE_URL}${provider.logo_path}`,
    }))
  } catch (error) {
    console.error("Error fetching providers:", error)
    return []
  }
}

/**
 * Filtrage ULTRA-PRÉCIS selon le mood
 */
function filterByMoodPrecision(movies, mood, popularityLevel = "mixed") {
  const moodConfig = MOOD_TO_GENRES[mood] || MOOD_TO_GENRES.feelgood
  const popularityThreshold = POPULARITY_THRESHOLDS[popularityLevel] || POPULARITY_THRESHOLDS.mixed

  return movies.filter((movie) => {
    // 1. VÉRIFICATION STRICTE DES GENRES
    const movieGenres = movie.genre_ids || []

    // Doit avoir AU MOINS un genre primaire
    const hasPrimaryGenre = moodConfig.primary.some((genreId) => movieGenres.includes(genreId))

    // NE DOIT PAS avoir de genres exclus
    const hasExcludedGenre = moodConfig.exclude.some((genreId) => movieGenres.includes(genreId))

    // 2. VÉRIFICATION POPULARITÉ
    const popularityOk = movie.popularity >= popularityThreshold.min && movie.popularity <= popularityThreshold.max

    // 3. VÉRIFICATION QUALITÉ selon popularité
    let qualityOk = true
    if (popularityLevel === "popular") {
      // Films connus : DOIT avoir beaucoup de votes
      qualityOk = movie.vote_count >= 2000 && movie.vote_average >= 6.5
    } else if (popularityLevel === "mixed") {
      qualityOk = movie.vote_count >= 100 && movie.vote_average >= 6.0
    } else {
      qualityOk = movie.vote_count >= 20 && movie.vote_average >= 5.5
    }

    // 4. VÉRIFICATION ANNÉE selon popularité
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 0
    let yearOk = true

    if (popularityLevel === "popular") {
      // Films connus : privilégier 2015+ pour les jeunes
      yearOk = releaseYear >= 2015 || (mood === "nostalgic" && releaseYear >= 1990)
    } else if (popularityLevel === "mixed") {
      yearOk = releaseYear >= 2000 || (mood === "nostalgic" && releaseYear >= 1980)
    } else {
      yearOk = releaseYear >= 1990
    }

    // 5. FILTRAGE SPÉCIAL ANIMATION
    const isAnimation = movieGenres.includes(16)
    let animationOk = true

    if (isAnimation) {
      // Pour animation, être très strict sauf pour feel-good/light
      if (mood === "feelgood" || mood === "light") {
        // Accepter Pixar, Ghibli, etc. (note élevée + votes élevés)
        animationOk = movie.vote_average >= 7.5 && movie.vote_count >= 1000
      } else if (mood === "action" || mood === "dark" || mood === "epic") {
        // Pour ces moods, animation très rare donc critères très stricts
        animationOk = movie.vote_average >= 8.0 && movie.vote_count >= 2000
      } else {
        animationOk = movie.vote_average >= 7.0 && movie.vote_count >= 500
      }
    }

    // 6. EXCLUSION FILMS FAMILLE
    const isFamilyMovie = movieGenres.includes(10751)

    console.log(
      `Film: ${movie.title} | Genres: ${movieGenres.join(",")} | Primary: ${hasPrimaryGenre} | Excluded: ${hasExcludedGenre} | Pop: ${movie.popularity} | Year: ${releaseYear}`,
    )

    return hasPrimaryGenre && !hasExcludedGenre && !isFamilyMovie && popularityOk && qualityOk && yearOk && animationOk
  })
}

/**
 * Récupère les films avec critères ULTRA-PRÉCIS
 */
// export async function getRecommendedMovies(
//   mood,
//   minRating = 6.0,
//   countryCode = "FR",
//   selectedPlatforms = [],
//   popularityLevel = "mixed",
// ) {
//   try {
//     const moodConfig = MOOD_TO_GENRES[mood] || MOOD_TO_GENRES.feelgood
//     const allMovies = []
//     const popularityThreshold = POPULARITY_THRESHOLDS[popularityLevel] || POPULARITY_THRESHOLDS.mixed

//     console.log(`🎯 RECHERCHE ULTRA-PRÉCISE POUR: ${mood.toUpperCase()}`)
//     console.log(`📊 Genres primaires: ${moodConfig.primary.join(", ")}`)
//     console.log(`🚫 Genres exclus: ${moodConfig.exclude.join(", ")}`)
//     console.log(`⭐ Popularité: ${popularityLevel} (${popularityThreshold.min}-${popularityThreshold.max})`)

//     // Critères STRICTS selon popularité
//     let sortBy = "vote_average.desc"
//     let minVoteCount = 100
//     let dateFrom = "2000-01-01"
//     let minRatingAdjusted = minRating

//     if (popularityLevel === "popular") {
//       sortBy = "popularity.desc"
//       minVoteCount = 2000 // TRÈS STRICT pour films connus
//       dateFrom = "2015-01-01" // Films récents pour jeunes
//       minRatingAdjusted = 6.5 // Note plus élevée
//     } else if (popularityLevel === "hidden") {
//       sortBy = "vote_count.asc"
//       minVoteCount = 20
//       dateFrom = "1990-01-01"
//       minRatingAdjusted = 5.5
//     }

//     // RECHERCHE PRINCIPALE avec genres primaires UNIQUEMENT
//     for (let page = 1; page <= 15; page++) {
//       const searchParams = {
//         with_genres: moodConfig.primary.join(","), // SEULEMENT genres primaires
//         without_genres: [...moodConfig.exclude, 10751].join(","), // EXCLURE genres opposés + Family
//         "vote_average.gte": minRatingAdjusted,
//         "primary_release_date.gte": dateFrom,
//         sort_by: sortBy,
//         page: page,
//         vote_count_gte: minVoteCount,
//       }

//       // Ajouter mots-clés si disponibles
//       if (MOOD_TO_KEYWORDS[mood]) {
//         searchParams.with_keywords = MOOD_TO_KEYWORDS[mood].join("|") // OR entre les mots-clés
//       }

//       try {
//         const data = await tmdbRequest("/discover/movie", searchParams)
//         if (data.results && data.results.length > 0) {
//           console.log(`📄 Page ${page}: ${data.results.length} films bruts`)
//           const filteredResults = filterByMoodPrecision(data.results, mood, popularityLevel)
//           console.log(`✅ Page ${page}: ${filteredResults.length} films après filtrage précis`)
//           allMovies.push(...filteredResults)
//         }
//       } catch (error) {
//         console.error(`Error fetching page ${page}:`, error)
//       }
//     }

//     console.log(`🎬 Total films après recherche principale: ${allMovies.length}`)

//     // Si pas assez, recherche avec genres secondaires
//     if (allMovies.length < 20 && moodConfig.secondary.length > 0) {
//       console.log("🔄 Recherche avec genres secondaires...")

//       for (let page = 1; page <= 10; page++) {
//         const searchParams = {
//           with_genres: [...moodConfig.primary, ...moodConfig.secondary].join(","),
//           without_genres: [...moodConfig.exclude, 10751].join(","),
//           "vote_average.gte": minRatingAdjusted - 0.5,
//           "primary_release_date.gte": dateFrom,
//           sort_by: sortBy,
//           page: page,
//           vote_count_gte: Math.max(minVoteCount / 2, 50),
//         }

//         try {
//           const data = await tmdbRequest("/discover/movie", searchParams)
//           if (data.results && data.results.length > 0) {
//             const filteredResults = filterByMoodPrecision(data.results, mood, popularityLevel)
//             allMovies.push(...filteredResults)
//           }
//         } catch (error) {
//           console.error(`Error fetching secondary page ${page}:`, error)
//         }
//       }
//     }

//     console.log(`🎬 Total films après recherche secondaire: ${allMovies.length}`)

//     // Si ENCORE pas assez, recherche d'urgence
//     if (allMovies.length < 10) {
//       console.log("🚨 Recherche d'urgence...")
//       return await getEmergencyMovies(mood, popularityLevel)
//     }

//     // Traiter les films
//     const moviesWithProviders = await Promise.all(
//       allMovies.slice(0, 150).map(async (movie) => {
//         const providers = await getMovieProviders(movie.id, countryCode)

//         return {
//           id: movie.id,
//           title: movie.title,
//           originalTitle: movie.original_title,
//           poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
//           backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}` : null,
//           rating: movie.vote_average,
//           voteCount: movie.vote_count,
//           description: movie.overview,
//           releaseDate: movie.release_date,
//           genres: movie.genre_ids,
//           platforms: providers,
//           popularity: movie.popularity,
//         }
//       }),
//     )

//     // Filtrer par plateformes
//     if (selectedPlatforms && selectedPlatforms.length > 0) {
//       const platformIds = selectedPlatforms.map((platform) => PLATFORM_MAPPING[platform]).filter(Boolean)
//       const filtered = moviesWithProviders.filter((movie) =>
//         movie.platforms.some((provider) => platformIds.includes(provider.id)),
//       )

//       console.log(`🎯 Films après filtrage plateformes: ${filtered.length}`)
//       return filtered.length > 3 ? filtered : moviesWithProviders
//     }

//     return moviesWithProviders
//   } catch (error) {
//     console.error("Error getting recommended movies:", error)
//     return await getEmergencyMovies(mood, popularityLevel)
//   }
// }

/**
 * Fonction d'urgence spécialisée par mood
 */
async function getEmergencyMovies(mood, popularityLevel) {
  try {
    console.log(`🚨 FILMS D'URGENCE POUR: ${mood}`)

    // Endpoints spécialisés selon le mood
    let endpoint = "/movie/popular"
    if (mood === "action") endpoint = "/movie/top_rated"
    if (mood === "horror") endpoint = "/movie/popular"

    const data = await tmdbRequest(endpoint, { page: 1 })

    // Filtrer même les films d'urgence selon le mood
    const moodConfig = MOOD_TO_GENRES[mood] || MOOD_TO_GENRES.feelgood
    const filtered = data.results.filter((movie) => {
      const hasGoodGenre = moodConfig.primary.some((genreId) => movie.genre_ids.includes(genreId))
      const hasNoExcluded = !moodConfig.exclude.some((genreId) => movie.genre_ids.includes(genreId))
      return hasGoodGenre && hasNoExcluded
    })

    return filtered.slice(0, 10).map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      rating: movie.vote_average,
      description: movie.overview,
      platforms: [],
      type: "movie",
      releaseDate: movie.release_date,
      popularity: movie.popularity,
      genres: movie.genre_ids,
      voteCount: movie.vote_count,
    }))
  } catch (error) {
    console.error("Erreur films d'urgence:", error)
    return []
  }
}

/**
 * Récupère les séries avec la même précision
 */
// export async function getRecommendedSeries(
//   mood,
//   minRating = 6.0,
//   countryCode = "FR",
//   selectedPlatforms = [],
//   popularityLevel = "mixed",
// ) {
//   try {
//     const moodConfig = MOOD_TO_GENRES[mood] || MOOD_TO_GENRES.feelgood
//     const allSeries = []
//     const popularityThreshold = POPULARITY_THRESHOLDS[popularityLevel] || POPULARITY_THRESHOLDS.mixed

//     console.log(`📺 RECHERCHE SÉRIES ULTRA-PRÉCISE POUR: ${mood.toUpperCase()}`)

//     // Critères similaires aux films
//     let sortBy = "vote_average.desc"
//     let minVoteCount = 50
//     let dateFrom = "2000-01-01"
//     let minRatingAdjusted = minRating

//     if (popularityLevel === "popular") {
//       sortBy = "popularity.desc"
//       minVoteCount = 1000
//       dateFrom = "2015-01-01"
//       minRatingAdjusted = 6.5
//     } else if (popularityLevel === "hidden") {
//       sortBy = "vote_count.asc"
//       minVoteCount = 10
//       dateFrom = "1990-01-01"
//       minRatingAdjusted = 5.5
//     }

//     // Recherche principale séries
//     for (let page = 1; page <= 15; page++) {
//       const searchParams = {
//         with_genres: moodConfig.primary.join(","),
//         without_genres: [...moodConfig.exclude, 10751].join(","),
//         "vote_average.gte": minRatingAdjusted,
//         "first_air_date.gte": dateFrom,
//         sort_by: sortBy,
//         page: page,
//         vote_count_gte: minVoteCount,
//       }

//       try {
//         const data = await tmdbRequest("/discover/tv", searchParams)
//         if (data.results && data.results.length > 0) {
//           const filteredResults = filterByMoodPrecision(data.results, mood, popularityLevel)
//           allSeries.push(...filteredResults)
//         }
//       } catch (error) {
//         console.error(`Error fetching TV page ${page}:`, error)
//       }
//     }

//     console.log(`📺 Total séries: ${allSeries.length}`)

//     if (allSeries.length === 0) {
//       return await getEmergencySeries(mood, popularityLevel)
//     }

//     const seriesWithProviders = await Promise.all(
//       allSeries.slice(0, 150).map(async (series) => {
//         const providers = await getSeriesProviders(series.id, countryCode)

//         return {
//           id: series.id,
//           title: series.name,
//           originalTitle: series.original_name,
//           poster: series.poster_path ? `${TMDB_IMAGE_BASE_URL}${series.poster_path}` : null,
//           backdrop: series.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${series.backdrop_path}` : null,
//           rating: series.vote_average,
//           voteCount: series.vote_count,
//           description: series.overview,
//           releaseDate: series.first_air_date,
//           genres: series.genre_ids,
//           platforms: providers,
//           popularity: series.popularity,
//           type: "series",
//         }
//       }),
//     )

//     if (selectedPlatforms && selectedPlatforms.length > 0) {
//       const platformIds = selectedPlatforms.map((platform) => PLATFORM_MAPPING[platform]).filter(Boolean)
//       const filtered = seriesWithProviders.filter((series) =>
//         series.platforms.some((provider) => platformIds.includes(provider.id)),
//       )

//       return filtered.length > 3 ? filtered : seriesWithProviders
//     }

//     return seriesWithProviders
//   } catch (error) {
//     console.error("Error getting recommended series:", error)
//     return await getEmergencySeries(mood, popularityLevel)
//   }
// }

/**
 * Séries d'urgence
 */
async function getEmergencySeries(mood, popularityLevel) {
  try {
    const data = await tmdbRequest("/tv/popular", { page: 1 })
    const moodConfig = MOOD_TO_GENRES[mood] || MOOD_TO_GENRES.feelgood

    const filtered = data.results.filter((series) => {
      const hasGoodGenre = moodConfig.primary.some((genreId) => series.genre_ids.includes(genreId))
      const hasNoExcluded = !moodConfig.exclude.some((genreId) => series.genre_ids.includes(genreId))
      return hasGoodGenre && hasNoExcluded
    })

    return filtered.slice(0, 10).map((series) => ({
      id: series.id,
      title: series.name,
      poster: series.poster_path ? `${TMDB_IMAGE_BASE_URL}${series.poster_path}` : null,
      rating: series.vote_average,
      description: series.overview,
      platforms: [],
      type: "series",
      releaseDate: series.first_air_date,
      popularity: series.popularity,
      genres: series.genre_ids,
      voteCount: series.vote_count,
    }))
  } catch (error) {
    console.error("Erreur séries d'urgence:", error)
    return []
  }
}

/**
 * Récupère les plateformes pour une série
 */
async function getSeriesProviders(seriesId, countryCode = "FR") {
  try {
    const data = await tmdbRequest(`/tv/${seriesId}/watch/providers`)
    const countryData = data.results[countryCode]

    if (!countryData) return []

    const providers = []

    if (countryData.flatrate) {
      providers.push(...countryData.flatrate)
    }

    if (providers.length === 0 && countryData.rent) {
      providers.push(...countryData.rent.slice(0, 3))
    }

    return providers.map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logo: `${TMDB_IMAGE_BASE_URL}${provider.logo_path}`,
    }))
  } catch (error) {
    console.error("Error fetching series providers:", error)
    return []
  }
}

/**
 * Fonction principale avec quantité CORRIGÉE
 */
// export async function getRecommendations(preferences) {
//   const {
//     mood = "feelgood",
//     contentType = "both",
//     minRating = 6.0,
//     countryCode = "FR",
//     selectedPlatforms = [],
//     quantity = "varied",
//     popularity = "mixed",
//   } = preferences

//   try {
//     const results = []

//     console.log(`🎯 RECHERCHE ULTRA-PRÉCISE:`)
//     console.log(`🎭 Mood: ${mood}`)
//     console.log(`🎬 Type: ${contentType}`)
//     console.log(`📊 Quantité: ${quantity}`)
//     console.log(`⭐ Popularité: ${popularity}`)

//     if (contentType === "movie" || contentType === "both") {
//       const movies = await getRecommendedMovies(mood, minRating, countryCode, selectedPlatforms, popularity)
//       console.log(`🎬 Films trouvés: ${movies.length}`)
//       results.push(...movies.map((movie) => ({ ...movie, type: "movie" })))
//     }

//     if (contentType === "series" || contentType === "both") {
//       const series = await getRecommendedSeries(mood, minRating, countryCode, selectedPlatforms, popularity)
//       console.log(`📺 Séries trouvées: ${series.length}`)
//       results.push(...series.map((s) => ({ ...s, type: "series" })))
//     }

//     // Tri selon popularité
//     let shuffled
//     if (popularity === "popular") {
//       shuffled = results.sort((a, b) => b.popularity - a.popularity)
//     } else if (popularity === "hidden") {
//       shuffled = results.sort((a, b) => a.popularity - b.popularity)
//     } else {
//       shuffled = results.sort(() => Math.random() - 0.5)
//     }

//     console.log(`📊 Total résultats: ${shuffled.length}`)

//     if (shuffled.length === 0) {
//       return await getEmergencyRecommendations()
//     }

//     // QUANTITÉ CORRIGÉE
//     let maxResults
//     switch (quantity) {
//       case "one":
//         maxResults = 1
//         break
//       case "few":
//         maxResults = 4 // 3-5 films
//         break
//       case "varied":
//         maxResults = 8 // 5-10 films
//         break
//       case "max":
//         maxResults = 25 // Maximum
//         break
//       default:
//         maxResults = 8
//     }

//     const finalResults = shuffled.slice(0, maxResults)
//     console.log(`✅ RÉSULTATS FINAUX: ${finalResults.length} (demandé: ${quantity})`)

//     return finalResults
//   } catch (error) {
//     console.error("Error getting recommendations:", error)
//     return await getEmergencyRecommendations()
//   }
// }

/**
 * Recommandations d'urgence globales
 */
async function getEmergencyRecommendations() {
  try {
    console.log("🚨 RECOMMANDATIONS D'URGENCE GLOBALES")
    const [moviesData, seriesData] = await Promise.all([
      tmdbRequest("/movie/popular", { page: 1 }),
      tmdbRequest("/tv/popular", { page: 1 }),
    ])

    const movies = moviesData.results.slice(0, 8).map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      rating: movie.vote_average,
      description: movie.overview,
      platforms: [],
      type: "movie",
      releaseDate: movie.release_date,
      popularity: movie.popularity,
      genres: movie.genre_ids,
      voteCount: movie.vote_count,
    }))

    const series = seriesData.results.slice(0, 7).map((s) => ({
      id: s.id,
      title: s.name,
      poster: s.poster_path ? `${TMDB_IMAGE_BASE_URL}${s.poster_path}` : null,
      rating: s.vote_average,
      description: s.overview,
      platforms: [],
      type: "series",
      releaseDate: s.first_air_date,
      popularity: s.popularity,
      genres: s.genre_ids,
      voteCount: s.vote_count,
    }))

    return [...movies, ...series]
  } catch (error) {
    console.error("Erreur recommandations d'urgence:", error)
    return []
  }
}

/**
 * Recherche par titre
 */
export async function searchContent(query, type = "multi") {
  try {
    const endpoint = type === "movie" ? "/search/movie" : type === "tv" ? "/search/tv" : "/search/multi"
    const data = await tmdbRequest(endpoint, { query })

    return data.results.map((item) => ({
      id: item.id,
      title: item.title || item.name,
      poster: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : null,
      rating: item.vote_average,
      description: item.overview,
      type: item.media_type || type,
      releaseDate: item.release_date || item.first_air_date,
    }))
  } catch (error) {
    console.error("Error searching content:", error)
    return []
  }
}

/**
 * Détails d'un film
 */
export async function getMovieDetails(movieId) {
  try {
    const movie = await tmdbRequest(`/movie/${movieId}`)
    const providers = await getMovieProviders(movieId)

    return {
      ...movie,
      poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}` : null,
      platforms: providers,
    }
  } catch (error) {
    console.error("Error getting movie details:", error)
    return null
  }
}

// Remplacer la fonction getRecommendations par cette version ultra-précise :

export async function getRecommendations(preferences) {
  const {
    mood = "feelgood",
    contentType = "both",
    minRating = 6.0,
    countryCode = "FR",
    selectedPlatforms = [],
    quantity = "varied",
    popularity = "mixed",
    // NOUVELLES RÉPONSES DU QUIZ
    answers = {} // Toutes les réponses du quiz
  } = preferences

  try {
    console.log("🎯 SYSTÈME ULTRA-PRÉCIS ACTIVÉ")

    // CONVERTIR RÉPONSES QUIZ → FILTRES TMDB
    const tmdbFilters = convertQuizToTMDBFilters(answers)

    // DEBUG COMPLET
    debugFilters(answers)

    const results = []

    // RECHERCHE FILMS
    if (contentType === "movie" || contentType === "both") {
      console.log("🎬 RECHERCHE FILMS AVEC FILTRES TMDB...")

      const movies = await searchWithTMDBFilters("movie", tmdbFilters, selectedPlatforms, countryCode)
      console.log(`🎬 Films trouvés: ${movies.length}`)
      results.push(...movies.map(movie => ({ ...movie, type: "movie" })))
    }

    // RECHERCHE SÉRIES
    if (contentType === "series" || contentType === "both") {
      console.log("📺 RECHERCHE SÉRIES AVEC FILTRES TMDB...")

      const series = await searchWithTMDBFilters("tv", tmdbFilters, selectedPlatforms, countryCode)
      console.log(`📺 Séries trouvées: ${series.length}`)
      results.push(...series.map(s => ({ ...s, type: "series" })))
    }

    // TRI SELON POPULARITÉ
    let shuffled
    if (answers.popularity === "blockbuster" || answers.popularity === "popular") {
      shuffled = results.sort((a, b) => b.popularity - a.popularity)
    } else if (answers.popularity === "hidden") {
      shuffled = results.sort((a, b) => a.popularity - b.popularity)
    } else {
      shuffled = results.sort(() => Math.random() - 0.5)
    }

    console.log(`📊 Total résultats: ${shuffled.length}`)

    if (shuffled.length === 0) {
      console.log("🚨 Aucun résultat - Recherche d'urgence")
      return await getEmergencyRecommendations()
    }

    // QUANTITÉ EXACTE
    let maxResults
    switch (quantity) {
      case "one": maxResults = 1; break
      case "few": maxResults = 5; break
      case "varied": maxResults = 8; break
      case "max": maxResults = 25; break
      default: maxResults = 8
    }

    console.log(`🎯 QUANTITÉ DEMANDÉE: ${quantity} = ${maxResults} résultats MAX`)

    const finalResults = shuffled.slice(0, maxResults)
    
    // VÉRIFICATION FINALE DES NOTES
    console.log("🔍 VÉRIFICATION NOTES FINALES:")
    finalResults.forEach(item => {
      console.log(`- ${item.title}: ${item.rating}/10 (${item.type})`)
    })
    
    console.log(`✅ RÉSULTATS FINAUX: ${finalResults.length}/${maxResults} (demandé: ${quantity})`)

    return finalResults

  } catch (error) {
    console.error("Error getting recommendations:", error)
    return await getEmergencyRecommendations()
  }
}

// NOUVELLE FONCTION : Recherche avec filtres TMDB purs
async function searchWithTMDBFilters(mediaType, filters, selectedPlatforms, countryCode) {
  const allResults = []

  try {
    // Recherche sur plusieurs pages
    for (let page = 1; page <= 10; page++) {
      const searchParams = {
        ...filters,
        page: page
      }

      const endpoint = mediaType === "movie" ? "/discover/movie" : "/discover/tv"
      const data = await tmdbRequest(endpoint, searchParams)

      if (data.results && data.results.length > 0) {
        console.log(`📄 Page ${page}: ${data.results.length} ${mediaType}s bruts`)
        allResults.push(...data.results)
      }

      // Si on a assez de résultats, arrêter
      if (allResults.length >= 100) break
    }

    console.log(`📊 Total ${mediaType}s récupérés: ${allResults.length}`)

    // Traiter les résultats
    const processedResults = await Promise.all(
      allResults.slice(0, 100).map(async (item) => {
        const providers = mediaType === "movie"
          ? await getMovieProviders(item.id, countryCode)
          : await getSeriesProviders(item.id, countryCode)

        return {
          id: item.id,
          title: item.title || item.name,
          originalTitle: item.original_title || item.original_name,
          poster: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : null,
          backdrop: item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}` : null,
          rating: item.vote_average,
          voteCount: item.vote_count,
          description: item.overview,
          releaseDate: item.release_date || item.first_air_date,
          genres: item.genre_ids,
          platforms: providers,
          popularity: item.popularity,
        }
      })
    )

    // FILTRAGE POST-TMDB STRICT (au cas où TMDB ne respecte pas)
    const minRating = filters["vote_average.gte"] || 0
    const strictFiltered = processedResults.filter(item => {
      const ratingOk = item.rating >= minRating
      if (!ratingOk) {
        console.log(`❌ FILM REJETÉ: ${item.title} (${item.rating}/10 < ${minRating})`)
      }
      return ratingOk
    })

    console.log(`🎯 Filtrage strict notes: ${processedResults.length} → ${strictFiltered.length}`)

    // Filtrer par plateformes si nécessaire
    if (selectedPlatforms && selectedPlatforms.length > 0) {
      const platformIds = selectedPlatforms.map(platform => PLATFORM_MAPPING[platform]).filter(Boolean)
      const filtered = strictFiltered.filter(item =>
        item.platforms.some(provider => platformIds.includes(provider.id))
      )

      console.log(`🎯 ${mediaType}s après filtrage plateformes: ${filtered.length}`)
      return filtered.length > 3 ? filtered : strictFiltered
    }

    return strictFiltered

  } catch (error) {
    console.error(`Error searching ${mediaType} with TMDB filters:`, error)
    return []
  }
}
