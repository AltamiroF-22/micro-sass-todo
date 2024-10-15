import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import {
  handleProcessWebhookCheckout,
  handleProcessWebhookSubscription,
  stripe,
} from "../stripe";
import Stripe from "stripe";

export const stripeWebhookController = async (
  request: Request,
  response: Response
): Promise<void> => {
  let event = request.body;

  if (!config.stripe.webhookSecret) {
    console.log("webhookSecret is not set!");
    response
      .status(500)
      .json({ error: "Stripe webhookSecret is not configured" });
    return;
  }

  const signature = request.headers["stripe-signature"] as string;

  try {
    event = await stripe.webhooks.constructEventAsync(
      request.body,
      signature,
      config.stripe.secretKey,
      undefined,
      Stripe.createSubtleCryptoProvider()
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
        await handleProcessWebhookCheckout(event);
        break;
      case "customer.subscription.created":
        // Process subscription created event
        break;
      case "customer.subscription.updated":
        await handleProcessWebhookSubscription(event);
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
