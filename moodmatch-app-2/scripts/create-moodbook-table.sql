-- Création de la table favorites (MoodBook)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  movie_tmdb_id INTEGER NOT NULL,
  movie_type TEXT DEFAULT 'movie' CHECK (movie_type IN ('movie', 'series')),
  movie_rating DECIMAL(3,1),
  movie_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tmdb_id ON favorites(movie_tmdb_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Contrainte unique pour éviter les doublons
ALTER TABLE favorites 
ADD CONSTRAINT unique_user_movie 
UNIQUE (user_id, movie_tmdb_id);

-- RLS (Row Level Security)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs ne peuvent voir que leurs propres favoris
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent ajouter leurs propres favoris
CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent supprimer leurs propres favoris
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent modifier leurs propres favoris
CREATE POLICY "Users can update own favorites" ON favorites
  FOR UPDATE USING (auth.uid() = user_id);
