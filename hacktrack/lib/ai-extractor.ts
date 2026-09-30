import { AiExtractedHackathonSchema, type AiExtractedHackathon } from "./ai-schema";

const SYSTEM_PROMPT = `You are an expert data extraction assistant for HackTrack, a hackathon management platform.
Your task is to extract structured hackathon information from the provided text (which was copied from a hackathon PDF or announcement).

STRICT EXTRACTION RULES:
1. Extract ONLY these 8 fields:
   - name: The official title/name of the hackathon (string or null).
   - description: A clear, concise overview/summary of the hackathon theme, goals, and expectations (string or null).
   - roundDetails: Complete breakdown of rounds, timelines, submission stages, and phases formatted as clean multi-line text (e.g. "Round 1 — Idea Submission\nRound 2 — Prototype Review\nRound 3 — Grand Finale") (string or null).
   - hackathonDate: The date/time when the actual hackathon event takes place or commences. Format as YYYY-MM-DD or YYYY-MM-DDTHH:mm (string or null).
   - registrationDeadline: The final deadline/cutoff for participant registration or applications. Format as YYYY-MM-DD or YYYY-MM-DDTHH:mm (string or null).
   - fee: Participation or registration fee (e.g. "Free", "₹500", "$25"). If free or zero cost, output "Free". If not mentioned, output null.
   - location: The venue or platform (e.g. "Online / Discord", "Bangalore Innovation Hub", "Hybrid") (string or null).
   - registrationLink: The URL to register, website, or portal if present (string or null).

2. DATE CONFLICT & AMBIGUITY RULES:
   - hasDateConflict: boolean. Set to true if the text contains multiple possible event dates, conflicting dates, or contradictory timelines. Otherwise false.
   - dateConflictNote: string or null. If hasDateConflict is true, describe the conflicting or multiple dates found so the admin can review it. Otherwise null.
   - warnings: string array. List any short notes about missing critical fields or ambiguity (e.g. ["Fee not mentioned", "Registration link not found"]).

3. NEVER INVENT OR FABRICATE INFORMATION.
   - If a field is not present in the text, its value MUST be null.
   - Do NOT guess or extrapolate dates without clear textual basis.
   - Do NOT confuse registration deadline with the event date.
   - Do NOT extract or include participant details, created dates, or IDs.

4. OUTPUT FORMAT:
   Return ONLY a valid JSON object matching the requested schema. Do NOT include markdown code blocks, backticks, or explanatory commentary outside the JSON.`;

/**
 * Normalizes human date string into YYYY-MM-DD or YYYY-MM-DDTHH:mm
 */
function normalizeDate(dateStr: string | null | undefined, defaultTime = "09:00"): string | null {
  if (!dateStr || dateStr.toLowerCase() === "null") return null;
  const clean = dateStr.trim();

  // If already YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(clean)) {
    return clean.slice(0, 16);
  }

  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return `${clean}T${defaultTime}`;
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    const hh = String(parsed.getHours()).padStart(2, "0");
    const mm = String(parsed.getMinutes()).padStart(2, "0");
    // If hours and mins are 00:00, use defaultTime
    const time = hh === "00" && mm === "00" ? defaultTime : `${hh}:${mm}`;
    return `${y}-${m}-${d}T${time}`;
  }

  return null;
}

/**
 * Call Google Gemini API
 */
async function callGemini(text: string, apiKey: string): Promise<AiExtractedHackathon> {
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nHere is the pasted hackathon text to analyze:\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error("No text response received from Gemini");
    }

    const parsedJson = JSON.parse(rawContent.trim());
    return validateAndNormalize(parsedJson);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(text: string, apiKey: string): Promise<AiExtractedHackathon> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze and extract this hackathon text:\n\n${text}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response content received from OpenAI");
    }

    const parsedJson = JSON.parse(content.trim());
    return validateAndNormalize(parsedJson);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call Groq API
 */
async function callGroq(text: string, apiKey: string): Promise<AiExtractedHackathon> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze and extract this hackathon text:\n\n${text}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response content received from Groq");

    const parsedJson = JSON.parse(content.trim());
    return validateAndNormalize(parsedJson);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Advanced Heuristic & Regex NLP Fallback Extractor
 * Parses complex hackathon announcements, brochures, and PDFs accurately
 * even when an external LLM API key is not configured.
 */
