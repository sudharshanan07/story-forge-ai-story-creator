const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

function extractTextFromGeminiResponse(data: any): string | null {
  try {
    // Try the standard response structure first
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }

    // Try alternative structures
    if (data?.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts
      const textParts = parts.filter((part: any) => part.text).map((part: any) => part.text)
      if (textParts.length > 0) {
        return textParts.join("")
      }
    }

    // Try direct content access
    if (data?.content?.parts) {
      const parts = data.content.parts
      const textParts = parts.filter((part: any) => part.text).map((part: any) => part.text)
      if (textParts.length > 0) {
        return textParts.join("")
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error extracting text from Gemini response:", error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { prompt: customPrompt, genre, characters, previousChapters, isFirstChapter } = await req.json()

    let chapter = ""

    if (customPrompt) {
      try {
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

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Gemini API error:", response.status, errorText)
          return Response.json(
            {
              ok: false,
              error: `Gemini API error: ${response.status}`,
            },
            { status: 500 },
          )
        }

        const data = await response.json()
        const extractedText = extractTextFromGeminiResponse(data)

        if (!extractedText) {
          console.error("[v0] No text found in Gemini response:", JSON.stringify(data))
          return Response.json(
            {
              ok: false,
              error: "No generated text found",
              rawResponse: data,
            },
            { status: 500 },
          )
        }

        chapter = extractedText
      } catch (fetchError) {
        console.error("[v0] Error calling Gemini API:", fetchError)
        return Response.json(
          {
            ok: false,
            error: "Failed to call Gemini API",
          },
          { status: 500 },
        )
      }
    } else {
      const safeGenre = genre || "fiction"
      const safeCharacters = characters || "various interesting characters"
      const safePreviousChapters = previousChapters || []

      const context = safePreviousChapters.length
        ? `Previous chapters summary: ${safePreviousChapters.slice(0, 2).join("\n\n---\n\n")}`
        : ""

      const prompt = `You are a creative storyteller writing a ${safeGenre} story.

Characters/Themes: ${safeCharacters}

${context ? `Context from previous chapters:\n${context}\n\n` : ""}

Write Chapter ${safePreviousChapters.length + 1} of this story. The chapter should:
- Be 300-400 words
- Continue naturally from previous chapters (if any)
- Include vivid descriptions and engaging dialogue
- End with a hook that makes readers want the next chapter
- Match the ${safeGenre} genre tone and themes

Write only the chapter content, no chapter headers or labels.`

      try {
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

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Gemini API error:", response.status, errorText)
          return Response.json(
            {
              ok: false,
              error: `Gemini API error: ${response.status}`,
            },
            { status: 500 },
          )
        }

        const data = await response.json()
        const extractedText = extractTextFromGeminiResponse(data)

        if (!extractedText) {
          console.error("[v0] No text found in Gemini response:", JSON.stringify(data))
          return Response.json(
            {
              ok: false,
              error: "No generated text found",
              rawResponse: data,
            },
            { status: 500 },
          )
        }

        chapter = extractedText
      } catch (fetchError) {
        console.error("[v0] Error calling Gemini API:", fetchError)
        return Response.json(
          {
            ok: false,
            error: "Failed to call Gemini API",
          },
          { status: 500 },
        )
      }
    }

    let title = "Untitled Story"
    if (isFirstChapter) {
      const titlePrompt = `Based on this story introduction: ${chapter}, generate a short, catchy, and creative book title (3 to 6 words). Don't add quotes.`

      try {
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

        if (response.ok) {
          const data = await response.json()
          const generatedTitle = extractTextFromGeminiResponse(data)
          if (generatedTitle) {
            title = generatedTitle.trim()
          }
        } else {
          console.error("[v0] Failed to generate title, using default")
        }
      } catch (titleError) {
        console.error("[v0] Error generating title:", titleError)
        // Continue with default title
      }
    }

    return Response.json({
      ok: true,
      chapter,
      title: isFirstChapter ? title : undefined,
    })
  } catch (error) {
    console.error("[v0] Error generating chapter:", error)
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate chapter",
      },
      { status: 500 },
    )
  }
}
