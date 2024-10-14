import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import {
  handleProccessWebhookCheckout,
  handleProccessWebhookSubscription,
  stripe,
} from "../stripe";

export const stripeWebhookController = async (
  request: Request,
  response: Response
): Promise<void> => {
  let event = request.body;

  if (!config.stripe.webhookSecret) {
    console.log("webhookSecret is not set!");
    response.status(500).json({ error: "Stripe webhookSecret is not configured" });
    return;
  }

  const signature = request.headers["stripe-signature"] as string;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      signature,
      config.stripe.secretKey
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log("Webhook signature verification failed.", errorMessage);
    response
      .status(400)
      .json({ error: "Webhook signature verification failed" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleProccessWebhookCheckout(event);
        break;
      case "customer.subscription.created":
        // Process subscription created event
        break;
      case "customer.subscription.updated":
        await handleProccessWebhookSubscription(event);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    response.json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log("Error processing webhook event.", errorMessage);
    response.status(500).json({ error: errorMessage });
  }
};
