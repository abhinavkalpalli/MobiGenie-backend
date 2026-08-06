export const buildSuggestionPrompt = (
  query: string,
  phones: any[],
  filters: Record<string, unknown>,
): string => {
  const phoneList = phones
    .slice(0, 5)
    .map((p, i) =>
      `
${i + 1}. ${p.name} (${p.brand})
   💰 Price:    ₹${p.price?.current?.toLocaleString()}
   🔲 RAM:      ${p.specs?.ram}GB
   💾 Storage:  ${p.specs?.storage}GB
   🔋 Battery:  ${p.specs?.battery?.capacity}mAh (${p.specs?.battery?.charging}W charging)
   📷 Camera:   ${p.specs?.camera?.rear?.main}MP rear | ${p.specs?.camera?.front}MP front
   📱 Display:  ${p.specs?.display?.size}" ${p.specs?.display?.type} ${p.specs?.display?.refreshRate}Hz
   📶 Network:  ${p.specs?.connectivity?.network}
   ⚡ Processor: ${p.specs?.processor}
   ⭐ Rating:   ${p.rating}/5
    `.trim(),
    )
    .join('\n\n');

  const nonFilterKeys = [
    'intentCategory',
    'intentTags',
    'confidence',
    'queryType',
    'originalQuery',
  ];
  const meaningfulFilters = Object.entries(filters).filter(
    ([k, v]) => v !== undefined && v !== null && !nonFilterKeys.includes(k),
  );
  const filterSummary = meaningfulFilters
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');

  // TensorFlow intent classification — surfaced separately from the
  // regex-extracted filters above, since it's a soft signal about the
  // *kind* of request, not a hard search constraint.
  const intentCategory = filters.intentCategory as string | undefined;
  const intentTags = filters.intentTags as string[] | undefined;
  const confidence = filters.confidence as number | undefined;
  const intentLine =
    intentCategory && intentCategory !== 'general'
      ? `Detected Intent: ${intentCategory}${
          intentTags?.length ? ` (related to: ${intentTags.join(', ')})` : ''
        }${confidence ? ` — ${Math.round(confidence * 100)}% confidence` : ''}`
      : null;

  // No phones found AND no real search filters extracted → the user probably
  // isn't asking for a recommendation at all (greeting, small talk, off-topic).
  // Don't force a "search results" framing onto a reply to "hi".
  if (phones.length === 0 && meaningfulFilters.length === 0) {
    return `
You are MobiGenie, a friendly AI assistant that helps people find the right mobile phone.

The user said: "${query}"

This doesn't look like a phone search request — it may be a greeting, small talk, or something unrelated to phones.

Reply briefly and warmly:
- If it's a greeting or general chat, greet them back and introduce yourself as MobiGenie, an AI-powered assistant that helps find the right phone based on budget, specs (RAM, camera, battery, etc.), or brand — then invite them to describe what they're looking for.
- If it's unrelated to phones entirely, politely say you're focused on helping with phone recommendations, and ask what kind of phone they're looking for.

Do NOT say you couldn't find any phones or that no results matched — nothing was searched for. Keep it short (2-4 sentences), conversational, and use a couple of emojis.
    `.trim();
  }

  return `
You are MobiGenie, an expert mobile phone advisor.
The user is looking for a phone with these requirements:

User Query: "${query}"
Extracted Filters: ${filterSummary || 'No specific filters'}${intentLine ? `\n${intentLine}` : ''}

Here are the available phones matching their criteria:

${phoneList || 'No phones found matching the criteria.'}

Please provide:
1. A brief friendly greeting
2. Analysis of their requirements
3. Top 3 recommendations with reasons
4. Pros and cons for each recommendation
5. Final suggestion based on best value

Keep response concise, helpful and conversational.
Use emojis to make it readable.
If no phones match, suggest alternatives or ask for different criteria.
  `.trim();
};
