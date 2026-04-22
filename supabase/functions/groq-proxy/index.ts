// supabase/functions/groq-proxy/index.ts
// This runs on Supabase Edge (Deno) — the Groq API key stays server-side.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from Supabase secrets (set via CLI: supabase secrets set GROQ_API_KEY=gsk_...)
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server API key not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { query, history = [], filters = {}, image = null } = await req.json()

    if (!query && !image) {
      return new Response(
        JSON.stringify({ error: 'No query provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build specialist filter text
    const fl: string[] = []
    const pregKeywords = ['pregnant', 'pregnancy', 'lactation', 'breastfeed', 'trimester', 'obstetric', 'antenatal']
    const autoPreg = pregKeywords.some(k => query.toLowerCase().includes(k))

    if (filters.preg || autoPreg) fl.push('PREGNANCY SPECIALIST MODE: State FDA PLLR data across all three sections. Specify trimester-specific risks, teratogenic mechanisms, and alternatives with dosing. Reference ACOG guidelines.')
    if (filters.peds) fl.push('PAEDIATRIC SPECIALIST MODE: Provide age-stratified and weight-based dosing. Note neonatal vs infant vs child PK differences. Reference BNFc and AAP guidelines.')
    if (filters.geri) fl.push('GERIATRIC SPECIALIST MODE: Apply Beers Criteria (2023 AGS). Quantify anticholinergic burden. Flag polypharmacy cascade risks and age-related PK changes.')
    if (filters.steward) fl.push('ANTIMICROBIAL STEWARDSHIP MODE: Classify as empiric vs. targeted therapy. State spectrum, PD/PK target attainment, and recommended total duration.')
    if (filters.counsel) fl.push('COUNSELLING MODE: Translate all clinical information to patient-appropriate language (5th grade reading level). Replace jargon with simple equivalents.')

    const filterText = fl.length ? `\nSPECIALIST FILTERS ACTIVE:\n${fl.join('\n')}` : ''

    const systemPrompt = `You are PharmAI, an AI clinical decision support system functioning at the level of a Senior Clinical Pharmacist and Physician. Your audience is exclusively licensed medical professionals. Responses must be evidence-based, precise, and clinically actionable.

SCOPE GATE (MANDATORY): If the query is not related to medicine, pharmacology, clinical sciences, pharmacy, diagnostics, or allied health — set "in_scope": false and return nothing else.

ADAPTIVE FIELD POPULATION — CRITICAL: Populate ONLY the fields relevant to the specific query. Set all other fields to null or [].
${filterText}

CLINICAL DEPTH:
- Mechanisms at receptor/molecular level
- Evidence graded: A = RCT; B = cohort; C = expert consensus
- Cite specific guidelines with year
- Flag Black Box Warnings explicitly

Respond ONLY in this exact JSON (no markdown, no code fences):
{
  "in_scope": true,
  "category": "<Pharmacokinetics|Drug Interaction|Dosage & Administration|Adverse Effects|Contraindication|Mechanism of Action|Clinical Therapeutics|Monitoring|Antimicrobial|General Clinical>",
  "drug_name": "<Primary drug or topic name, or null>",
  "evidence_grade": "<A|B|C>",
  "bbw": "<Exact Black Box Warning text or null>",
  "summary": "<One precise, clinically dense sentence>",
  "pharmacokinetics": { "bioavailability": "<% or null>", "tmax": "<time or null>", "vd": "<L/kg or null>", "protein_binding": "<% or null>", "half_life": "<hours or null>", "metabolism": "<CYP/phase or null>", "excretion": "<route or null>" },
  "clinical_details": "<Structured HTML using p,ul,li,strong — relevant depth only>",
  "monitoring": [ {"parameter": "<param>", "frequency": "<timing>", "target": "<range>"} ],
  "interactions": [ {"drug": "<drug>", "severity": "<Major|Moderate|Minor>", "mechanism": "<PK/PD>", "management": "<action>"} ],
  "dose_adjustments": { "renal": "<CrCl thresholds or null>", "hepatic": "<Child-Pugh or null>", "other": "<age/weight/dialysis or null>" },
  "key_points": ["<pearl 1>","<pearl 2>","<pearl 3>"],
  "references": ["<guideline with year>","<source 2>"]
}`

    let msgs: any[] = []
    let modelToUse = GROQ_MODEL

    if (image) {
      modelToUse = VISION_MODEL
      msgs = [{
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt + '\n\nUser Query: ' + query },
          { type: 'image_url', image_url: { url: image } }
        ]
      }]
    } else {
      msgs = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10),
        { role: 'user', content: query }
      ]
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: msgs,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    })

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => null)
      return new Response(
        JSON.stringify({ error: errorData?.error?.message || 'Groq API request failed' }),
        { status: groqResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await groqResponse.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    return new Response(content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
