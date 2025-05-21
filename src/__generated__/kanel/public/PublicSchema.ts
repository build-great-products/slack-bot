import type { default as SlackInstallationTable } from './SlackInstallation';
import type { default as SlackUserTable } from './SlackUser';
import type { default as SlackUserOauthTable } from './SlackUserOauth';

export default interface PublicSchema {
  slackInstallation: SlackInstallationTable;

  slackUser: SlackUserTable;

  slackUserOauth: SlackUserOauthTable;
}