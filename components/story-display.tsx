"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const GENRE_FALLBACK_IMAGES: Record<string, string> = {
  Fantasy: "https://images.unsplash.com/photo-1518709268805-4e904279c0fa?w=1200&h=400&fit=crop",
  "Sci-Fi": "https://images.unsplash.com/photo-1451187580459-43490279a6c3?w=1200&h=400&fit=crop",
  Mystery: "https://images.unsplash.com/photo-1509023464722-18d99639c0fa?w=1200&h=400&fit=crop",
  Romance: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=1200&h=400&fit=crop",
  Comedy: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=400&fit=crop",
  Thriller: "https://images.unsplash.com/photo-1505678261036-a3fcc5e884ee?w=1200&h=400&fit=crop",
}

interface StoryData {
  title: string
  genre: string
  characters: string
  storySoFar: string
  chapters: string[]
  coverImage?: string
}

interface StoryDisplayProps {
  story: StoryData
  onStoryUpdate: (story: StoryData) => void
  onReset: () => void
}

export default function StoryDisplay({ story, onStoryUpdate, onReset }: StoryDisplayProps) {
  const [chapters, setChapters] = useState(story.chapters)
  const [storySoFar, setStorySoFar] = useState(story.storySoFar)
  const [storyTitle, setStoryTitle] = useState(story.title)
  const [isLoadingNext, setIsLoadingNext] = useState(false)
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)

  const handleNextChapter = async () => {
    setIsLoadingNext(true)
    setShowCompletionMessage(false)

    try {
      const response = await fetch("/api/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Continue this ${story.genre} story naturally, keeping the same tone, style, and characters. The story so far: ${storySoFar}. Write the next chapter (300-400 words) with vivid descriptions and engaging dialogue.`,
          genre: story.genre,
          characters: story.characters,
          previousChapters: chapters,
          isFirstChapter: false,
        }),
      })

      const data = await response.json()

      if (data.chapter) {
        const newChapters = [...chapters, data.chapter]
        const newStorySoFar = storySoFar + "\n\n" + data.chapter

        setChapters(newChapters)
        setStorySoFar(newStorySoFar)
        onStoryUpdate({
          ...story,
          title: storyTitle,
          chapters: newChapters,
          storySoFar: newStorySoFar,
        })
      }
    } catch (error) {
      console.error("Error generating chapter:", error)
      alert("Failed to generate next chapter. Please try again.")
    } finally {
      setIsLoadingNext(false)
    }
  }

  const handleDownload = () => {
    const fileContent = `${storyTitle}\nGenre: ${story.genre}\nWritten by StoryForge AI & SV Sudharshanan\n\n${chapters
      .map((chapter, index) => `Chapter ${index + 1}\n\n${chapter}`)
      .join("\n\n" + "━".repeat(50) + "\n\n")}`

    const blob = new Blob([fileContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${storyTitle.replace(/\s+/g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setShowCompletionMessage(true)
    setTimeout(() => {
      onReset()
    }, 2000)
  }

  const headerImage = story.coverImage || GENRE_FALLBACK_IMAGES[story.genre] || GENRE_FALLBACK_IMAGES.Fantasy

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Image Section */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img
          src={headerImage || "/placeholder.svg"}
          alt={`${story.genre} story header`}
          className="w-full h-full object-cover animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary mb-4 text-balance">{storyTitle}</h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-muted-foreground">
            <span className="text-sm font-medium">{story.genre}</span>
            <span className="text-sm">•</span>
            <span className="text-sm font-light">Written by StoryForge AI</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <Button
            onClick={handleNextChapter}
            disabled={isLoadingNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
          >
            {isLoadingNext ? (
              <div className="flex items-center gap-2">
                <Spinner className="w-4 h-4" />
                Generating next chapter...
              </div>
            ) : (
              "Next Chapter"
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="border-border hover:bg-secondary/50 bg-transparent transition-all"
          >
            Download Story
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-border hover:bg-secondary/50 bg-transparent transition-all"
          >
            Start New Story
          </Button>
        </div>

        {/* Story Display with Gradient Background */}
        <div className="relative rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-lg pointer-events-none" />

          <div className="relative space-y-8 p-8 md:p-12">
            {chapters.map((chapter, index) => (
              <div key={index} className="animate-fade-in">
                <h2 className="font-serif text-3xl font-bold text-primary mb-6">Chapter {index + 1}</h2>

                <div className="text-foreground text-lg leading-relaxed space-y-4">
                  {chapter.split("\n\n").map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-justify text-balance font-light">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {index < chapters.length - 1 && (
                  <div className="flex justify-center my-10">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showCompletionMessage && (
          <div className="mt-8 p-6 bg-primary/10 border border-primary/30 rounded-lg text-center animate-fade-in">
            <p className="text-lg font-light text-foreground">✨ Your adventure awaits... Start a new story anytime!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary/5 border-t border-border mt-12 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Author: StoryForge AI | Built by SV Sudharshanan | Powered by v0.app
          </p>
        </div>
      </footer>
    </div>
  )
}
