import type { AIProvider, AIRequest, AIResponse } from "@/lib/ai/types";

class MistralProvider implements AIProvider {
  name = "mistral";

  async generate(input: AIRequest & { prompt: string; timeoutMs?: number }): Promise<AIResponse> {
    const key = process.env.MISTRAL_API_KEY;
    const model = input.model || process.env.MISTRAL_MODEL || "mistral-small-latest";
    
    if (!key) {
      return {
        provider: this.name,
        model,
        promptVersion: "v1",
        outputText: "AI Error: MISTRAL_API_KEY is missing from configuration.",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 20000);

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [{ role: "user", content: input.prompt }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        return {
          provider: this.name,
          model,
          promptVersion: "v1",
          outputText: `AI Error: ${json?.message || "Mistral API request failed with status " + response.status}`,
        };
      }

      const json = await response.json();
      const outputText = json?.choices?.[0]?.message?.content;
      
      if (!outputText) {
        return {
          provider: this.name,
          model,
          promptVersion: "v1",
          outputText: "AI Error: Empty response from Mistral API.",
        };
      }

      return {
        provider: this.name,
        model,
        promptVersion: "v1",
        outputText,
      };
    } catch (err) {
      return {
        provider: this.name,
        model,
        promptVersion: "v1",
        outputText: `AI Error: ${err instanceof Error ? err.message : "Internal provider error"}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function getAIProvider(providerName?: string): AIProvider {
  const provider = providerName || process.env.AI_PROVIDER || "mistral";
  if (provider === "mistral") return new MistralProvider();
  return new MistralProvider();
}
