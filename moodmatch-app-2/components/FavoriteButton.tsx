'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Loader2 } from 'lucide-react'
import { isInMoodBook, addToMoodBook, removeFromMoodBook, type MovieToSave } from '@/services/moodbook'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface FavoriteButtonProps {
  movie: MovieToSave
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FavoriteButton({ movie, className = "", size = "md" }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { toast } = useToast()

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      
      if (user) {
        // Vérifier si le film est déjà en favori
        const inFavorites = await isInMoodBook(movie.id)
        setIsFavorite(inFavorites)
      }
    }

    checkAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
      if (!session?.user) {
        setIsFavorite(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [movie.id])

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter des favoris",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      let result
      if (isFavorite) {
        result = await removeFromMoodBook(movie.id)
      } else {
        result = await addToMoodBook(movie)
      }

      if (result.success) {
        setIsFavorite(!isFavorite)
        toast({
          title: result.message,
          description: isFavorite 
            ? `"${movie.title}" retiré de votre MoodBook`
            : `"${movie.title}" ajouté à votre MoodBook`,
        })
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error)
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  }

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`${sizeClasses[size]} ${className} ${
        !isLoggedIn 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:bg-white/20"
      } rounded-full transition-all duration-200`}
      onClick={handleToggleFavorite}
      disabled={!isLoggedIn || isLoading}
      title={
        !isLoggedIn 
          ? "Connectez-vous pour ajouter aux favoris"
          : isFavorite 
            ? "Retirer des favoris" 
            : "Ajouter aux favoris"
      }
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin text-white`} />
      ) : (
        <Heart 
          className={`${iconSizes[size]} transition-all duration-200 ${
            isFavorite 
              ? "fill-red-500 text-red-500 scale-110" 
              : "text-white hover:text-red-300"
          }`} 
        />
      )}
    </Button>
  )
}
