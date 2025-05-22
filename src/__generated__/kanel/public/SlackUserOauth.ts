import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.slack_user_oauth */
export type SlackUserOauthState = string & { __brand: 'public.slack_user_oauth' };

/** Represents the table public.slack_user_oauth */
export default interface SlackUserOauthTable {
  state: ColumnType<SlackUserOauthState, SlackUserOauthState, SlackUserOauthState>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;

  slackUserId: ColumnType<string, string, string>;

  slackWorkspaceId: ColumnType<string, string, string>;

  slackWorkspaceUrl: ColumnType<string, string, string>;

  codeVerifier: ColumnType<string, string, string>;

  slackResponseUrl: ColumnType<string | null, string | null, string | null>;
}

export type SlackUserOauth = Selectable<SlackUserOauthTable>;

export type NewSlackUserOauth = Insertable<SlackUserOauthTable>;

export type SlackUserOauthUpdate = Updateable<SlackUserOauthTable>;