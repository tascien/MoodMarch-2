import { useState, useEffect } from 'react'
import { 
  addToMoodBook, 
  removeFromMoodBook, 
  isInMoodBook, 
  getMoodBook, 
  getMoodBookCount,
  type MovieToSave 
} from '@/services/moodbook'
import { type Favorite } from '@/lib/supabase'

export function useMoodBook() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Charger les favoris
  const loadFavorites = async () => {
    setLoading(true)
    try {
      const [favs, count] = await Promise.all([
        getMoodBook(),
        getMoodBookCount()
      ])
      setFavorites(favs)
      setFavoritesCount(count)
    } catch (error) {
      console.error('Erreur chargement favoris:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ajouter aux favoris
  const addFavorite = async (movie: MovieToSave) => {
    const result = await addToMoodBook(movie)
    if (result.success) {
      await loadFavorites() // Recharger la liste
    }
    return result
  }

  // Retirer des favoris
  const removeFavorite = async (movieId: number) => {
    const result = await removeFromMoodBook(movieId)
    if (result.success) {
      await loadFavorites() // Recharger la liste
    }
    return result
  }

  // Vérifier si un film est favori
  const checkIsFavorite = async (movieId: number) => {
    return await isInMoodBook(movieId)
  }

  // Toggle favori
  const toggleFavorite = async (movie: MovieToSave) => {
    const isFav = await checkIsFavorite(movie.id)
    if (isFav) {
      return await removeFavorite(movie.id)
    } else {
      return await addFavorite(movie)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  return {
    favorites,
    favoritesCount,
    loading,
    loadFavorites,
    addFavorite,
    removeFavorite,
    checkIsFavorite,
    toggleFavorite
  }
}
