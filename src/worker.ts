import { createRobot } from "./lark/robot";
import type { Webhook } from "./lark/types";
import { handleWebhook } from "./github/handlerWebhook";
import { verifyWebhookEvent } from "./github/sign";
import type { WebhookEventName } from "@octokit/webhooks-types";

interface WorkerEnv {
  LARK_WEBHOOK?: Webhook;
  LARK_SIGN_SECRET?: string;
  GH_WEBHOOK_SECRET?: string;
}

const fetch: ExportedHandlerFetchHandler<WorkerEnv> = async (
  request,
  env,
  ctx
) => {
  if (!env.LARK_WEBHOOK) {
    throw new Error(
      "Specified secret 'WEBHOOK' not found in environment variables."
    );
  }

  const blob = await request.blob();
  const bodyBuffer = await blob.arrayBuffer();
  if (!bodyBuffer.byteLength) {
    return new Response("missing request body", { status: 400 });
  }

  if (env.GH_WEBHOOK_SECRET) {
    const verifyResult = await verifyWebhookEvent(
      env.GH_WEBHOOK_SECRET,
      request.headers,
      bodyBuffer
    );
    if (verifyResult) {
      throw new Error(verifyResult.body);
    }
  }

  const robot = createRobot({
    webhook: env.LARK_WEBHOOK,
    signSecret: env.LARK_SIGN_SECRET,
  });

  const rawReqPayload = await blob.text();
  let payload: any = undefined;
  try {
    payload = JSON.parse(rawReqPayload);
  } catch {
    payload = rawReqPayload;
  }

  const ghEvent = request.headers.get("X-GitHub-Event") ?? "";
  if (ghEvent) {
    return new Response(
      JSON.stringify(
        await handleWebhook(ghEvent as WebhookEventName, payload, robot)
      ),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return new Response("no matched event processor", { status: 400 });
};

const exportedHandler: ExportedHandler<WorkerEnv> = {
  fetch,
};

export default exportedHandler;
