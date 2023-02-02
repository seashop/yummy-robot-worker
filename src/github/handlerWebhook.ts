import type {
  WebhookEventMap,
  WebhookEventName,
  PushEvent,
  WorkflowJobEvent,
} from "@octokit/webhooks-types";
import type { LarkRobot } from "../lark/robot";
import { makeInteractiveCard, makeText } from "../lark/makeMessages";
import type { Message } from "../lark/types";

export const handleWebhook = async (
  name: WebhookEventName,
  event: WebhookEventMap[WebhookEventName],
  robot: LarkRobot
) => {
  let e = null;
  let msg: Message | null = null;

  switch (name) {
    case "push":
      e = event as PushEvent;
      msg = makeText(
        [
          `repository: ${e.repository.full_name}`,
          `branch : ${e.ref}`,
          `committer: ${e.pusher.name}`,
          `compare: ${e.compare}`,
        ]
          .filter(Boolean)
          .join("\n")
      );
      break;
    case "workflow_job":
      e = event as WorkflowJobEvent;
      msg = makeInteractiveCard({
        title: `${e.repository.name} 有新的Job`,
        content: [`repository: ${e.repository.full_name}`]
          .filter(Boolean)
          .join("\n"),
      });
      break;
    default:
      msg = makeInteractiveCard({
        title: `未配置事件`,
        content: [`事件标识: ${name}`].filter(Boolean).join("\n"),
      });
      break;
  }

  if (msg) {
    const resp = await robot.send(msg);
    return resp;
  }

  console.error("Unknown event:", event);
};
