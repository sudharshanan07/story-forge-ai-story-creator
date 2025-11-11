"use client"

import { useState } from "react"
import StorySetup from "@/components/story-setup"
import StoryDisplay from "@/components/story-display"

interface StoryData {
  title: string
  genre: string
  characters: string
  storySoFar: string
  chapters: string[]
}

export default function Home() {
  const [story, setStory] = useState<StoryData | null>(null)

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {!story ? (
        <StorySetup onStartStory={setStory} />
      ) : (
        <StoryDisplay story={story} onStoryUpdate={setStory} onReset={() => setStory(null)} />
      )}
    </main>
  )
}
