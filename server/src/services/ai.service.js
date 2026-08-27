import { env } from '../config/env.js';

function fallback(payload) {
  const score = payload.score ?? 0;
  return { summary: score >= 75 ? 'A strong day with useful consistency.' : 'There is clear room to tighten the plan and follow-through.', strengths: [], weaknesses: [], recommendations: ['Choose one important task for tomorrow and schedule it first.'], priority: score >= 75 ? 'Maintain consistency' : 'Protect the first focus block', estimatedGrowth: null };
}

const stringList = value => Array.isArray(value) ? value.filter(item => typeof item === 'string' || typeof item === 'number').map(String).slice(0, 8) : [];

function normalize(value, payload) {
  const result = value && typeof value === 'object' ? value : {};
  const growth = result.estimatedGrowth;
  return {
    summary: String(result.summary || fallback(payload).summary).slice(0, 2000),
    strengths: stringList(result.strengths),
    weaknesses: stringList(result.weaknesses),
    recommendations: stringList(result.recommendations).length ? stringList(result.recommendations) : fallback(payload).recommendations,
    priority: result.priority ? String(result.priority).slice(0, 200) : null,
    estimatedGrowth: growth === null || growth === undefined || growth === '' ? null : Number.isFinite(Number(growth)) ? Math.max(-100, Math.min(100, Number(growth))) : null
  };
}

export function parseAndNormalize(raw, payload) {
  try {
    const cleaned = typeof raw === 'string' ? raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim() : raw;
    return { ...normalize(typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned, payload), validationStatus: 'VALIDATED' };
  } catch {
    return { ...fallback(payload), validationStatus: 'INVALID_PROVIDER_RESPONSE' };
  }
}

export async function generateReview(payload, type) {
  if (!env.aiApiKey || !env.aiApiUrl) return { ...fallback(payload), model: 'local-fallback', promptVersion: 'v1', validationStatus: 'LOCAL_FALLBACK' };
  const response = await fetch(env.aiApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.aiApiKey}` }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ model: env.aiModel, messages: [{ role: 'system', content: 'Return only valid JSON with summary, strengths, weaknesses, recommendations, priority, estimatedGrowth. Do not invent numerical performance values; use the supplied system score.' }, { role: 'user', content: JSON.stringify({ reviewType: type, data: payload }) }], temperature: 0.3 }) });
  if (!response.ok) throw new Error(`AI request failed with status ${response.status}`);
  const body = await response.json();
  const raw = body.choices?.[0]?.message?.content || body.output_text || body.result || body;
  return { ...parseAndNormalize(raw, payload), model: env.aiModel || 'configured-model', promptVersion: 'v1' };
}
