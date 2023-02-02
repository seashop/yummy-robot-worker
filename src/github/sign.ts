import hexToArrayBuffer from "hex-to-array-buffer";

async function verifybWebhookSignature(
  secret: string,
  payload: BufferSource,
  sign: string
) {
  if (!payload) return null;

  const enc = new TextEncoder();
  const algorithm = { name: "HMAC", hash: "SHA-256" };

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    algorithm,
    false,
    ["sign", "verify"]
  );

  // const sign = await crypto.subtle.sign(algorithm.name, key, payload)

  return await crypto.subtle.verify(
    algorithm.name,
    key,
    hexToArrayBuffer(sign.replace(/^sha256=/, "") ?? ""),
    payload
  );
}

// Verifies authenticity of a webhook event.
// https://developer.github.com/webhooks/#delivery-headers
export async function verifyWebhookEvent(
  secret: string,
  headers: Headers,
  payload: BufferSource
) {
  if (typeof secret !== "string") {
    const errMsg = "Must provide a 'GITHUB_WEBHOOK_SECRET' env variable";
    return { statusCode: 401, body: errMsg };
  }

  const sig =
    headers.get("x-hub-signature-256") || headers.get("X-Hub-Signature-256");
  if (!sig) {
    const errMsg = "No X-Hub-Signature-256 found on request";
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

  const isValid = await verifybWebhookSignature(secret, payload, sig);
  if (!isValid) {
    const errMsg =
      "X-Hub-Signature-256 incorrect. Github webhook token doesn't match";
    return { statusCode: 401, body: errMsg };
  }

  return null;
}
