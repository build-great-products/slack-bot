import { createFactory } from 'test-fixture-factory'

import type { SlackUser, SlackUserId, SlackWorkspaceId } from '#src/database.ts'

const mockSlackUserFactory = createFactory<SlackUser>('MockSlackUser').fixture(
  async (_attrs, use) => {
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

    await use(slackUser)
  },
)

const mockSlackUser = mockSlackUserFactory.useValue

export { mockSlackUser }
