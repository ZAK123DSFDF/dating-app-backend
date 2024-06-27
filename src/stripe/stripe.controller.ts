import {
  Body,
  Controller,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private jwt: JwtService,
  ) {}

  @Post('create-checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(@Response() res, @Request() req) {
    try {
      const productId = 'price_1PUZR1AfxkebpLNRbSqa9dJl';
      const id = await this.jwt.decode(req.cookies['token']).user;
      const session = await this.stripeService.createCheckout(productId, id);
      res.status(200).json({ url: session.url });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }

  @Post('webhook')
  async handleWebHook(@Request() req, @Response() res) {
    console.log('received');
    const sig = req.headers['stripe-signature'];

    try {
      const rawBody = req.body;
      const update = await this.stripeService.handleWebHook(sig, rawBody);
      res.status(200).json(update);
    } catch (error) {
      console.log(`⚠️ Webhook signature verification failed: ${error.message}`);
      res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
  }
}
