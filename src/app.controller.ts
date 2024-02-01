import {
  Controller,
  Get,
  Redirect,
  Render,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { AppService } from './app.service';
import { BaseClient, Issuer } from 'openid-client';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private client: BaseClient;
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
  @Redirect('success', 301)
  async callback(@Session() session: Record<string, any>, @Req() req: Request) {
    const params = this.client.callbackParams(req);

    const tokenSet = await this.client.callback(
      `${process.env.APP_URL}/oidc-callback`,
      params,
      {
        state: this.state,
        nonce: this.nonce,
      },
    );

    // set session
    session.tokenSet = tokenSet;

    console.log('received and validated tokens %j', tokenSet);

    // todo: complete with a call to userinfo endpoint
    // const userinfoResponse = await this.client.userinfo(tokenSet);
    // console.log('userinfo %j', userinfoResponse);
  }

  @Get('success')
  @Render('success')
  async success(@Session() session: Record<string, any>) {
    console.log('session %j', session);
    return {
      accessToken: session.tokenSet.access_token,
      idToken: session.tokenSet.id_token,
    };
  }
}
