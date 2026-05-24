import { expect, test, type Page } from "@playwright/test";

const adminUrl = process.env.PLANORA_ADMIN_URL?.replace(/\/+$/, "");
const adminUsername = process.env.PLANORA_ADMIN_USERNAME;
const adminPassword = process.env.PLANORA_ADMIN_PASSWORD;

const hasAdminUrl = Boolean(adminUrl);
const hasAdminCredentials = Boolean(adminUsername && adminPassword);

test.describe("Planora admin smoke", () => {
  test.skip(!hasAdminUrl, "PLANORA_ADMIN_URL is required.");

  test("login page loads and empty validation does not call the API", async ({
    page,
  }) => {
    let loginApiCalls = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/auth/login")
      ) {
        loginApiCalls += 1;
      }
    });

    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();

    const usernameInput = page.locator("#admin-login-identifier");
    await expect(usernameInput).toHaveAttribute("name", "username");
    await expect(usernameInput).toHaveAttribute("autocomplete", "username");
    await expect(usernameInput).toHaveAttribute("required", "");

    const passwordInput = page.locator("#admin-login-password");
    await expect(passwordInput).toHaveAttribute("name", "password");
    await expect(passwordInput).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    await expect(passwordInput).toHaveAttribute("required", "");

    await page.getByRole("button", { name: /login to dashboard/i }).click();

    await expect(page.locator("#admin-login-error")).toContainText(
      "Enter your email/username and password.",
    );
    expect(loginApiCalls).toBe(0);
  });

  test.describe("authenticated flows", () => {
    test.skip(
      !hasAdminCredentials,
      "PLANORA_ADMIN_USERNAME and PLANORA_ADMIN_PASSWORD are required.",
    );

    test("admin can log in, refresh, open notifications, log out, and stay protected", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await expect(page).toHaveURL(/\/dashboard(?:\/)?(?:[?#].*)?$/);

      await page.reload();
      await expect(page).toHaveURL(/\/dashboard(?:\/)?(?:[?#].*)?$/);
      await expect(
        page.getByRole("button", { name: "Notifications" }),
      ).toBeVisible();

      await openNotificationDropdown(page, { width: 1440, height: 900 });

      await page
        .getByRole("button", { name: /^Logout$/ })
        .last()
        .click();
      await expect(page).toHaveURL(/\/login(?:[?#].*)?$/);

      const storageState = await page.evaluate(() => ({
        token: sessionStorage.getItem("planora_admin_token"),
        currentAdmin: localStorage.getItem("current_admin"),
      }));

      expect(storageState).toEqual({
        token: null,
        currentAdmin: null,
      });

      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login(?:[?#].*)?$/);
    });

    test("mobile notification dropdown stays inside the viewport", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await loginAsAdmin(page);

      await openNotificationDropdown(page, { width: 390, height: 844 });
    });
  });
});

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#admin-login-identifier").fill(adminUsername ?? "");
  await page.locator("#admin-login-password").fill(adminPassword ?? "");
  await page.getByRole("button", { name: /login to dashboard/i }).click();
  await page.waitForURL(/\/dashboard(?:\/)?(?:[?#].*)?$/, { timeout: 60_000 });
}

async function openNotificationDropdown(
  page: Page,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);

  const button = page.getByRole("button", { name: "Notifications" });
  await expect(button).toBeVisible();
  await button.click();

  await expect.poll(() => getNotificationDropdownBox(page)).not.toBeNull();

  const box = await getNotificationDropdownBox(page);
  expect(box).not.toBeNull();
  expect(box?.left).toBeGreaterThanOrEqual(0);
  expect(box?.right).toBeLessThanOrEqual(viewport.width);

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(viewport.width);

  await page.mouse.click(8, 8);
  await expect(button).toHaveAttribute("aria-expanded", "false");

  await button.click();
  await expect.poll(() => getNotificationDropdownBox(page)).not.toBeNull();

  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
}

async function getNotificationDropdownBox(page: Page) {
  return page.evaluate(() => {
    const title = Array.from(document.querySelectorAll("p")).find(
      (element) => element.textContent?.trim() === "Notifications",
    );

    let current: Element | null | undefined = title;

    while (current) {
      const text = current.textContent ?? "";

      if (text.includes("View all") && text.includes("Mark all read")) {
        const rect = current.getBoundingClientRect();

        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }

      current = current.parentElement;
    }

    return null;
  });
}
