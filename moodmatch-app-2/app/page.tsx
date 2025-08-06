"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Star, Heart, RotateCcw, Loader2, BookOpen } from 'lucide-react'
import { getRecommendations } from "../api/tmdb"
import { FavoriteButton } from "@/components/FavoriteButton"
import { MoodBookScreen } from "@/components/MoodBookScreen"

type Screen = "welcome" | "question" | "result" | "moodbook"
type QuestionId =
  | "company"
  | "type"
  | "genre"
  | "mood"
  | "characters"
  | "suspense"
  | "popularity"
  | "platforms"
  | "quantity"
  | "certification"
  | "decade"
  | "rating"

interface Question {
  id: QuestionId
  question: string
  options: { id: string; text: string; emoji?: string }[]
  genieReaction: (answer: string) => string
}

interface UserAnswers {
  [key: string]: string
}

interface Movie {
  id: number
  title: string
  poster: string | null
  rating: number
  description: string
  platforms: Array<{
    id: number
    name: string
    logo: string
  }>
  type: "movie" | "series"
  releaseDate: string
}

const platforms = [
  { id: "netflix", name: "Netflix", logo: "🎬", color: "bg-red-500" },
  { id: "prime", name: "Prime Video", logo: "📺", color: "bg-blue-600" },
  { id: "disney", name: "Disney+", logo: "🏰", color: "bg-blue-500" },
  { id: "canal", name: "Canal+", logo: "📡", color: "bg-black" },
  { id: "apple", name: "Apple TV+", logo: "🍎", color: "bg-gray-800" },
  { id: "paramount", name: "Paramount+", logo: "⭐", color: "bg-blue-700" },
]

