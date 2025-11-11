const GEMINI_API_KEY = "AIzaSyBp11g_N4kL3T-xg1RSsd0lgdG0-gTXc8Q"
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function POST(req: Request) {
  try {
    const { prompt: customPrompt, genre, characters, previousChapters, isFirstChapter } = await req.json()

    let chapter = ""

    if (customPrompt) {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: customPrompt }],
            },
          ],
        }),
      })

      const data = await response.json()
      chapter = data.candidates[0].content.parts[0].text
    } else {
      const context = previousChapters.length
        ? `Previous chapters summary: ${previousChapters.slice(0, 2).join("\n\n---\n\n")}`
        : ""

      const prompt = `You are a creative storyteller writing a ${genre} story.

Characters/Themes: ${characters}

${context ? `Context from previous chapters:\n${context}\n\n` : ""}

Write Chapter ${previousChapters ? previousChapters.length + 1 : 1} of this story. The chapter should:
- Be 300-400 words
- Continue naturally from previous chapters (if any)
- Include vivid descriptions and engaging dialogue
- End with a hook that makes readers want the next chapter
- Match the ${genre} genre tone and themes

Write only the chapter content, no chapter headers or labels.`

      const response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      })

      const data = await response.json()
      chapter = data.candidates[0].content.parts[0].text
    }

    let title = "Untitled Story"
    if (isFirstChapter) {
      const titlePrompt = `Based on this story introduction: ${chapter}, generate a short, catchy, and creative book title (3 to 6 words). Don't add quotes.`

      const response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: titlePrompt }],
            },
          ],
        }),
      })

      const data = await response.json()
      const generatedTitle = data.candidates[0].content.parts[0].text
      title = generatedTitle.trim()
    }

    return Response.json({
      chapter,
      title: isFirstChapter ? title : undefined,
    })
  } catch (error) {
    console.error("Error generating chapter:", error)
    return Response.json({ error: "Failed to generate chapter" }, { status: 500 })
  }
}
