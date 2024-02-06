import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BaseClient, Issuer } from 'openid-client';

@Injectable()
export class AppService {
  generateCode(): string {
    return randomUUID();
  }

  async createClient(): Promise<BaseClient> {
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
      id_token_signed_response_alg: 'ES256',
      userinfo_signed_response_alg: 'ES256',
    });
  }
}
