--! Previous: sha1:ff8a3a8a8858d3a7396673d639e2d9dd2827d071
--! Hash: sha1:175dc7c95e57505c6edb8faea957b6e997d82154

ALTER TABLE slack_user_oauth
  DROP CONSTRAINT IF EXISTS "slack_user_oauth:foreignKey(slack_user_id,slack_workspace_id,slack_user)";
