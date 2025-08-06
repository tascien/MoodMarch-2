import { supabase, type Favorite } from '@/lib/supabase'

export interface MovieToSave {
  id: number
  title: string
  poster: string | null
  rating: number
  description: string | null
  type: 'movie' | 'series'
}

/**
 * Ajouter un film aux favoris
 */
export async function addToMoodBook(movie: MovieToSave): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, message: "Vous devez être connecté pour ajouter des favoris" }
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster,
        movie_tmdb_id: movie.id,
        movie_type: movie.type,
        movie_rating: movie.rating,
        movie_description: movie.description
      })
      .select()

    if (error) {
      if (error.code === '23505') { // Contrainte unique violée
        return { success: false, message: "Ce film est déjà dans votre MoodBook" }
      }
      console.error('Erreur ajout favori:', error)
      return { success: false, message: "Erreur lors de l'ajout" }
    }

    return { success: true, message: "Ajouté au MoodBook ✅" }
  } catch (error) {
    console.error('Erreur addToMoodBook:', error)
    return { success: false, message: "Erreur inattendue" }
  }
}

/**
 * Retirer un film des favoris
 */
export async function removeFromMoodBook(movieId: number): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, message: "Vous devez être connecté" }
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_tmdb_id', movieId)

    if (error) {
      console.error('Erreur suppression favori:', error)
      return { success: false, message: "Erreur lors de la suppression" }
    }

    return { success: true, message: "Retiré du MoodBook ❌" }
  } catch (error) {
    console.error('Erreur removeFromMoodBook:', error)
    return { success: false, message: "Erreur inattendue" }
  }
}

/**
 * Vérifier si un film est dans les favoris
 */
export async function isInMoodBook(movieId: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_tmdb_id', movieId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = pas de résultat
      console.error('Erreur vérification favori:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Erreur isInMoodBook:', error)
    return false
  }
}

/**
 * Récupérer tous les favoris de l'utilisateur
 */
export async function getMoodBook(): Promise<Favorite[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return []

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération favoris:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur getMoodBook:', error)
    return []
  }
}

/**
 * Compter le nombre de favoris
 */
export async function getMoodBookCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return 0

    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur comptage favoris:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Erreur getMoodBookCount:', error)
    return 0
  }
}

/**
 * Vider complètement le MoodBook
 */
export async function clearMoodBook(): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, message: "Vous devez être connecté" }
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur vidage MoodBook:', error)
      return { success: false, message: "Erreur lors du vidage" }
    }

    return { success: true, message: "MoodBook vidé ✅" }
  } catch (error) {
    console.error('Erreur clearMoodBook:', error)
    return { success: false, message: "Erreur inattendue" }
  }
}
