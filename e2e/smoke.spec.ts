import { expect, test } from '@playwright/test'

test.describe('app shell', () => {
  test('renders the home workspace without an algorithm selected', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Algorithm Visual Lab' }),
    ).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Algorithm categories' }),
    ).toBeVisible()
    await expect(page.getByRole('status')).toContainText(
      'No algorithm selected',
    )
    await expect(
      page.getByRole('region', { name: 'Playback controls' }),
    ).toBeVisible()
  })

  test('selects an algorithm from the sidebar', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Bubble Sort' }).click()

    await expect(page).toHaveURL(/#\/bubble-sort$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Bubble Sort' }),
    ).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Bubble Sort')
  })

  test('resolves hash deep links directly to an algorithm', async ({
    page,
  }) => {
    await page.goto('/#/binary-search')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Binary Search' }),
    ).toBeVisible()
  })

  test('supports the algorithm selector dropdown', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Algorithm', { exact: true }).selectOption('dijkstra')

    await expect(page).toHaveURL(/#\/dijkstra$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Dijkstra' }),
    ).toBeVisible()
  })
})
