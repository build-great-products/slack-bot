--! Previous: -
--! Hash: sha1:ff8a3a8a8858d3a7396673d639e2d9dd2827d071

-- Migration: 2024-10-14-installation-store
DROP TABLE IF EXISTS slack_installation;

CREATE TABLE slack_installation (
  id         TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  value      TEXT NOT NULL
);

ALTER TABLE slack_installation
  ADD CONSTRAINT "slack_installation:primaryKey(id)"
  PRIMARY KEY (id);

-- Migration: 2024-10-26-user-access-token

-- Drop tables if they exist
DROP TABLE IF EXISTS slack_user_oauth;
DROP TABLE IF EXISTS slack_user;

-- Create slack_user table
CREATE TABLE slack_user (
  slack_workspace_id        TEXT NOT NULL,
  slack_user_id             TEXT NOT NULL,
  created_at                BIGINT NOT NULL,
  updated_at                BIGINT NOT NULL,
  slack_workspace_url       TEXT NOT NULL,
  rough_user_id             TEXT NOT NULL,
  rough_workspace_id        TEXT NOT NULL,
  rough_workspace_public_id TEXT NOT NULL,
  name                      TEXT NOT NULL,
  access_token              TEXT NOT NULL,
  access_token_expires_at   BIGINT NOT NULL,
  refresh_token             TEXT NOT NULL
);

ALTER TABLE slack_user
  ADD CONSTRAINT "slack_user:primaryKey(slack_workspace_id,slack_user_id)"
  PRIMARY KEY (slack_workspace_id, slack_user_id);

-- Create slack_user_oauth table
CREATE TABLE slack_user_oauth (
  state               TEXT NOT NULL,
  created_at          BIGINT NOT NULL,
  updated_at          BIGINT NOT NULL,
  slack_user_id       TEXT NOT NULL,
  slack_workspace_id  TEXT NOT NULL,
  slack_workspace_url TEXT NOT NULL,
  code_verifier       TEXT NOT NULL,
  slack_response_url  TEXT
);

ALTER TABLE slack_user_oauth
  ADD CONSTRAINT "slack_user_oauth:primaryKey(state)"
  PRIMARY KEY (state);

ALTER TABLE slack_user_oauth
  ADD CONSTRAINT "slack_user_oauth:foreignKey(slack_user_id,slack_workspace_id,slack_user)"
  FOREIGN KEY (slack_user_id, slack_workspace_id)
  REFERENCES slack_user (slack_user_id, slack_workspace_id);
