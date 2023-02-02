import type { LarkRobot } from "../lark/robot";
import type {
  WebhookEventMap,
  WebhookEventName,
  PushEvent,
  WorkflowJobEvent,
} from "@octokit/webhooks-types";

/**
 * See https://open.feishu.cn/tool/cardbuilder?from=howtoguide
 */
export const makeInteractiveCard = ({
  title,
  content,
  url,
  at,
  atAll,
}: {
  title: string;
  content: string;
  url?: string;
  /**
   * Custom bot only supports `@users` using open_id;
   */
  at?: string[];
  atAll?: boolean;
}) =>
  ({
    config: {
      wide_screen_mode: true,
    },

    header: {
      template: "purple",
      title: {
        tag: "plain_text",
        content: title,
      },
    },

    elements: [
      {
        tag: "markdown",
        content,
      },

      at && {
        tag: "div",
        text: {
          content: at.map((email) => `<at email=${email}></at>`).join(" "),
          tag: "lark_md",
        },
      },

      atAll && {
        tag: "div",
        text: {
          content: "<at id=all></at>",
          tag: "lark_md",
        },
      },

      url && {
        actions: [
          {
            tag: "button",
            text: {
              content: "立即查看",
              tag: "plain_text",
            },
            type: "primary",
            url,
          },
        ],
        tag: "action",
      },
    ].filter(Boolean),
  } as const);

export const handleWebhook = async (
  name: WebhookEventName,
  event: WebhookEventMap[WebhookEventName],
  robot: LarkRobot
) => {
  let card = null;
  let e = null;
  switch (name) {
    case "push":
      e = event as PushEvent;
      card = makeInteractiveCard({
        title: `${e.repository.name} 有新的推送`,
        content: [
          `repository: ${e.repository.full_name}`,
          `branch : ${e.ref}`,
          `committer: ${e.pusher.name}`,
          `compare: ${e.compare}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      break;
    case "workflow_job":
      e = event as WorkflowJobEvent;
      card = makeInteractiveCard({
        title: `${e.repository.name} 有新的Job`,
        content: [`repository: ${e.repository.full_name}`]
          .filter(Boolean)
          .join("\n"),
      });
      break;
      break;
    default:
      console.error("Unknown event:", event);
      break;
  }

  if (card) {
    const resp = await robot.send({
      msg_type: "interactive",
      card,
    });
    return resp;
  }

  console.error("Unknown event:", event);
};
