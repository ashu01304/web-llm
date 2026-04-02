import {
  CreateMLCEngine,
  prebuiltAppConfig,
  hasModelInCache,
  deleteModelAllInfoInCache,
  MLCEngineInterface,
  ChatCompletionMessageParam
} from "../index";

export class WebLLM {
  private engine: MLCEngineInterface | null = null;
  private messages: ChatCompletionMessageParam[] = [];
  public downloadProgress: Record<string, string> = {};

  constructor() {
    this.messages = this.loadContext();
  }

  // manage_model endpoints
  public get models_available(): string[] {
    return prebuiltAppConfig.model_list.map((m) => m.model_id);
  }

  public async local_model_available(model_id: string): Promise<boolean> {
    return await hasModelInCache(model_id);
  }

  public async download_model(
    model_id: string,
    progressCallback?: (progress: string) => void
  ): Promise<void> {
    this.engine = await CreateMLCEngine(model_id, {
      initProgressCallback: (progress) => {
        this.downloadProgress[model_id] = progress.text;
        if (progressCallback) progressCallback(progress.text);
      },
    });
  }

  public progress(model_id: string): string {
    return this.downloadProgress[model_id] || "No progress available.";
  }

  public async delete_model(model_id: string): Promise<void> {
    await deleteModelAllInfoInCache(model_id);
  }

  // chat endpoints (Stateful)
  public async *chat_stream(prompt: string): AsyncGenerator<string, void, unknown> {
    if (!this.engine) throw new Error("Engine not initialized. Call download_model first.");
    
    this.messages.push({ role: "user", content: prompt });
    this.saveContext();

    const chunks = await this.engine.chat.completions.create({
      messages: this.messages,
      stream: true,
    });

    let reply = "";
    for await (const chunk of chunks) {
        const text = chunk.choices[0]?.delta?.content || "";
        reply += text;
        yield text;
    }
    this.messages.push({ role: "assistant", content: reply });
    this.saveContext();
  }

  public async chat_no_stream(prompt: string): Promise<string> {
    if (!this.engine) throw new Error("Engine not initialized. Call download_model first.");
    
    this.messages.push({ role: "user", content: prompt });
    this.saveContext();

    const reply = await this.engine.chat.completions.create({
      messages: this.messages,
      stream: false,
    });

    const responseContent = (reply as any).choices[0].message.content || "";
    this.messages.push({ role: "assistant", content: responseContent });
    this.saveContext();
    return responseContent;
  }

  public reset_chat(): void {
    this.messages = [];
    this.saveContext();
  }

  // generate endpoints (Stateless)
  public async *generate_stream(prompt: string): AsyncGenerator<string, void, unknown> {
    if (!this.engine) throw new Error("Engine not initialized. Call download_model first.");
    
    const chunks = await this.engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of chunks) {
        yield chunk.choices[0]?.delta?.content || "";
    }
  }

  public async generate_no_stream(prompt: string): Promise<string> {
    if (!this.engine) throw new Error("Engine not initialized. Call download_model first.");
    
    const reply = await this.engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });
    return (reply as any).choices[0].message.content || "";
  }

  // Persistent Context helpers
  private loadContext(): ChatCompletionMessageParam[] {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const saved = localStorage.getItem("webllm_chat_context");
            return saved ? JSON.parse(saved) : [];
        }
    } catch {
        // Ignored
    }
    return [];
  }

  private saveContext(): void {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("webllm_chat_context", JSON.stringify(this.messages));
        }
    } catch (e) {
        console.error("Failed to save chat context to localStorage", e);
    }
  }
}
