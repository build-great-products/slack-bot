import type { webApi } from '@slack/bolt'

const downloadFile =
  (client: webApi.WebClient) => async (slackFile: unknown) => {
    if (
      typeof slackFile === 'object' &&
      slackFile !== null &&
      'url_private' in slackFile &&
      typeof slackFile.url_private === 'string'
    ) {
      console.info(`Fetching attached file "${slackFile.url_private}".`)
      const response = await fetch(slackFile.url_private, {
        headers: {
          Authorization: `Bearer ${client.token}`,
        },
      })
      if (!response.ok) {
        console.error(
          `Failed to fetch file "${slackFile.url_private}". Received status code ${response.status}.`,
        )
        return undefined
      }
      const blob = await response.blob()
      const contentType = response.headers.get('Content-Type')?.split(';').at(0)

      const fileName =
        'name' in slackFile && typeof slackFile.name === 'string'
          ? slackFile.name
          : 'unknown'

      const file = new File([blob], fileName, { type: contentType })

      console.info(
        `Successfully fetched file "${file.name}" (${file.type}, ${file.size} bytes).`,
      )

      return file
    }
  }

export { downloadFile }
