import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Issuer } from 'openid-client';

@Injectable()
export class AppService {
  generateCode(): string {
    return randomUUID();
  }

  async createClient() {
    const agentConnectIssuer = await Issuer.discover(
      process.env.AUTHORIZATION_SERVER_URL,
    );

    return new agentConnectIssuer.Client({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: [`${process.env['APP_URL']}/oidc-callback`],
      response_types: ['code'],
      claims: '{"id_token":{"amr":{"essential":true}}}',
      acr_values: 'eidas1',
    });
  }
}
