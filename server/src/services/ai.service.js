import { env } from '../config/env.js';

function fallback(payload) {
  const score = payload.score ?? 0;
  return { summary: score >= 75 ? 'A strong day with useful consistency.' : 'There is clear room to tighten the plan and follow-through.', strengths: [], weaknesses: [], recommendations: ['Choose one important task for tomorrow and schedule it first.'], priority: score >= 75 ? 'Maintain consistency' : 'Protect the first focus block', estimatedGrowth: null };
}

function normalize(value, payload) {
  const result = value && typeof value === 'object' ? value : {};
  return {
    summary: String(result.summary || fallback(payload).summary).slice(0, 2000),
    strengths: Array.isArray(result.strengths) ? result.strengths.map(String).slice(0, 8) : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.map(String).slice(0, 8) : [],
    recommendations: Array.isArray(result.recommendations) ? result.recommendations.map(String).slice(0, 8) : fallback(payload).recommendations,
    priority: result.priority ? String(result.priority).slice(0, 200) : null,
    estimatedGrowth: Number.isFinite(Number(result.estimatedGrowth)) ? Number(result.estimatedGrowth) : null
  };
}

export async function generateReview(payload, type) {
  if (!env.aiApiKey || !env.aiApiUrl) return { ...fallback(payload), model: 'local-fallback', promptVersion: 'v1' };
  const response = await fetch(env.aiApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.aiApiKey}` }, body: JSON.stringify({ model: env.aiModel, messages: [{ role: 'system', content: 'Return only valid JSON with summary, strengths, weaknesses, recommendations, priority, estimatedGrowth.' }, { role: 'user', content: JSON.stringify({ reviewType: type, data: payload }) }], temperature: 0.3 }) });
  if (!response.ok) throw new Error(`AI request failed with status ${response.status}`);
  const body = await response.json();
  const raw = body.choices?.[0]?.message?.content || body.output_text || body.result || body;
  let parsed = raw;
  if (typeof raw === 'string') { const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim(); parsed = JSON.parse(cleaned); }
  return { ...normalize(parsed, payload), model: env.aiModel || 'configured-model', promptVersion: 'v1' };
}
