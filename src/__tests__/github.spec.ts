import type { WebhookEvent } from "@octokit/webhooks-types";
import { describe, expect, vi, test } from "vitest";
import { handleWebhook } from "../github/handlerWebhook";
import type { LarkRobot } from "../lark/robot";
import payload from "./fixtures/push.json";

describe("gitlab", () => {
  test("should send data match snapshot", async () => {
    const mockRobot: LarkRobot = {
      send: vi.fn((...args) => {
        expect(args).toMatchSnapshot();
        return Promise.resolve({ code: 1, msg: "" });
      }),
    };
    await handleWebhook("push", payload as WebhookEvent, mockRobot);
    expect(mockRobot.send).toBeCalledTimes(1);
  });
});
