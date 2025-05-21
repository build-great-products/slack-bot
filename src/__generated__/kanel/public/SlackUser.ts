import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.slack_user */
export type SlackUserSlackWorkspaceId = string & { __brand: 'public.slack_user' };

/** Identifier type for public.slack_user */
export type SlackUserSlackUserId = string & { __brand: 'public.slack_user' };

/** Represents the table public.slack_user */
export default interface SlackUserTable {
  slackWorkspaceId: ColumnType<SlackUserSlackWorkspaceId, SlackUserSlackWorkspaceId, SlackUserSlackWorkspaceId>;

  slackUserId: ColumnType<SlackUserSlackUserId, SlackUserSlackUserId, SlackUserSlackUserId>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;

  slackWorkspaceUrl: ColumnType<string, string, string>;

  roughUserId: ColumnType<string, string, string>;

  roughWorkspaceId: ColumnType<string, string, string>;

  roughWorkspacePublicId: ColumnType<string, string, string>;

  name: ColumnType<string, string, string>;

  accessToken: ColumnType<string, string, string>;

  accessTokenExpiresAt: ColumnType<number, number, number>;

  refreshToken: ColumnType<string, string, string>;
}

export type SlackUser = Selectable<SlackUserTable>;

export type NewSlackUser = Insertable<SlackUserTable>;

export type SlackUserUpdate = Updateable<SlackUserTable>;