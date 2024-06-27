import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
    });
  }

  async createCheckout(productId: string, userId: string) {
    const successUrl = `http://localhost:3000/success`;
    const cancelUrl = `http://localhost:3000/cancel`;

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: productId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId,
        },
      });

      return session;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handleWebHook(sig: string, rawBody: Buffer) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (error) {
      console.log(
        `⚠️  Webhook signature verification failed: ${error.message}`,
      );
      throw new Error(`Webhook Error: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata.userId;

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 100 } },
      });

      return updatedUser;
    } else {
      console.log(`Unhandled event type ${event.type}`);
    }
  }
}
