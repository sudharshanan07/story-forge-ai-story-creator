"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface StoryData {
  title: string
  genre: string
  characters: string
  storySoFar: string
  chapters: string[]
}

interface StorySetupProps {
  onStartStory: (story: StoryData) => void
}

const GENRES = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Comedy", "Thriller"]

const GENRE_IMAGES: Record<string, string> = {
  Fantasy: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop",
  "Sci-Fi": "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=1200&h=400&fit=crop",
  Mystery: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop",
  Romance: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=400&fit=crop",
  Comedy: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop",
  Thriller: "https://images.unsplash.com/photo-1500577745628-33db4a67f6ec?w=1200&h=400&fit=crop",
}

export default function StorySetup({ onStartStory }: StorySetupProps) {
  const [genre, setGenre] = useState("")
  const [characters, setCharacters] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleStartStory = async () => {
    if (!genre || !characters.trim()) {
      alert("Please select a genre and enter characters/themes")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write the first chapter (around 300 words) of a ${genre} story featuring ${characters}. Make it immersive, descriptive, and engaging with vivid details and atmosphere.`,
          genre,
          characters,
          previousChapters: [],
          isFirstChapter: true,
        }),
      })

      const data = await response.json()

      if (data.title && data.chapter) {
        onStartStory({
          title: data.title,
          genre,
          characters,
          storySoFar: data.chapter,
          chapters: [data.chapter],
        })
      }
    } catch (error) {
      console.error("Error starting story:", error)
      alert("Failed to generate story. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary mb-4 text-balance">📖 StoryForge</h1>
          <p className="text-lg text-foreground/70 font-light">Co-Create Your Next Adventure</p>
        </div>

        {/* Setup Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 md:p-10 border border-border animate-fade-in">
          <div className="space-y-6">
            {/* Genre Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Choose a Genre</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      genre === g
                        ? "bg-primary text-primary-foreground border-primary scale-105"
                        : "bg-background border-border hover:border-accent text-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Characters/Themes Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Enter Main Characters or Themes</label>
              <textarea
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="e.g., A brave knight, an ancient curse, hidden treasure..."
                className="w-full p-4 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                rows={4}
              />
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartStory}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Generating First Chapter...
                </div>
              ) : (
                "Start Story"
              )}
            </Button>
          </div>
        </div>

        {/* Footer tagline */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Author: StoryForge AI | Built by SV Sudharshanan | Powered by v0.app
        </p>
      </div>
    </div>
  )
}
