
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
}) => {
  const card = {
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
  }

  return {
    msg_type: "interactive" as const,
    card,
  }
};

export const makeText = (text: string) => {
  return {
    msg_type: "text" as const,
    content: { text },
  }
}