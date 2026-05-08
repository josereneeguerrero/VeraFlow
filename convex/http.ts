import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { Webhook } from "standardwebhooks";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/polar-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const body = await request.text();
    const webhookId = request.headers.get("webhook-id") ?? "";
    const webhookTimestamp = request.headers.get("webhook-timestamp") ?? "";
    const webhookSignature = request.headers.get("webhook-signature") ?? "";

    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(body, {
        "webhook-id": webhookId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": webhookSignature,
      });
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.type as string;

    try {
      switch (eventType) {
        case "subscription.created":
        case "subscription.active":
        case "subscription.updated": {
          const subscription = event.data;
          await ctx.runMutation(internal.billing.upsertSubscriptionFromPolar, {
            polarSubscriptionId: subscription.id,
            polarCustomerId: subscription.customer_id,
            customerEmail: subscription.customer?.email ?? subscription.user?.email ?? "",
            status: mapPolarStatus(subscription.status),
            plan: mapPolarPlanFromProduct(subscription.product?.name ?? "Starter"),
            currentPeriodStart: new Date(subscription.current_period_start).getTime(),
            currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
          });
          break;
        }

        case "subscription.canceled":
        case "subscription.revoked": {
          const subscription = event.data;
          await ctx.runMutation(internal.billing.updateSubscriptionStatus, {
            polarSubscriptionId: subscription.id,
            status: "canceled",
            cancelAtPeriodEnd: true,
          });
          break;
        }

        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Webhook processing failed", { status: 500 });
    }
  }),
});

function mapPolarStatus(status: string): "active" | "canceled" | "past_due" | "trialing" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "revoked":
      return "canceled";
    default:
      return "active";
  }
}

function mapPolarPlanFromProduct(productName: string): "starter" | "professional" | "enterprise" {
  const nameLower = productName.toLowerCase();
  if (nameLower.includes("enterprise")) return "enterprise";
  if (nameLower.includes("professional") || nameLower.includes("pro")) return "professional";
  return "starter";
}

export default http;