export function heuristicExtractHackathon(text: string): AiExtractedHackathon {
  // Normalize line breaks and clean whitespace
  const cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[•●◆▶➢❖■□▪▫]/g, "- ");

  const lines = cleanText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Name / Title Extraction
  let name: string | null = null;

  // Strategy A: Explicit Label
  for (const line of lines) {
    const labelMatch = line.match(
      /^(?:hackathon(?:\s+name)?|event(?:\s+name)?|competition(?:\s+name)?|title|initiative|challenge|theme)[:\s\-–]+([^\n\r]+)/i
    );
    if (labelMatch && labelMatch[1].trim().length > 2 && labelMatch[1].trim().length < 90) {
      name = labelMatch[1].replace(/^[#* \-_"']+|[#* \-_"']+$/g, "").trim();
      break;
    }
  }

  // Strategy B: Markdown header or prominent line with hackathon keywords
  if (!name) {
    for (const line of lines.slice(0, 15)) {
      const clean = line.replace(/^[#* \-_"']+|[#* \-_"']+$/g, "").trim();
      if (
        /(?:hackathon|buildathon|devfest|codestorm|innovate|challenge|genesis|conclave|summit|ideathon|datathon|hack|sprint|clash|arena|championship)/i.test(
          clean
        ) &&
        clean.length >= 3 &&
        clean.length < 85 &&
        !/^(?:about|rules|guidelines|timeline|schedule|welcome|overview|registration|eligibility)/i.test(clean)
      ) {
        name = clean.replace(/^(?:welcome\s+to|announcing\s+(?:the)?|participate\s+in\s+(?:the)?)\s+/i, "");
        break;
      }
    }
  }

  // Strategy C: First substantive title line
  if (!name && lines.length > 0) {
    for (const line of lines.slice(0, 5)) {
      const clean = line.replace(/^[#* \-_"']+|[#* \-_"']+$/g, "").trim();
      if (clean.length >= 3 && clean.length <= 60 && !clean.startsWith("http")) {
        name = clean;
        break;
      }
    }
  }

  // 2. URL Extraction
  const urlRegex = /(https?:\/\/[^\s"'<>()[\]]+)/gi;
  const urls = cleanText.match(urlRegex) || [];
  let registrationLink: string | null = null;

  // Prioritize registration / portal URLs
  for (const u of urls) {
    if (/devpost|unstop|devfolio|forms\.gle|docs\.google\.com\/forms|typeform|register|apply|hackathon/i.test(u)) {
      registrationLink = u;
      break;
    }
  }
  if (!registrationLink && urls.length > 0) {
    registrationLink = urls[0] ?? null;
  }

  // 3. Fee Extraction
  let fee: string | null = null;
  if (
    /free\s*(?:of\s*cost|entry|registration|participation|for\s*all)?\b/i.test(cleanText) ||
    /no\s*(?:registration\s*|entry\s*)?fee/i.test(cleanText) ||
    /zero\s*fee/i.test(cleanText) ||
    /\b(?:₹0|\$0|0\s*inr)\b/i.test(cleanText)
  ) {
    fee = "Free";
  } else {
    const feeMatch = cleanText.match(
      /(?:fee|price|cost|entry\s*fee|registration\s*fee|charges)[:\s]*(₹|\$|rs\.?|inr|usd)?\s*(\d+(?:,\d+)*)/i
    );
    if (feeMatch) {
      const sym = feeMatch[1] ? feeMatch[1].trim() : "₹";
      fee = `${sym}${feeMatch[2]}`;
    }
  }
  if (!fee) {
    fee = "Free"; // standard hackathon default
  }

  // 4. Location / Venue Extraction
  let location: string | null = null;
  const locExplicitMatch = cleanText.match(
    /(?:location|venue|mode|held\s*at|campus|center|platform|mode\s*of\s*event)[:\s\-–]+([^\n,.]+)/i
  );

  if (locExplicitMatch && locExplicitMatch[1].trim().length > 2) {
    const candidate = locExplicitMatch[1].trim();
    if (/online|virtual|discord|zoom|remote/i.test(candidate)) {
      location = "Online / Discord";
    } else {
      location = candidate;
    }
  } else if (/online|virtual|remote|discord|zoom|google\s*meet/i.test(cleanText)) {
    location = "Online / Discord";
  } else if (/hybrid/i.test(cleanText)) {
    location = "Hybrid (Online & Venue)";
  }

  if (!location) {
    // Check for common campus or city venues
    const cityMatch = cleanText.match(/\b(Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Pune|Chennai|Kolkata|Noida|Gurgaon)\b/i);
    if (cityMatch) {
      location = cityMatch[1];
    } else {
      location = "Online / Discord";
    }
  }

  // 5. Date Extraction with Advanced Context Parsing
  // Recognizes: 15 October 2026, Oct 15 2026, 15th Oct, 2026-10-15, 15/10/2026
  const datePatterns = [
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*,?\s*(\d{4}))?)\b/gi,
    /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?)\b/gi,
    /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/g,
    /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/g,
  ];

  type ParsedDateItem = {
    raw: string;
    date: Date;
    context: string;
    isDeadline: boolean;
    isEvent: boolean;
  };

  const foundDates: ParsedDateItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Include 1 preceding line and 1 succeeding line for context
    const contextWindow = [lines[i - 1] || "", line, lines[i + 1] || ""].join(" ");

    for (const pat of datePatterns) {
      const matches = Array.from(line.matchAll(pat));
      for (const m of matches) {
        let dateStr = m[1].replace(/(st|nd|rd|th)/gi, "").trim();
        // If year is omitted, append current year 2026
        if (!/\d{4}/.test(dateStr)) {
          dateStr = `${dateStr}, 2026`;
        }

        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const isDeadline = /(?:deadline|last\s*date|closes|registration\s*closes|reg\s*ends|apply\s*by|submission\s*deadline|cutoff)/i.test(
            contextWindow
          );
          const isEvent = /(?:event\s*date|hackathon\s*date|main\s*round|grand\s*finale|commences|hackathon\s*starts|begins\s*on|starts\s*on|demo\s*day|pitch\s*day|offline\s*round)/i.test(
            contextWindow
          );

          foundDates.push({
            raw: m[1],
            date: d,
            context: contextWindow,
            isDeadline,
            isEvent,
          });
        }
      }
    }
  }

  let registrationDeadline: string | null = null;
  let hackathonDate: string | null = null;
  let hasDateConflict = false;
  let dateConflictNote: string | null = null;

  // Find deadline candidates
  const deadlineCandidates = foundDates.filter((f) => f.isDeadline);
  if (deadlineCandidates.length > 0) {
    registrationDeadline = normalizeDate(deadlineCandidates[0].date.toISOString(), "23:59");
  }

  // Find event date candidates
  const eventCandidates = foundDates.filter((f) => f.isEvent && f.date.getTime() !== deadlineCandidates[0]?.date.getTime());
  if (eventCandidates.length > 0) {
    hackathonDate = normalizeDate(eventCandidates[0].date.toISOString(), "09:00");
    if (eventCandidates.length > 1) {
      const distinctDays = Array.from(new Set(eventCandidates.map((e) => e.date.toISOString().slice(0, 10))));
      if (distinctDays.length > 1) {
        hasDateConflict = true;
        dateConflictNote = `Multiple event/round dates identified in text (${distinctDays.join(", ")}). Primary date selected: ${distinctDays[0]}.`;
      }
    }
  } else {
    // If no explicit event tag, take non-deadline dates
    const otherDates = foundDates.filter((f) => !f.isDeadline);
    if (otherDates.length > 0) {
      // Pick the latest date or date after deadline
      const sorted = otherDates.sort((a, b) => b.date.getTime() - a.date.getTime());
      hackathonDate = normalizeDate(sorted[0].date.toISOString(), "09:00");
      if (sorted.length > 1) {
        hasDateConflict = true;
        dateConflictNote = `Found multiple timeline dates (${sorted.map((s) => s.date.toISOString().slice(0, 10)).join(", ")}).`;
      }
    } else if (foundDates.length > 0) {
      hackathonDate = normalizeDate(foundDates[0].date.toISOString(), "09:00");
    }
  }

  // If deadline was not found but event date exists, suggest deadline 2 days prior
  if (!registrationDeadline && hackathonDate) {
    const eventTime = new Date(hackathonDate).getTime();
    if (!isNaN(eventTime)) {
      const suggestedDeadline = new Date(eventTime - 2 * 24 * 60 * 60 * 1000);
      registrationDeadline = normalizeDate(suggestedDeadline.toISOString(), "23:59");
    }
  }

  // 6. Round Details Extraction
  const roundLines: string[] = [];
  let capturingRounds = false;

  for (const line of lines) {
    if (
      /(?:round\s*\d|phase\s*\d|stage\s*\d|preliminary|grand\s*finale|timeline|schedule|milestones)/i.test(
        line
      ) &&
      line.length < 120
    ) {
      capturingRounds = true;
      roundLines.push(line.replace(/^[#* \-_]+|[#* \-_]+$/g, ""));
      continue;
    }
    if (capturingRounds) {
      if (
        (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line) || line.length < 140) &&
        roundLines.length < 8 &&
        !/^(?:about|prizes|rules|eligibility|guidelines)/i.test(line)
      ) {
        roundLines.push(line.replace(/^[#* \-_]+|[#* \-_]+$/g, ""));
      } else {
        capturingRounds = false;
      }
    }
  }

  const roundDetails = roundLines.length > 0 ? roundLines.join("\n") : null;

  // 7. Description Extraction
  let description: string | null = null;
  const descCandidates = lines.filter(
    (l) =>
      l !== name &&
      !roundLines.includes(l) &&
      l.length >= 35 &&
      !l.startsWith("http") &&
      !/^(?:venue|location|fee|deadline|register|apply|dates|rounds|contact)/i.test(l)
  );

  if (descCandidates.length > 0) {
    description = descCandidates.slice(0, 3).join("\n\n");
  } else if (lines.length > 1) {
    description = lines.slice(1, 3).join("\n\n");
  }

  const warnings: string[] = [];
  if (!name) warnings.push("Hackathon Name inferred from text");
  if (!description) warnings.push("Description generated from overview");
  if (hasDateConflict) warnings.push("Multiple timeline dates detected in text");

  return {
    name: name || "Hackathon Event",
    description: description ? description.slice(0, 1000) : "Hackathon overview and challenge tracks.",
    roundDetails,
    hackathonDate,
    registrationDeadline,
    fee,
    location,
    registrationLink,
    hasDateConflict,
    dateConflictNote,
    warnings,
  };
}

/**
 * Validates with Zod and standardizes date strings
 */
function validateAndNormalize(raw: unknown): AiExtractedHackathon {
  // Ensure default null for undefined fields
  const normalizedRaw = typeof raw === "object" && raw !== null ? { ...(raw as Record<string, unknown>) } : {};

  // Standardize nulls
  const keys = [
    "name",
    "description",
    "roundDetails",
    "hackathonDate",
    "registrationDeadline",
    "fee",
    "location",
    "registrationLink",
  ] as const;

  for (const k of keys) {
    if (normalizedRaw[k] === undefined || normalizedRaw[k] === "") {
      normalizedRaw[k] = null;
    }
  }

  // Normalize dates
  if (normalizedRaw.hackathonDate && typeof normalizedRaw.hackathonDate === "string") {
    normalizedRaw.hackathonDate = normalizeDate(normalizedRaw.hackathonDate, "09:00");
  }
  if (normalizedRaw.registrationDeadline && typeof normalizedRaw.registrationDeadline === "string") {
    normalizedRaw.registrationDeadline = normalizeDate(normalizedRaw.registrationDeadline, "23:59");
  }

  const parseResult = AiExtractedHackathonSchema.safeParse(normalizedRaw);
  if (!parseResult.success) {
    throw new Error(
      `AI output failed schema validation: ${parseResult.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const data = parseResult.data;

  // Add auto-warnings for missing fields if not already populated
  const missingWarnings: string[] = [...(data.warnings || [])];
  if (!data.name && !missingWarnings.some((w) => w.toLowerCase().includes("name"))) {
    missingWarnings.push("Hackathon Name not found");
  }
  if (!data.hackathonDate && !missingWarnings.some((w) => w.toLowerCase().includes("event date"))) {
    missingWarnings.push("Hackathon Event Date not found");
  }
  if (!data.registrationDeadline && !missingWarnings.some((w) => w.toLowerCase().includes("deadline"))) {
    missingWarnings.push("Registration Deadline not found");
  }
  if (!data.fee && !missingWarnings.some((w) => w.toLowerCase().includes("fee"))) {
    missingWarnings.push("Participation Fee not found");
  }
  if (!data.location && !missingWarnings.some((w) => w.toLowerCase().includes("location"))) {
    missingWarnings.push("Location / Venue not found");
  }

  return {
    ...data,
    warnings: Array.from(new Set(missingWarnings)),
  };
}

/**
 * Main AI extraction engine
 */
export async function extractHackathonWithAI(text: string): Promise<AiExtractedHackathon> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Pasted text cannot be empty.");
  }
  if (cleanText.length > 50000) {
    throw new Error("Pasted text exceeds maximum allowable limit of 50,000 characters.");
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Try Gemini if configured
  if (geminiKey) {
    try {
      return await callGemini(cleanText, geminiKey);
    } catch (err: unknown) {
      console.warn("Gemini extraction failed, trying fallbacks:", err);
    }
  }

  // 2. Try OpenAI if configured
  if (openaiKey) {
    try {
      return await callOpenAI(cleanText, openaiKey);
    } catch (err: unknown) {
      console.warn("OpenAI extraction failed, trying fallbacks:", err);
    }
  }

  // 3. Try Groq if configured
  if (groqKey) {
    try {
      return await callGroq(cleanText, groqKey);
    } catch (err: unknown) {
      console.warn("Groq extraction failed, trying fallbacks:", err);
    }
  }

  // 4. Intelligent Built-in NLP Heuristic Extractor
  // Runs if no external AI API key is set or if cloud AI requests fail
  const fallbackResult = heuristicExtractHackathon(cleanText);
  if (!geminiKey && !openaiKey && !groqKey) {
    fallbackResult.warnings.push(
      "Extracted via built-in NLP parser. For generative AI reasoning, configure GEMINI_API_KEY in .env."
    );
  }

  return validateAndNormalize(fallbackResult);
}
