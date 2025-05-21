import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.slack_installation */
export type SlackInstallationId = string & { __brand: 'public.slack_installation' };

/** Represents the table public.slack_installation */
export default interface SlackInstallationTable {
  id: ColumnType<SlackInstallationId, SlackInstallationId, SlackInstallationId>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;

  value: ColumnType<string, string, string>;
}

export type SlackInstallation = Selectable<SlackInstallationTable>;

export type NewSlackInstallation = Insertable<SlackInstallationTable>;

export type SlackInstallationUpdate = Updateable<SlackInstallationTable>;