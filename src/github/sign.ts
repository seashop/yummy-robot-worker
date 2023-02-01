import { readFileSync } from "fs";
import { createHmac } from "crypto";

function jwtDate(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

// Generate JWT for GitHub App.
// Requires gh_priv_key.pem to be in repo root (i.e. ../..).
// Requires GITHUB_APP_ID to be in .env
// Token docs: https://developer.github.com/apps/building-github-apps/authentication-options-for-github-apps/#authenticating-as-a-github-app
export function generateGitHubToken(ghAppId: string) {
  const cert = readFileSync("gh_priv_key.pem");

  const payload = {
    iat: jwtDate(new Date()),
    exp: jwtDate(new Date()) + 100,
    iss: ghAppId,
  };

  const options = {
    algorithm: "RS256",
  };

  // TODO
  // return jwt.sign(payload, cert, options);
}

export function signRequestBody(key: string, body: string | null) {
  if (!body) return null;
  return `sha1=${createHmac("sha1", key).update(body, "utf8").digest("hex")}`;
}

// Verifies authenticity of a webhook event.
// https://developer.github.com/webhooks/#delivery-headers
export async function verifyWebhookEvent(request: Request, token: any) {
  if (typeof token !== "string") {
    const errMsg = "Must provide a 'GITHUB_WEBHOOK_SECRET' env variable";
    return { statusCode: 401, body: errMsg };
  }

  const headers = request.headers;

  const sig = headers.get("x-hub-signature") || headers.get("X-Hub-Signature");
  if (!sig) {
    const errMsg = "No X-Hub-Signature found on request";
    return { statusCode: 401, body: errMsg };
  }

  const githubEvent =
    headers.get("x-github-event") || headers.get("X-GitHub-Event");
  if (!githubEvent) {
    const errMsg = "No X-Github-Event found on request";
    return { statusCode: 422, body: errMsg };
  }

  const id =
    headers.get("x-github-delivery") || headers.get("X-GitHub-Delivery");
  if (!id) {
    const errMsg = "No X-Github-Delivery found on request";
    return { statusCode: 401, body: errMsg };
  }

  const event = (await request.json()) as Object;

  const calculatedSig = signRequestBody(token, event.toString());
  if (sig !== calculatedSig) {
    const errMsg =
      "X-Hub-Signature incorrect. Github webhook token doesn't match";
    return { statusCode: 401, body: errMsg };
  }

  return null;
}
