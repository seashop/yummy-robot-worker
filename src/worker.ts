import { createRobot } from "./lark/robot";
import type { Webhook } from "./lark/types";
import { handleGitlabWebhook } from "./gitlabHandler";
import { verifyWebhookEvent } from "./github/sign";

interface WorkerEnv {
  WEBHOOK?: Webhook;
  SIGN_SECRET?: string;
  GH_WEBHOOK_SECRET?: string;
}

const fetch: ExportedHandlerFetchHandler<WorkerEnv> = async (
  request,
  env,
  ctx
) => {
  if (!env.WEBHOOK) {
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
    webhook: env.WEBHOOK,
    signSecret: env.SIGN_SECRET,
  });

  const rawReqPayload = await blob.text();
  let reqPayload: any = undefined;
  try {
    reqPayload = JSON.parse(rawReqPayload);
  } catch {
    reqPayload = rawReqPayload;
  }

  return new Response(
    JSON.stringify(await handleGitlabWebhook(reqPayload, robot)),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

const exportedHandler: ExportedHandler<WorkerEnv> = {
  fetch,
};

export default exportedHandler;
