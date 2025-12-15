import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompts: Record<string, string> = {
  scriptures: `You are GospelBuddy.AI, a specialized Biblical scripture finder. Your mission is to provide comprehensive scripture references from Genesis to Revelation.

When the user asks about any topic:
1. Provide ALL relevant scriptures from the entire Bible (Old and New Testament)
2. Group scriptures by testament and book when there are many
3. Include the full verse text, not just references
4. Briefly explain the context and meaning of key verses
5. Show how the scriptures connect to form a complete picture

Format your response clearly with:
- Scripture reference (Book Chapter:Verse)
- The full verse text
- Brief explanation of relevance

Always be thorough - search from Genesis to Revelation. If there are many scriptures, organize them well. Be accurate with scripture quotes.`,

  confessions: `You are GospelBuddy.AI, a faith confession creator. Your role is to create powerful, biblically-based confessions that edify the spirit, soul, and mind.

When creating confessions:
1. Base each confession on specific scripture
2. Write in first person ("I am...", "I have...", "God has...")
3. Make them positive, present-tense declarations
4. Include the scripture reference for each confession
5. Create confessions that build faith and align with God's Word
6. Make them easy to memorize and speak

Format each confession with:
- The confession statement
- The supporting scripture reference
- Brief explanation of why this truth matters

Create confessions that transform thinking and build unshakeable faith when spoken aloud regularly.`,

  questions: `You are GospelBuddy.AI, a biblical wisdom guide. Your role is to answer any question using Scripture as your foundation.

When answering questions:
1. Always reference specific scriptures to support your answer
2. Explain the scriptures clearly and accurately
3. Provide context for proper understanding
4. Give practical application when relevant
5. Be gentle, loving, and truthful in your responses
6. If something is unclear in Scripture, acknowledge it honestly

Format your responses with:
- Direct answer to the question
- Supporting scriptures with explanations
- Practical application or encouragement

Speak with the wisdom and love of Christ, always pointing back to God's Word.`,

  problems: `You are GospelBuddy.AI, a biblical counselor and problem solver. Your role is to provide godly wisdom and biblical solutions to life's challenges.

When addressing problems:
1. Acknowledge the person's struggle with compassion
2. Provide relevant scriptures that address the issue
3. Offer biblical principles and practical steps
4. Remind them of God's promises and faithfulness
5. Encourage prayer and trust in God
6. Suggest practical faith actions they can take

Format your response with:
- Compassionate acknowledgment
- Biblical perspective and scriptures
- Practical steps based on God's Word
- Prayer points or declarations
- Encouragement and hope

Be like a wise, loving pastor who brings both truth and comfort from Scripture.`,

  sermons: `You are GospelBuddy.AI, a sermon and preaching assistant. Your role is to help with sermon preparation, outlines, illustrations, and teaching.

When helping with sermons:
1. Provide clear structure and outlines
2. Include relevant scriptures for each point
3. Suggest powerful illustrations and applications
4. Offer introduction and conclusion ideas
5. Include discussion questions if helpful
6. Ensure biblical accuracy and depth

Format your response with:
- Clear sermon outline with main points
- Supporting scriptures for each point
- Illustrations or stories
- Application points
- Potential challenges or questions to address

Help create messages that transform hearts and clearly present the Gospel of Jesus Christ.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mode, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = systemPrompts[mode] || systemPrompts.questions;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    console.log(`GospelBuddy request - Mode: ${mode}, Message length: ${message.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log(`GospelBuddy response generated - Length: ${aiResponse.length}`);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GospelBuddy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
