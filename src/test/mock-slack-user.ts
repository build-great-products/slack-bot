import { defineFactory } from 'test-fixture-factory'

import type { SlackUser, SlackUserId, SlackWorkspaceId } from '#src/database.ts'

const slackUserFactory = defineFactory<
  Record<string, unknown>, // no deps
  void, // no attributes
  SlackUser // returns a slackUser instance
>(() => {
  const slackUser: SlackUser = {
    slackUserId: 'MOCK_SLACK_USER_ID' as SlackUserId,
    slackWorkspaceId: 'MOCK_SLACK_WORKSPACE_ID' as SlackWorkspaceId,
    roughUserId: 'MOCK_ROUGH_USER_ID',
    roughWorkspaceId: 'MOCK_ROUGH_WORKSPACE_ID',
    slackWorkspaceUrl: 'https://test.slack.com/team/',
    roughWorkspacePublicId: 'MOCK_ROUGH_WORKSPACE_PUBLIC_ID',
    name: 'MOCK_NAME',
    accessToken: 'xxx.access.token',
    accessTokenExpiresAt: Date.now() + 1000 * 60 * 30,
    refreshToken: 'xxx.refresh.token',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return {
    value: slackUser,
  }
})

const mockSlackUser = slackUserFactory.useValueFn

export { mockSlackUser }
