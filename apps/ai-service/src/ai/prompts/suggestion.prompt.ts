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

  const filterSummary = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');

  return `
You are MobiGenie, an expert mobile phone advisor.
The user is looking for a phone with these requirements:

User Query: "${query}"
Extracted Filters: ${filterSummary || 'No specific filters'}

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
