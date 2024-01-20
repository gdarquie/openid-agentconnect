import { Controller, Get, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Issuer } from 'openid-client';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private client: any;
  private nonce: string;
  private state: string;

  @Get('/')
  @Render('homepage')
  async try() {
    this.nonce = this.appService.generateCode();
    this.state = this.appService.generateCode();
    this.client = await this.appService.createClient();
    const url = this.client.authorizationUrl({
      scope: 'openid email profile',
      resource: process.env.APP_URL,
      nonce: this.nonce,
      state: this.state,
    });

    return {
      url,
      client_id: this.client.client_id,
      redirect_uris: this.client.redirect_uris,
      prompt: 'login consent',
      nonce: this.nonce,
      state: this.state,
      acr: 'eidas1',
    };
  }

  @Get('discover')
  async discover() {
    const agentConnectIssuer = await Issuer.discover(
      process.env.AUTHORIZATION_SERVER_URL,
    );

    return {
      issuer: agentConnectIssuer.issuer,
      metadata: agentConnectIssuer.metadata,
    };
  }

  @Get('oidc-callback')
  async callback(@Req() req: Request) {
    const params = this.client.callbackParams(req);

    console.log('params', params);

    const tokenSet = await this.client.callback(
      `${process.env.APP_URL}/success`,
      params,
      {
        state: this.state,
        nonce: this.nonce,
      },
    );

    console.log('received and validated tokens %j', tokenSet);
    console.log('validated ID Token claims %j', tokenSet.claims());
    console.log('Return from callback');
  }

  @Get('success')
  async success(@Req() req: Request) {
    console.log('Return from callback');
  }
}
