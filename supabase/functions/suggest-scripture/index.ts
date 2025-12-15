import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, title, category } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a biblical scholar assistant. Given a dream or vision description, suggest the most relevant Bible scripture references that relate to its themes, symbols, or message.

Guidelines:
- Provide 1-3 scripture references in the format "Book Chapter:Verse" (e.g., "Joel 2:28", "Acts 2:17", "Genesis 37:5-10")
- Focus on scriptures that directly relate to the themes, symbols, or prophetic elements in the description
- Consider common biblical dream/vision themes: prophecy, guidance, warning, promise, revelation
- Return ONLY the scripture references separated by commas, no explanations
- Use standard Bible book abbreviations or full names
- Be accurate - only suggest real Bible verses`;

    const userPrompt = `${category === 'vision' ? 'Vision' : 'Dream'} Title: "${title}"

Description: "${description}"

Suggest the most relevant Bible scripture references for this ${category}.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI suggestion');
    }

    const data = await response.json();
    const scripture = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('AI suggested scripture:', scripture);

    return new Response(
      JSON.stringify({ scripture }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-scripture function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