const questions: Question[] = [
  {
    id: "company",
    question: "Avec qui tu regardes ce soir ?",
    options: [
      { id: "alone", text: "Seul(e)", emoji: "🧘‍♀️" },
      { id: "couple", text: "En couple", emoji: "💑" },
      { id: "family", text: "En famille", emoji: "👨‍👩‍👧‍👦" },
      { id: "friends", text: "Entre potes", emoji: "👥" },
    ],
    genieReaction: (answer) => {
      const reactions = {
        alone: "Parfait ! Je vais cibler des films plus intimes et personnels 🎭",
        couple: "En couple ? Je sens venir romance et émotions ! 💘",
        family: "En famille ! J'évite tout ce qui est trop mature 👨‍👩‍👧‍👦",
        friends: "Entre potes ? Films fun et divertissants en vue ! 🎉",
      }
      return reactions[answer as keyof typeof reactions] || "Parfait ! 😊"
    },
  },
  {
    id: "type",
    question: "Tu préfères une série ou un film ?",
    options: [
      { id: "movie", text: "Film", emoji: "🎬" },
      { id: "series", text: "Série", emoji: "📺" },
      { id: "both", text: "Peu importe", emoji: "🤷‍♀️" },
    ],
    genieReaction: (answer) => {
      const reactions = {
        movie: "Films ! Parfait pour une soirée complète 🎬",
        series: "Séries ! Tu vas pouvoir binge-watcher 📺",
        both: "Les deux ! Plus de choix pour moi 😏",
      }
      return reactions[answer as keyof typeof reactions] || "Noté ! 📝"
    },
  },
  // QUESTION GENRE = MAPPING DIRECT TMDB
  {
    id: "genre",
    question: "Quel genre te fait vibrer maintenant ?",
    options: [
      { id: "comedy", text: "Comédie", emoji: "😂" }, // Genre 35
      { id: "action", text: "Action", emoji: "💥" }, // Genre 28
      { id: "romance", text: "Romance", emoji: "💕" }, // Genre 10749
      { id: "thriller", text: "Thriller", emoji: "😱" }, // Genre 53
      { id: "horror", text: "Horreur", emoji: "👻" }, // Genre 27
      { id: "drama", text: "Drame", emoji: "🎭" }, // Genre 18
      { id: "scifi", text: "Science-Fiction", emoji: "🚀" }, // Genre 878
      { id: "fantasy", text: "Fantasy", emoji: "🧙‍♂️" }, // Genre 14
    ],
    genieReaction: (answer) => {
      const reactions = {
        comedy: "Comédie ! Prépare-toi à rigoler 😂",
        action: "Action ! Sensations fortes garanties 💥",
        romance: "Romance ! L'amour est dans l'air 💕",
        thriller: "Thriller ? Tu vas avoir des frissons ! 😱",
        horror: "Horreur ? Tu es courageux ! 👻",
        drama: "Drame ! Des émotions profondes en vue 🎭",
        scifi: "Sci-Fi ! Direction le futur 🚀",
        fantasy: "Fantasy ! Magie et aventures 🧙‍♂️",
      }
      return reactions[answer as keyof typeof reactions] || "Excellent choix ! 🎯"
    },
  },
  // QUESTION MOOD = SOUS-GENRES ET AMBIANCE
  {
    id: "mood",
    question: "Tu veux quelle ambiance exactement ?",
    options: [
      { id: "feelgood", text: "Feel-good & positif", emoji: "☀️" }, // Comedy + Romance + Music
      { id: "intense", text: "Intense & épique", emoji: "⚡" }, // Action + Adventure + War
      { id: "dark", text: "Sombre & mystérieux", emoji: "🌙" }, // Thriller + Crime + Mystery
      { id: "emotional", text: "Émouvant & profond", emoji: "💭" }, // Drama + Biography
      { id: "fun", text: "Fun & divertissant", emoji: "🎪" }, // Comedy + Animation + Family
      { id: "scary", text: "Effrayant & stressant", emoji: "😰" }, // Horror + Thriller
    ],
    genieReaction: (answer) => {
      const reactions = {
        feelgood: "Feel-good ! Du bonheur et de la bonne humeur ☀️",
        intense: "Intense ! Accroche-toi bien ⚡",
        dark: "Sombre ! J'adore cette ambiance mystérieuse 🌙",
        emotional: "Émouvant ! Prépare les mouchoirs 💭",
        fun: "Fun ! Divertissement garanti 🎪",
        scary: "Effrayant ! Tu vas avoir peur 😰",
      }
      return reactions[answer as keyof typeof reactions] || "Cette ambiance me plaît ! 🎨"
    },
  },
  // QUESTION CERTIFICATION = FILTRE TMDB EXACT
  {
    id: "certification",
    question: "Quel niveau de contenu tu acceptes ?",
    options: [
      { id: "family", text: "Tout public (G/U)", emoji: "👨‍👩‍👧‍👦" }, // certification=G,U
      { id: "teen", text: "Ados et + (PG-13)", emoji: "👦" }, // certification=PG-13,12
      { id: "mature", text: "Adulte (R/18+)", emoji: "🔞" }, // certification=R,18,NC-17
      { id: "any", text: "Peu importe", emoji: "🤷‍♂️" },
    ],
    genieReaction: (answer) => {
      const reactions = {
        family: "Tout public ! Parfait pour toute la famille 👨‍👩‍👧‍👦",
        teen: "Ados et + ! Contenu adapté aux jeunes 👦",
        mature: "Adulte ! Contenu sans restriction 🔞",
        any: "Peu importe ! J'ai plus de liberté 🤷‍♂️",
      }
      return reactions[answer as keyof typeof reactions] || "Parfait pour cibler ! 🎯"
    },
  },
  // QUESTION DÉCENNIE = FILTRE TMDB EXACT
  {
    id: "decade",
    question: "Tu préfères quelle époque ?",
    options: [
      { id: "2020s", text: "2020s (Très récent)", emoji: "🆕" }, // primary_release_date.gte=2020-01-01
      { id: "2010s", text: "2010s (Récent)", emoji: "📱" }, // 2010-2019
      { id: "2000s", text: "2000s (Moderne)", emoji: "💿" }, // 2000-2009
      { id: "90s", text: "90s (Nostalgique)", emoji: "📼" }, // 1990-1999
      { id: "classic", text: "Classiques (80s et avant)", emoji: "🎞️" }, // <1990
      { id: "any", text: "Toutes époques", emoji: "⏰" },
    ],
    genieReaction: (answer) => {
      const reactions = {
        "2020s": "2020s ! Les dernières sorties 🆕",
        "2010s": "2010s ! L'âge d'or moderne 📱",
        "2000s": "2000s ! Nostalgie millénaire 💿",
        "90s": "90s ! Les grands classiques 📼",
        classic: "Classiques ! Les légendes du cinéma 🎞️",
        any: "Toutes époques ! Voyage dans le temps ⏰",
      }
      return reactions[answer as keyof typeof reactions] || "Parfait ! ⏰"
    },
  },
  // QUESTION POPULARITÉ = FILTRE TMDB EXACT
  {
    id: "popularity",
    question: "Tu veux découvrir :",
    options: [
      { id: "blockbuster", text: "Blockbusters & hits", emoji: "🌟" }, // popularity.gte=1000
      { id: "popular", text: "Films/séries connus", emoji: "👑" }, // popularity 500-1000
      { id: "mixed", text: "Mélange équilibré", emoji: "🎭" }, // popularity 50-500
      { id: "indie", text: "Films indépendants", emoji: "🎨" }, // popularity 10-100
      { id: "hidden", text: "Pépites cachées", emoji: "💎" }, // popularity <50
    ],
    genieReaction: (answer) => {
      const reactions = {
        blockbuster: "Blockbusters ! Les plus gros succès 🌟",
        popular: "Films connus ! Tu vas retrouver tes repères 👑",
        mixed: "Mélange équilibré ! Du connu et de l'inédit 🎭",
        indie: "Films indé ! Créativité et originalité 🎨",
        hidden: "Pépites cachées ! Tu vas faire de belles découvertes 💎",
      }
      return reactions[answer as keyof typeof reactions] || "Parfait pour cibler ! 🎯"
    },
  },
  // QUESTION NOTE = FILTRE TMDB EXACT
  {
    id: "rating",
    question: "Niveau de qualité minimum ?",
    options: [
      { id: "masterpiece", text: "Chefs-d'œuvre (8.5+)", emoji: "🏆" }, // vote_average.gte=8.5
      { id: "excellent", text: "Excellents (7.5+)", emoji: "⭐" }, // vote_average.gte=7.5
      { id: "good", text: "Bons films (6.5+)", emoji: "👍" }, // vote_average.gte=6.5
      { id: "decent", text: "Corrects (5.5+)", emoji: "👌" }, // vote_average.gte=5.5
      { id: "any", text: "Peu importe", emoji: "🤷‍♀️" }, // vote_average.gte=0
    ],
    genieReaction: (answer) => {
      const reactions = {
        masterpiece: "Chefs-d'œuvre ! Que du très haut niveau 🏆",
        excellent: "Excellents ! Qualité garantie ⭐",
        good: "Bons films ! Valeur sûre 👍",
        decent: "Corrects ! Plus de choix 👌",
        any: "Peu importe ! Maximum de diversité 🤷‍♀️",
      }
      return reactions[answer as keyof typeof reactions] || "Parfait ! 🎯"
    },
  },
  {
    id: "platforms",
    question: "Sur quelles plateformes tu es abonné(e) ?",
    options: platforms.map((p) => ({ id: p.id, text: p.name, emoji: p.logo })),
    genieReaction: () => "Parfait ! Je ne te proposerai que ce qui est disponible 📺✨",
  },
  {
    id: "quantity",
    question: "Combien de recommandations tu veux ?",
    options: [
      { id: "one", text: "1 seule pépite", emoji: "💎" },
      { id: "few", text: "Exactement 5 choix", emoji: "🎯" }, // CORRECTION
      { id: "varied", text: "8 options variées", emoji: "🎪" }, // CORRECTION
      { id: "max", text: "Maximum (25)", emoji: "🌟" }, // CORRECTION
    ],
    genieReaction: (answer) => {
      const reactions = {
        one: "Une seule pépite ! Je vais te trouver LA perle rare 💎",
        few: "Exactement 5 choix ! Sélection premium 🎯", // CORRECTION
        varied: "8 options variées ! Bon équilibre 🎪", // CORRECTION
        max: "Maximum 25 ! Je vais vider mes archives 🌟", // CORRECTION
      }
      return reactions[answer as keyof typeof reactions] || "C'est parti ! 🚀"
    },
  },
]

