import Stripe from "stripe";
import { config } from "./config";
import { prisma } from "./lib/prisma";

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2024-09-30.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const getStripeCustomerByEmail = async (
  email: string
): Promise<Stripe.Customer | null> => {
  const customers = await stripe.customers.list({ email });
  return customers.data.length > 0 ? customers.data[0] : null;
};

export const createCheckoutSession = async (
  userId: string,
  userEmail: string
) => {
  try {
    let customer = await getStripeCustomerByEmail(userEmail);

    if (!customer) {
      customer = await stripe.customers.create({
        email: userEmail,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: config.stripe.proPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      client_reference_id: userId,
      customer: customer.id,
      success_url: `http://localhost:5555/success.html`,
      cancel_url: `http://localhost:5555/cancel.html`,
    });

    return {
      stripeCustomerId: customer.id,
      url: session.url,
    };
  } catch (error) {
    throw new Error("Error to create checkout session");
  }
};

export const handleProcessWebhookCheckout = async (event: {
  object: Stripe.Checkout.Session;
}) => {
  const clientReferenceId = event.object.client_reference_id as string;
  const stripeSubscriptionId = event.object.subscription as string;
  const stripeCustomerId = event.object.customer as string;
  const checkouStatus = event.object.status;

  if (checkouStatus !== "complete") return;

  if (!clientReferenceId || !stripeSubscriptionId || !stripeCustomerId) {
    throw new Error(
      "clientReferenceId, stripeSubscriptionId and stripeCustomerId is required!"
    );
  }

  const userExists = await prisma.user.findUnique({
    where: {
      id: clientReferenceId,
    },
    select: {
      id: true,
    },
  });

  if (!userExists) throw new Error("User of client_referenceId not found!");

  await prisma.user.update({
    data: {
      stripeCustomerId: stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId,
    },
    where: {
      id: clientReferenceId,
    },
  });
};

export const handleProcessWebhookSubscription = async (event: {
  object: Stripe.Subscription;
}) => {
  const stripeCustomerId = event.object.customer as string;
  const stripeSubscriptionId = event.object.id as string;
  const stripeSubscriptionStatus = event.object.status;

  const userExists = await prisma.user.findFirst({
    where: {
      stripeCustomerId,
    },
    select: {
      id: true,
    },
  });

  if (!userExists) throw new Error("User of stripeCustomerId not found!");

  await prisma.user.update({
    where: {
      id: userExists.id,
    },
    data: {
      stripeSubscriptionId,
      stripeCustomerId,
      stripeSubscriptionStatus,
    },
  });
};
