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

  if (env.GH_WEBHOOK_SECRET) {
    const verifyResult = await verifyWebhookEvent(
      request,
      env.GH_WEBHOOK_SECRET
    );
    if (verifyResult) {
      throw new Error(verifyResult.body);
    }
  }

  const robot = createRobot({
    webhook: env.WEBHOOK,
    signSecret: env.SIGN_SECRET,
  });

  return new Response(
    JSON.stringify(await handleGitlabWebhook(await request.json(), robot)),
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
