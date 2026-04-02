import { WebWorkerMLCEngineHandler } from "../index";

// A handler that resides in the worker thread
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
