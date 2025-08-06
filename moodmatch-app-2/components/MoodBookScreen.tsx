'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Star, Heart, Trash2, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getMoodBook, clearMoodBook, type Favorite } from '@/services/moodbook'
import { FavoriteButton } from './FavoriteButton'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface MoodBookScreenProps {
  onBack: () => void
}

export function MoodBookScreen({ onBack }: MoodBookScreenProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "movie" | "series">("all")
  const [sortBy, setSortBy] = useState<"recent" | "title" | "rating">("recent")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { toast } = useToast()

  // Charger les favoris
  const loadFavorites = async () => {
    setLoading(true)
    try {
      const favs = await getMoodBook()
      setFavorites(favs)
      setFilteredFavorites(favs)
    } catch (error) {
      console.error('Erreur chargement favoris:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos favoris",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      
      if (user) {
        await loadFavorites()
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Filtrer et trier les favoris
  useEffect(() => {
    let filtered = [...favorites]

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(fav => 
        fav.movie_title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrer par type
    if (filterType !== "all") {
      filtered = filtered.filter(fav => fav.movie_type === filterType)
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.movie_title.localeCompare(b.movie_title)
        case "rating":
          return b.movie_rating - a.movie_rating
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredFavorites(filtered)
  }, [favorites, searchQuery, filterType, sortBy])

  // Vider le MoodBook
  const handleClearMoodBook = async () => {
    if (!confirm("Êtes-vous sûr de vouloir vider complètement votre MoodBook ?")) {
      return
    }

    const result = await clearMoodBook()
    if (result.success) {
      setFavorites([])
      setFilteredFavorites([])
      toast({
        title: result.message,
        description: "Votre MoodBook a été vidé"
      })
    } else {
      toast({
        title: "Erreur",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  // Convertir Favorite en MovieToSave pour FavoriteButton
  const favoriteToMovie = (fav: Favorite) => ({
    id: fav.movie_tmdb_id,
    title: fav.movie_title,
    poster: fav.movie_poster,
    rating: fav.movie_rating,
    description: fav.movie_description,
    type: fav.movie_type
  })

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-6">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white ml-4">Mon MoodBook</h1>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-8xl mb-6">📚</div>
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connexion requise</h2>
            <p className="text-gray-600 mb-6">
              Vous devez être connecté pour accéder à votre MoodBook personnel.
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              Se connecter
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white ml-4">Mon MoodBook</h1>
          <Badge variant="secondary" className="ml-3 bg-white/20 text-white">
            {favorites.length}
          </Badge>
        </div>

        {favorites.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearMoodBook}
            className="text-white hover:bg-red-500/20 rounded-full"
            title="Vider le MoodBook"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-center">
            <div className="animate-spin text-4xl mb-4">🔮</div>
            <p>Chargement de votre MoodBook...</p>
          </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-8xl mb-6">📚</div>
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">MoodBook vide</h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore ajouté de films à votre bibliothèque personnelle.
            </p>
            <p className="text-gray-500 text-sm">
              Cliquez sur le ❤️ sur les films qui vous plaisent pour les sauvegarder ici !
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Filtres et recherche */}
          <div className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans votre MoodBook..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
              </div>

              {/* Filtres */}
              <div className="flex gap-3">
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="movie">Films</SelectItem>
                    <SelectItem value="series">Séries</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Plus récents</SelectItem>
                    <SelectItem value="title">Titre A-Z</SelectItem>
                    <SelectItem value="rating">Meilleure note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Liste des favoris */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {filteredFavorites.map((favorite) => (
              <Card key={favorite.id} className="bg-white shadow-lg border-2 border-purple-100">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Poster */}
                    <div className="w-24 h-36 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center relative overflow-hidden rounded-l-lg">
                      {favorite.movie_poster ? (
                        <img
                          src={favorite.movie_poster || "/placeholder.svg"}
                          alt={favorite.movie_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play className="w-8 h-8 text-white" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {favorite.movie_type === "movie" ? "Film" : "Série"}
                            </Badge>
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-3 h-3 mr-1" />
                              <span className="text-xs">{favorite.movie_rating.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">
                            {favorite.movie_title}
                          </h3>
                          
                          {favorite.movie_description && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                              {favorite.movie_description}
                            </p>
                          )}
                          
                          <p className="text-gray-400 text-xs">
                            Ajouté le {new Date(favorite.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>

                        {/* Bouton favori */}
                        <FavoriteButton
                          movie={favoriteToMovie(favorite)}
                          size="sm"
                          className="ml-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFavorites.length === 0 && (searchQuery || filterType !== "all") && (
            <div className="text-center py-8">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-white">Aucun résultat pour ces critères</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("")
                    setFilterType("all")
                  }}
                  className="text-white hover:bg-white/20 mt-2"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
