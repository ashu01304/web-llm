# Web-LLM-Runner

A lightweight, self-contained, browser-native NPM library for running Large Language Models (LLMs) purely on the frontend securely using hardware-accelerated WebGPU. No backend servers required!

## Installation

```bash
npm install web-llm-runner
```

## Quick Start
```javascript
import { WebLLM } from "web-llm-runner";

const llm = new WebLLM();
```

---

## ⚡ Core API Endpoints

This library simplifies entirely complicated WebGPU setup schemas into fully abstracted, clean endpoints. 

### 1. `models_available` (Static Property)
Returns a string-array containing all pre-configured compatible model IDs.
```javascript
console.log(llm.models_available);
// ["Llama-3.1-8B-Instruct-q4f32_1-1k", "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC", ...]
```

### 2. `local_model_available(model_id: string)` -> `Promise<boolean>`
Checks if a specific model is successfully cached locally directly in the browser's IndexedDB.
```javascript
const isCached = await llm.local_model_available("TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC");
```

### 3. `download_model(model_id: string, progressCallback?: Function)` -> `Promise<void>`
Initializes the monolithic Web Worker engine and downloads the chosen model iteratively straight to the WebGPU memory cache.
```javascript
await llm.download_model(
  "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC", 
  (progressText) => console.log(progressText) // e.g., "Loading... 24%"
);
```

### 4. `chat_stream(prompt: string)` -> `AsyncGenerator<string>`
A **stateful**, streaming chatbot endpoint that innately saves & remembers previous conversational history locally. Yields chunks as they are generated.
```javascript
const generator = llm.chat_stream("Count from 1 to 5.");
for await (const chunk of generator) {
  console.log(chunk); 
}
```

### 5. `chat_no_stream(prompt: string)` -> `Promise<string>`
A **stateful** chatbot endpoint that blocks until the generation completes and returns the full response at once.
```javascript
const reply = await llm.chat_no_stream("What is the capital of France?");
```

### 6. `generate_stream(prompt: string)` -> `AsyncGenerator<string>`
A **stateless**, memory-free generation endpoint designed for single, independent completion tasks.
```javascript
const generator = llm.generate_stream("Write a haiku about the ocean.");
for await (const chunk of generator) {
   console.log(chunk);
}
```

### 7. `generate_no_stream(prompt: string)` -> `Promise<string>`
A **stateless** completion endpoint returning an undisturbed full response.
```javascript
const text = await llm.generate_no_stream("Say exactly the word 'Hello'.");
```

### 8. `reset_chat()` -> `Promise<void>`
Instantly wipes the active conversational memory stored from the `chat_` endpoints.
```javascript
await llm.reset_chat();
```

### 9. `delete_model(model_id: string)` -> `Promise<void>`
Safely removes a downloaded model completely from the browser's local cache to immediately free up gigabytes of hard drive space.
```javascript
await llm.delete_model("TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC");
```
