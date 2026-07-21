/**
 * Stage 3 integrations. Video script generation always works (it's just
 * Claude). Slide deck and full-video generation require external API keys
 * that aren't provisioned in every environment, so they fail with a clear,
 * catchable error instead of a confusing network failure.
 *
 * The Gamma/InVideo endpoints and payload shapes below are best-effort
 * placeholders — verify against each provider's current API docs and adjust
 * before relying on them in production.
 */

export class IntegrationNotConfiguredError extends Error {
  constructor(service: string) {
    super(`${service} is not configured. Set the relevant API key to enable this feature.`);
    this.name = "IntegrationNotConfiguredError";
  }
}

export async function generateSlideDeck(input: {
  lessonTitle: string;
  lessonContent: string;
}): Promise<{ url: string }> {
  if (!process.env.GAMMA_API_KEY) {
    throw new IntegrationNotConfiguredError("Gamma");
  }

  const response = await fetch("https://public-api.gamma.app/v0.2/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.GAMMA_API_KEY,
    },
    body: JSON.stringify({
      inputText: `${input.lessonTitle}\n\n${input.lessonContent}`,
      format: "presentation",
    }),
  });
  if (!response.ok) {
    throw new Error(`Gamma request failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return { url: data.url ?? data.generationUrl };
}

export async function generateVideo(input: {
  lessonTitle: string;
  script: string;
}): Promise<{ url: string }> {
  if (!process.env.INVIDEO_API_KEY) {
    throw new IntegrationNotConfiguredError("InVideo");
  }

  const response = await fetch("https://api.invideo.io/v1/videos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INVIDEO_API_KEY}`,
    },
    body: JSON.stringify({ title: input.lessonTitle, script: input.script }),
  });
  if (!response.ok) {
    throw new Error(`InVideo request failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return { url: data.url ?? data.videoUrl };
}