export default function GenieDuCine() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<UserAnswers>({})
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [genieMessage, setGenieMessage] = useState("")
  const [showReaction, setShowReaction] = useState(false)
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [likedMovies, setLikedMovies] = useState<Set<number>>(new Set())

  const currentQuestion = questions[currentQuestionIndex]

  const GenieCharacter = ({ message, expression = "🧞‍♂️" }: { message: string; expression?: string }) => (
    <div className="flex flex-col items-center mb-8">
      <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
        <span className="text-4xl">{expression}</span>
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-lg max-w-sm border-2 border-purple-200">
        <p className="text-gray-800 text-center leading-relaxed">{message}</p>
      </div>
    </div>
  )

  const fetchRecommendations = async (refresh = false) => {
    setIsLoading(true)
    try {
      const preferences = {
        mood: answers.genre || answers.mood || "feelgood",
        contentType: answers.type || "both",
        minRating: 6.0,
        countryCode: "FR",
        selectedPlatforms: selectedPlatforms,
        quantity: answers.quantity || "varied",
        popularity: answers.popularity || "mixed",
        // PASSER TOUTES LES RÉPONSES DU QUIZ
        answers: {
          ...answers,
          platforms: selectedPlatforms.join(",")
        }
      }

      console.log("🎯 VÉRIFICATION RÉPONSES QUIZ:")
      console.log("- Rating demandé:", answers.rating)
      console.log("- Quantity demandée:", answers.quantity)
      console.log("- Genre demandé:", answers.genre)
      console.log("- Mood demandé:", answers.mood)

      console.log("🎯 Préférences avec réponses complètes:", preferences)

      const results = await getRecommendations(preferences)

      if (refresh && results.length > 0) {
        // Pour les nouvelles recommandations, mélanger
        const shuffled = results.sort(() => Math.random() - 0.5)
        setRecommendations(shuffled)
      } else {
        setRecommendations(results)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setRecommendations([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (questionId: QuestionId, answerId: string) => {
    if (questionId === "platforms") {
      setSelectedPlatforms((prev) =>
        prev.includes(answerId) ? prev.filter((p) => p !== answerId) : [...prev, answerId],
      )
      return
    }

    setAnswers((prev) => ({ ...prev, [questionId]: answerId }))
    const reaction = currentQuestion.genieReaction(answerId)
    setGenieMessage(reaction)
    setShowReaction(true)

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setShowReaction(false)
      } else {
        setGenieMessage("Ok j'affûte ma boule de cristal...✨")
        setTimeout(() => {
          setGenieMessage("Je fouille dans mes archives magiques... 🔮")
          fetchRecommendations()
          setTimeout(() => {
            setCurrentScreen("result")
          }, 2000)
        }, 1500)
      }
    }, 2000)
  }

  const handlePlatformsContinue = () => {
    if (selectedPlatforms.length === 0) return

    setAnswers((prev) => ({ ...prev, platforms: selectedPlatforms.join(",") }))
    const reaction = currentQuestion.genieReaction("")
    setGenieMessage(reaction)
    setShowReaction(true)

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setShowReaction(false)
      } else {
        setGenieMessage("Je fouille dans mes archives… presque trouvé ! 🧞‍♂️")
        fetchRecommendations()
        setTimeout(() => {
          setCurrentScreen("result")
        }, 2000)
      }
    }, 2000)
  }

  const toggleLike = (movieId: number) => {
    setLikedMovies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(movieId)) {
        newSet.delete(movieId)
      } else {
        newSet.add(movieId)
      }
      return newSet
    })
  }

  // Convertir Movie en MovieToSave pour FavoriteButton
  const movieToSave = (movie: Movie) => ({
    id: movie.id,
    title: movie.title,
    poster: movie.poster,
    rating: movie.rating,
    description: movie.description,
    type: movie.type
  })

  const renderWelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-6 flex flex-col justify-center">
      {/* Bouton MoodBook en haut à droite */}
      <div className="absolute top-6 right-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("moodbook")}
          className="text-white hover:bg-white/20 rounded-full"
          title="Mon MoodBook"
        >
          <BookOpen className="w-6 h-6" />
        </Button>
      </div>

      <GenieCharacter message="Salut 👋 Prêt à découvrir le film parfait en 2 minutes ?" expression="🧞‍♂️" />
      <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-lg max-w-sm mx-auto mb-8 border-2 border-purple-200">
        <p className="text-gray-800 text-center leading-relaxed">
          Je vais te poser quelques questions rapides, ça va être fun !
        </p>
      </div>
      <Button
        onClick={() => setCurrentScreen("question")}
        className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl font-bold rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
      >
        Je suis prêt ! 🚀
      </Button>
    </div>
  )

  const renderQuestionScreen = () => {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    if (showReaction) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-6 flex flex-col justify-center">
          <GenieCharacter message={genieMessage} expression="😊" />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-6">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              currentQuestionIndex > 0 ? setCurrentQuestionIndex((prev) => prev - 1) : setCurrentScreen("welcome")
            }
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 mx-4">
            <div className="bg-white/30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-white text-sm font-medium">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>

        <GenieCharacter message={currentQuestion.question} />

        {currentQuestion.id === "platforms" ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {platforms.map((platform) => (
                <Card
                  key={platform.id}
                  className={`cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                    selectedPlatforms.includes(platform.id)
                      ? "ring-2 ring-yellow-400 bg-white shadow-lg"
                      : "bg-white/90 hover:bg-white shadow-md"
                  }`}
                  onClick={() =>
                    setSelectedPlatforms((prev) =>
                      prev.includes(platform.id) ? prev.filter((p) => p !== platform.id) : [...prev, platform.id],
                    )
                  }
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{platform.logo}</div>
                    <h3 className="text-gray-800 font-medium text-sm">{platform.name}</h3>
                    {selectedPlatforms.includes(platform.id) && <div className="text-yellow-500 text-xl mt-2">✓</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button
              onClick={handlePlatformsContinue}
              disabled={selectedPlatforms.length === 0}
              className="w-full h-14 bg-white hover:bg-gray-100 text-purple-600 text-lg font-semibold rounded-2xl shadow-lg disabled:opacity-50"
            >
              Continuer ({selectedPlatforms.length} sélectionnée{selectedPlatforms.length > 1 ? "s" : ""})
            </Button>
          </>
        ) : (
          <div className={`${currentQuestion.options.length > 4 ? "grid grid-cols-2 gap-4" : "space-y-4"}`}>
            {currentQuestion.options.map((option) => (
              <Button
                key={option.id}
                onClick={() => handleAnswer(currentQuestion.id, option.id)}
                className="w-full h-16 bg-white hover:bg-gray-50 text-gray-800 text-lg font-medium rounded-2xl shadow-md border-2 border-transparent hover:border-purple-200 transition-all duration-200 hover:scale-105"
              >
                {option.emoji && <span className="text-2xl mr-3">{option.emoji}</span>}
                {option.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderResultScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-6">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("question")}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("moodbook")}
          className="text-white hover:bg-white/20 rounded-full"
          title="Mon MoodBook"
        >
          <BookOpen className="w-6 h-6" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <GenieCharacter message="Je cherche les meilleures recommandations pour toi..." expression="🔮" />
          <Loader2 className="w-8 h-8 text-white animate-spin mt-4" />
        </div>
      ) : (
        <>
          <GenieCharacter
            message={`Voici ${recommendations.length === 1 ? "ta pépite" : `tes ${recommendations.length} recommandations`} magique${recommendations.length > 1 ? "s" : ""} 🧞‍♂️ :`}
            expression="✨"
          />

          {recommendations.length === 0 ? (
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <p className="text-gray-800 mb-4">
                  Oups ! Je n'ai pas trouvé de films correspondant exactement à tes critères sur tes plateformes.
                </p>
                <p className="text-gray-600 text-sm">
                  Essaie de sélectionner plus de plateformes ou relance le quiz avec d'autres préférences !
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {recommendations.map((movie) => (
                <Card key={movie.id} className="bg-white shadow-lg border-2 border-purple-100">
                  <CardContent className="p-0">
                    <div className="aspect-[16/9] bg-gradient-to-br from-purple-600 to-pink-600 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                      {movie.poster ? (
                        <img
                          src={movie.poster || "/placeholder.svg"}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling.style.display = "flex"
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ display: movie.poster ? "none" : "flex" }}
                      >
                        <Play className="w-16 h-16 text-white" />
                      </div>
                      
                      {/* Bouton favori avec FavoriteButton */}
                      <FavoriteButton
                        movie={movieToSave(movie)}
                        className="absolute top-4 right-4"
                        size="md"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {movie.platforms.slice(0, 3).map((platform) => (
                          <Badge key={platform.id} className="bg-purple-500 text-white text-xs">
                            {platform.name}
                          </Badge>
                        ))}
                        <div className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4 mr-1" />
                          <span className="text-sm">{movie.rating.toFixed(1)}/10</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {movie.type === "movie" ? "Film" : "Série"}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{movie.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {movie.description || "Description non disponible"}
                      </p>
                      <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl">
                        <Play className="w-5 h-5 mr-2" />
                        Regarder maintenant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <Button
              variant="outline"
              onClick={() => {
                fetchRecommendations(true)
              }}
              disabled={isLoading}
              className="w-full h-12 border-white text-white hover:bg-white/10 rounded-xl bg-transparent"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Nouvelles recommandations
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setCurrentQuestionIndex(0)
                setAnswers({})
                setSelectedPlatforms([])
                setRecommendations([])
                setCurrentScreen("welcome")
              }}
              className="w-full h-12 border-white text-white hover:bg-white/10 rounded-xl bg-transparent"
            >
              Nouveau quiz 🔄
            </Button>
          </div>
        </>
      )}
    </div>
  )

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return renderWelcomeScreen()
      case "question":
        return renderQuestionScreen()
      case "result":
        return renderResultScreen()
      case "moodbook":
        return <MoodBookScreen onBack={() => setCurrentScreen("welcome")} />
      default:
        return renderWelcomeScreen()
    }
  }

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 min-h-screen">
      {renderCurrentScreen()}
    </div>
  )
}
