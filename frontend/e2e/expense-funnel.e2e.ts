import { expect, test } from '@playwright/test';

type CreatedExpense = {
  accountBookId: number;
  expenseId: number;
};

test.describe('핵심 퍼널: 게스트 로그인 → 수동 지출 추가 → 홈 반영', () => {
  let createdExpense: CreatedExpense | null = null;

  test.afterEach(async ({ page }) => {
    if (!createdExpense) return;

    const response = await page.request.delete(
      `/api/account-books/${createdExpense.accountBookId}/expenses/${createdExpense.expenseId}`,
    );

    expect(response.ok()).toBeTruthy();
    createdExpense = null;
  });

  test('지출을 추가하면 홈 지출 목록에 반영된다', async ({ page }) => {
    const merchant = `E2E-지출-${Date.now()}`;

    await page.goto('/login');
    await page.getByRole('button', { name: '게스트로 로그인' }).click();
    await page.waitForURL('**/home');

    await page.getByRole('button', { name: '지출 내역 추가하기' }).click();
    await page.getByRole('button', { name: /직접 입력/ }).click();

    await page.getByPlaceholder('거래처를 입력해 주세요.').fill(merchant);

    // 환율 로드 전에 입력하면 현재 구현은 기준 금액을 0으로 계산한 뒤 재계산하지 않는다.
    await expect(page.getByText(/^[A-Z]{3} 1 = [A-Z]{3} /)).toBeVisible();

    const amountInputs = page.getByPlaceholder('0');
    await amountInputs.first().fill('10000');
    await expect(amountInputs.nth(1)).toHaveValue(/[1-9]/);

    const [response] = await Promise.all([
      page.waitForResponse(
        (candidate) =>
          candidate.url().includes('/expenses/manual') &&
          candidate.request().method() === 'POST' &&
          candidate.ok(),
      ),
      page.getByRole('button', { name: '저장' }).click(),
    ]);

    createdExpense = (await response.json()) as CreatedExpense;

    await expect(page.getByText(merchant, { exact: true })).toBeVisible();
  });
});
